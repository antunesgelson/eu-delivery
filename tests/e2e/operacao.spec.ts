import { APIRequestContext, BrowserContext, Page } from "@playwright/test";
import { test, expect } from "../fixtures/payment-app";

test.use({ integrationSuite: "operacao", timezoneId: "America/Sao_Paulo" });
let customer: BrowserContext;
let client: APIRequestContext;
let shop: Page;
let origin: string;

let adminCookies: Awaited<
  ReturnType<APIRequestContext["storageState"]>
>["cookies"];
test.beforeAll(async ({ playwright, paymentApp }) => {
  const admin = await playwright.request.newContext({
    baseURL: paymentApp.origin,
  });
  try {
    expect(
      (
        await admin.post("/api/backend/auth/login", {
          headers: { Origin: paymentApp.origin },
          data: await paymentApp.customer(true),
        })
      ).ok(),
    ).toBeTruthy();
    adminCookies = (await admin.storageState()).cookies;
  } finally {
    await admin.dispose();
  }
});

test.beforeEach(async ({ page, browser, paymentApp }) => {
  origin = paymentApp.origin;
  // Reaproveita a sessão administrativa sem exceder o limite real de login por IP.
  await page.context().addCookies(adminCookies);
  customer = await browser.newContext({ baseURL: origin });
  client = customer.request;
  expect(
    (
      await client.post("/api/backend/auth/login", {
        headers: { Origin: origin },
        data: await paymentApp.customer(),
      })
    ).ok(),
  ).toBeTruthy();
  shop = await customer.newPage();
});
test.afterEach(async () => {
  await customer?.close();
});

