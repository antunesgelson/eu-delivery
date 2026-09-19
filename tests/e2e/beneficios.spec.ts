import { APIRequestContext, Page } from "@playwright/test";
import { test, expect } from "../fixtures/payment-app";

test.use({ integrationSuite: "beneficios", timezoneId: "America/Sao_Paulo" });
let admin: APIRequestContext;

test.beforeAll(async ({ playwright, paymentApp }) => {
  admin = await playwright.request.newContext({
    baseURL: paymentApp.origin,
    extraHTTPHeaders: { Origin: paymentApp.origin },
  });
  expect(
    (
      await admin.post("/api/backend/auth/login", {
        data: await paymentApp.customer(true),
      })
    ).ok(),
  ).toBeTruthy();
});
test.afterAll(async () => {
  await admin?.dispose();
});

async function login(
  page: Page,
  origin: string,
  credentials: { email: string; senha: string },
) {
  const response = await page.request.post("/api/backend/auth/login", {
    headers: { Origin: origin },
    data: credentials,
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).user.id as number;
}
async function order(
  page: Page,
  origin: string,
  slot: string,
  online = false,
  cashBack = 0,
) {
  const headers = { Origin: origin };
  expect(
    (
      await page.request.post("/api/backend/pedido/carrinho", {
        headers,
        data: { produtoId: 101, quantidade: 1 },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await page.request.put("/api/backend/pedido/carrinho", {
        headers,
        data: {
          tipoRecebimento: "pickup",
          dataEntrega: slot,
          formaPagamento: online
            ? "Pagamento online - Pix"
            : "Pagamento na Entrega - Dinheiro",
          cashBack,
        },
      })
    ).ok(),
  ).toBeTruthy();
  const response = await page.request.post("/api/backend/pedido/finalizar", {
    headers: { ...headers, "Idempotency-Key": `benefits-${Date.now()}` },
    data: {},
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).id as number;
}
async function complete(id: number, online = false) {
  if (!online)
    expect(
      (
        await admin.patch(`/api/backend/admin/pedidos/${id}/pagamento`, {
          data: { paymentStatus: "paid" },
        })
      ).ok(),
    ).toBeTruthy();
  for (const status of ["production", "ready", "completed"]) {
    expect(
      (
        await admin.patch(`/api/backend/admin/pedidos/${id}/status`, {
          data: { status },
        })
      ).ok(),
    ).toBeTruthy();
  }
}
async function refresh(page: Page) {
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/usuario/beneficios"),
  );
  await page
    .getByRole("button", { name: "Atualizar benefícios", exact: true })
    .click();
  await response;
  await expect(
    page.getByRole("button", { name: "Atualizar benefícios", exact: true }),
  ).toBeEnabled();
}

test("seis pedidos pagos e concluídos geram cashback e prêmio; entrega administrativa atualiza a fidelidade", async ({
  page,
  paymentApp,
}) => {
  const userId = await login(
    page,
    paymentApp.origin,
    await paymentApp.customer(),
  );
  await page.goto("/cashback");
  await expect(
    page.getByText("Nenhuma movimentação de cashback ainda.", { exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 5; i++)
    await complete(await order(page, paymentApp.origin, paymentApp.slot));
  await refresh(page);
  await expect(page.getByText("R$ 9,75", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Histórico de cashback", exact: true })
      .getByRole("listitem"),
  ).toHaveCount(5);
  await page.getByRole("button", { name: "Fidelidade", exact: true }).click();
  await expect(
    page.getByText(
      "Falta 1 pedido pago e concluído para o próximo prêmio.",
      { exact: true },
    ),
  ).toBeVisible();
  await complete(await order(page, paymentApp.origin, paymentApp.slot));
  await refresh(page);
  await expect(
    page.getByRole("heading", {
      name: "Você tem 1 prêmio disponível",
      exact: true,
    }),
  ).toBeVisible();
  const benefitsResponse = await page.request.get(
    "/api/backend/usuario/beneficios",
  );
  const benefits = await benefitsResponse.json();
  expect(benefits.cashbackBalance).toBe(11.7);
  expect(benefits.loyaltyCurrentOrders).toBe(0);
  const prize = benefits.premios[0];
  const region = page.getByRole("region", {
    name: "Seus prêmios",
    exact: true,
  });
  await expect(
    region.getByText(`Prêmio #${prize.id}`, { exact: true }),
  ).toBeVisible();
  await expect(region.getByText("Disponível", { exact: true })).toBeVisible();
  expect(
    (
      await page.request.post(
        `/api/backend/admin/clientes/${userId}/premios/${prize.id}/resgatar`,
        { headers: { Origin: paymentApp.origin } },
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await admin.post(
        `/api/backend/admin/clientes/${userId}/premios/${prize.id}/resgatar`,
      )
    ).ok(),
  ).toBeTruthy();
  await refresh(page);
  await expect(region.getByText("Entregue", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Você tem 1 prêmio disponível",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Fidelidade", exact: true }).click();
  await expect(region.getByText("Entregue", { exact: true })).toBeVisible();
});

test("uso, estorno e cancelamento conciliam o extrato e mostram saldo negativo sem permitir uso", async ({
  page,
  paymentApp,
}) => {
  await login(page, paymentApp.origin, await paymentApp.customer());
  const original = await order(page, paymentApp.origin, paymentApp.slot, true);
  expect(
    (
      await page.request.post(`/api/backend/pagamento/${original}/checkout`, {
        headers: { Origin: paymentApp.origin },
      })
    ).ok(),
  ).toBeTruthy();
  await paymentApp.notify(original, "approved");
  await complete(original, true);
  const next = await order(
    page,
    paymentApp.origin,
    paymentApp.slot,
    false,
    1.95,
  );
  await page.goto("/cashback");
  const history = page.getByRole("region", {
    name: "Histórico de cashback",
    exact: true,
  });
  await expect(
    history.getByText("Cashback recebido", { exact: true }),
  ).toBeVisible();
  await expect(
    history.getByText("Cashback utilizado", { exact: true }),
  ).toBeVisible();
  await paymentApp.notify(original, "refunded");
  await refresh(page);
  await expect(
    page.getByText(/Seu saldo está negativo após a reversão de benefícios/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Sem saldo disponível para usar",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "Utilizar cashback", exact: true }),
  ).toHaveCount(0);
  await expect(
    history.getByText("Crédito revertido após estorno", { exact: true }),
  ).toBeVisible();
  const negative = await (
    await page.request.get("/api/backend/usuario/beneficios")
  ).json();
  expect(negative.cashbackBalance).toBe(-1.95);
  expect(negative.loyaltyCurrentOrders).toBe(0);
  expect(
    (
      await admin.patch(`/api/backend/admin/pedidos/${next}/status`, {
        data: { status: "cancelled" },
      })
    ).ok(),
  ).toBeTruthy();
  await refresh(page);
  await expect(
    history.getByText("Cashback devolvido", { exact: true }),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/backend/usuario/beneficios")).json())
      .cashbackBalance,
  ).toBe(0);
  await history
    .getByRole("link", { name: `Pedido #${next}`, exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(`${paymentApp.origin}/orderstatus?id=${next}`);
  await expect(
    page.getByRole("heading", { name: "Pedido cancelado", exact: true }),
  ).toBeVisible();
});

test("falhas inicial e de atualização permitem recuperar benefícios preservando a última consulta", async ({
  page,
  paymentApp,
}) => {
  await login(page, paymentApp.origin, await paymentApp.customer(false, 1000));
  await page.route("**/api/backend/usuario/beneficios", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Benefícios indisponíveis." },
    }),
  );
  await page.goto("/cashback");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Não foi possível carregar seus benefícios." }),
  ).toBeVisible();
  await page.unroute("**/api/backend/usuario/beneficios");
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(page.getByText("R$ 10,00", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Utilizar cashback", exact: true }),
  ).toBeVisible();
  await page.route("**/api/backend/usuario/beneficios", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Benefícios indisponíveis." },
    }),
  );
  await refresh(page);
  await expect(
    page.getByText(/Os valores exibidos são da última consulta/),
  ).toBeVisible();
  await expect(page.getByText("R$ 10,00", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Atualize os benefícios para usar o saldo",
      exact: true,
    }),
  ).toBeDisabled();
  await page.unroute("**/api/backend/usuario/beneficios");
  await refresh(page);
  await expect(
    page.getByText(/Os valores exibidos são da última consulta/),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Utilizar cashback", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fidelidade", exact: true }).click();
  await expect(
    page.getByText("Nenhum prêmio disponível ou entregue neste momento.", {
      exact: true,
    }),
  ).toBeVisible();
});