async function createOrder(slot: string, online = false) {
  const headers = { Origin: origin };
  expect(
    (
      await client.post("/api/backend/pedido/carrinho", {
        headers,
        data: { produtoId: 101, quantidade: 1 },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await client.put("/api/backend/pedido/carrinho", {
        headers,
        data: {
          tipoRecebimento: "pickup",
          dataEntrega: slot,
          formaPagamento: online
            ? "Pagamento online - Pix"
            : "Pagamento na Entrega - Dinheiro",
        },
      })
    ).ok(),
  ).toBeTruthy();
  const response = await client.post("/api/backend/pedido/finalizar", {
    headers: { ...headers, "Idempotency-Key": `operation-${Date.now()}` },
    data: {},
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).id as number;
}
function card(page: Page, id: number) {
  return page
    .getByRole("article")
    .filter({ has: page.getByText(`#${id}`, { exact: true }) });
}
async function scheduled(page: Page, id: number) {
  await page.goto("/admin/dashboard?view=scheduled");
  await page
    .getByRole("button")
    .filter({ has: page.getByText(`#${id}`, { exact: true }) })
    .click();
}
async function refreshShop() {
  await shop
    .getByRole("button", { name: "Atualizar pagamento", exact: true })
    .click();
  await expect(
    shop.getByRole("button", { name: "Atualizar pagamento", exact: true }),
  ).toBeEnabled();
}
async function getOrder(id: number) {
  const response = await client.get(`/api/backend/pedido/${id}`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test("produção, pagamento no recebimento e conclusão atualizam cliente e benefícios uma única vez", async ({
  page,
  paymentApp,
}) => {
  const id = await createOrder(paymentApp.slot);
  await shop.goto(`/orderstatus?id=${id}`);
  await scheduled(page, id);
  await page.route(`**/api/backend/admin/pedidos/${id}/status`, (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Operação indisponível." },
    }),
  );
  await page
    .getByRole("button", { name: "Enviar para produção", exact: true })
    .click();
  await expect(
    page.getByText("Operação indisponível.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enviar para produção", exact: true }),
  ).toBeEnabled();
  expect((await getOrder(id)).status).toBe("analysis");
  await page.unroute(`**/api/backend/admin/pedidos/${id}/status`);
  await page
    .getByRole("button", { name: "Enviar para produção", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Selecione um pedido", exact: true }),
  ).toBeVisible();
  await refreshShop();
  await expect(
    shop.getByRole("heading", { name: "Em preparo", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/dashboard");
  await card(page, id)
    .getByRole("button", { name: "Marcar pronto", exact: true })
    .click();
  await expect(
    card(page, id).getByRole("button", { name: "Finalizar", exact: true }),
  ).toBeDisabled();
  await refreshShop();
  await expect(
    shop.getByRole("heading", { name: "Pronto para retirada", exact: true }),
  ).toBeVisible();
  await card(page, id)
    .getByRole("button", { name: "Detalhes", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const payment = dialog.getByRole("switch", {
    name: "Confirmar pagamento no recebimento",
    exact: true,
  });
  await expect(
    dialog.getByRole("button", { name: "Finalizar pedido", exact: true }),
  ).toBeDisabled();
  let calls = 0;
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    `**/api/backend/admin/pedidos/${id}/pagamento`,
    async (route) => {
      calls++;
      await held;
      await route.continue();
    },
  );
  await payment.click();
  await expect(payment).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "Cancelar pedido", exact: true }),
  ).toBeDisabled();
  release();
  await expect(payment).toBeChecked();
  await expect(payment).toBeDisabled();
  expect(calls).toBe(1);
  await refreshShop();
  await expect(
    shop.getByRole("heading", { name: "Pagamento confirmado", exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Fechar detalhes do pedido", exact: true })
    .click();
  await card(page, id)
    .getByRole("button", { name: "Finalizar", exact: true })
    .click();
  await expect(card(page, id)).toHaveCount(0);
  await refreshShop();
  await expect(
    shop.getByRole("heading", { name: "Finalizado", exact: true }),
  ).toBeVisible();
  expect((await getOrder(id)).status).toBe("completed");
  const benefits = await (
    await client.get("/api/backend/usuario/beneficios")
  ).json();
  expect(benefits.cashbackBalance).toBe(1.95);
  expect(benefits.loyaltyCurrentOrders).toBe(1);
});

test("cancelamento mantém detalhes após falha e reconcilia resposta perdida sem devolver estoque duas vezes", async ({
  page,
  paymentApp,
}) => {
  const before = await paymentApp.reserved();
  const id = await createOrder(paymentApp.slot);
  expect(await paymentApp.reserved()).toBe(before + 1);
  // Coloca o pedido na operação para verificar o modal usado no dia de atendimento.
  expect(
    (
      await page.request.patch(`/api/backend/admin/pedidos/${id}/status`, {
        headers: { Origin: origin },
        data: { status: "production" },
      })
    ).ok(),
  ).toBeTruthy();
  await shop.goto(`/orderstatus?id=${id}`);
  await page.goto("/admin/dashboard");
  await card(page, id)
    .getByRole("button", { name: "Detalhes", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await page.route(`**/api/backend/admin/pedidos/${id}/status`, (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Cancelamento indisponível." },
    }),
  );
  await dialog
    .getByRole("button", { name: "Cancelar pedido", exact: true })
    .click();
  await expect(
    page.getByText("Cancelamento indisponível.", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Cancelar pedido", exact: true }),
  ).toBeEnabled();
  expect((await getOrder(id)).status).toBe("production");
  await page.unroute(`**/api/backend/admin/pedidos/${id}/status`);
  let calls = 0;
  await page.route(
    `**/api/backend/admin/pedidos/${id}/status`,
    async (route) => {
      calls++;
      expect((await route.fetch()).ok()).toBeTruthy();
      await route.fulfill({
        status: 502,
        json: { message: "Resposta perdida." },
      });
    },
  );
  await dialog
    .getByRole("button", { name: "Cancelar pedido", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(card(page, id)).toHaveCount(0);
  expect(calls).toBe(1);
  expect(await paymentApp.reserved()).toBe(before);
  await refreshShop();
  await expect(
    shop.getByRole("heading", { name: "Pedido cancelado", exact: true }),
  ).toBeVisible();
});

test("pagamento online exige confirmação do provedor antes da produção e não permite confirmação manual", async ({
  page,
  paymentApp,
}) => {
  const id = await createOrder(paymentApp.slot, true);
  await scheduled(page, id);
  await page
    .getByRole("button", { name: "Enviar para produção", exact: true })
    .click();
  await expect(
    page.getByText(
      "Aguarde a confirmação do pagamento online antes de produzir.",
      { exact: true },
    ),
  ).toBeVisible();
  expect((await getOrder(id)).status).toBe("analysis");
  expect(
    (
      await client.post(`/api/backend/pagamento/${id}/checkout`, {
        headers: { Origin: origin },
      })
    ).ok(),
  ).toBeTruthy();
  await paymentApp.notify(id, "approved");
  await page
    .getByRole("button", { name: "Enviar para produção", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Selecione um pedido", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/dashboard");
  await card(page, id)
    .getByRole("button", { name: "Detalhes", exact: true })
    .click();
  const payment = page.getByRole("dialog").getByRole("switch", {
    name: "Confirmar pagamento no recebimento",
    exact: true,
  });
  await expect(payment).toBeChecked();
  await expect(payment).toBeDisabled();
  await expect(
    page.getByText(
      "O pagamento online é confirmado automaticamente pelo provedor.",
      { exact: true },
    ),
  ).toBeVisible();
});

test("falha de atualização preserva cartões e bloqueia ações até recuperar a consulta", async ({
  page,
  paymentApp,
}) => {
  const id = await createOrder(paymentApp.slot);
  expect(
    (
      await page.request.patch(`/api/backend/admin/pedidos/${id}/status`, {
        headers: { Origin: origin },
        data: { status: "production" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/admin/dashboard");
  await expect(card(page, id)).toBeVisible();
  await page.route("**/api/backend/admin/pedidos?**", (route) =>
    route.fulfill({ status: 503, json: { message: "Consulta indisponível." } }),
  );
  await page
    .getByRole("button", { name: "Atualizar pedidos", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Os dados são da última consulta" }),
  ).toBeVisible();
  await expect(card(page, id)).toBeVisible();
  await expect(
    card(page, id).getByRole("button", { name: "Marcar pronto", exact: true }),
  ).toBeDisabled();
  await page.unroute("**/api/backend/admin/pedidos?**");
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(
    card(page, id).getByRole("button", { name: "Marcar pronto", exact: true }),
  ).toBeEnabled();
  expect((await getOrder(id)).status).toBe("production");
});

test("envio em lote interrompe após falha e retoma apenas pedidos ainda agendados", async ({
  page,
  paymentApp,
}) => {
  const ids = [
    await createOrder(paymentApp.slot),
    await createOrder(paymentApp.slot),
    await createOrder(paymentApp.slot),
  ];
  await page.goto("/admin/dashboard?view=scheduled");
  const sent: number[] = [];
  await page.route("**/api/backend/admin/pedidos/*/status", async (route) => {
    const id = Number(route.request().url().split("/").at(-2));
    sent.push(id);
    if (sent.length === 2)
      await route.fulfill({
        status: 503,
        json: { message: "Lote interrompido." },
      });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Enviar todos", exact: true }).click();
  await expect(
    page.getByText("Lote interrompido.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Enviar todos", exact: true }),
  ).toBeEnabled();
  expect(sent).toHaveLength(2);
  expect((await getOrder(sent[0])).status).toBe("production");
  for (const id of ids.filter((id) => id !== sent[0]))
    expect((await getOrder(id)).status).toBe("analysis");
  await page.unroute("**/api/backend/admin/pedidos/*/status");
  const retried: number[] = [];
  await page.route("**/api/backend/admin/pedidos/*/status", async (route) => {
    retried.push(Number(route.request().url().split("/").at(-2)));
    await route.continue();
  });
  await page.getByRole("button", { name: "Enviar todos", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enviar todos", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Salvando alteração do pedido…", { exact: true }),
  ).toHaveCount(0);
  expect(retried.sort()).toEqual(ids.filter((id) => id !== sent[0]).sort());
  for (const id of ids) expect((await getOrder(id)).status).toBe("production");
});
