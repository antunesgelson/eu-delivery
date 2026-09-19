import { APIRequestContext, BrowserContext, Page } from "@playwright/test";
import { test, expect } from "../fixtures/payment-app";

test.use({ integrationSuite: "agendamento", timezoneId: "Asia/Tokyo" });
let customer: BrowserContext;
let client: APIRequestContext;
let orderId: number;

function addDays(slot: string, days: number) {
  const date = new Date(slot);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
async function openScheduled(page: Page) {
  await page.goto("/admin/dashboard?view=scheduled");
  await page
    .getByRole("button")
    .filter({ has: page.getByText(`#${orderId}`, { exact: true }) })
    .click();
  await page
    .getByRole("button", { name: "Editar agendamento", exact: true })
    .click();
  return page.getByRole("dialog", {
    name: `Editar pedido #${orderId}`,
    exact: true,
  });
}

test.beforeEach(async ({ page, browser, paymentApp }) => {
  const headers = { Origin: paymentApp.origin };
  expect(
    (
      await page.request.post("/api/backend/auth/login", {
        headers,
        data: await paymentApp.customer(true),
      })
    ).ok(),
  ).toBeTruthy();
  customer = await browser.newContext({
    baseURL: paymentApp.origin,
    timezoneId: "America/Sao_Paulo",
  });
  client = customer.request;
  expect(
    (
      await client.post("/api/backend/auth/login", {
        headers,
        data: await paymentApp.customer(),
      })
    ).ok(),
  ).toBeTruthy();
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
          dataEntrega: paymentApp.slot,
          formaPagamento: "Pagamento na Entrega - Dinheiro",
        },
      })
    ).ok(),
  ).toBeTruthy();
  const response = await client.post("/api/backend/pedido/finalizar", {
    headers: { ...headers, "Idempotency-Key": `schedule-${Date.now()}` },
    data: {},
  });
  expect(response.ok()).toBeTruthy();
  orderId = (await response.json()).id;
});
test.afterEach(async ({ page, paymentApp }) => {
  try {
    expect(
      (
        await page.request.patch(
          `/api/backend/admin/pedidos/${orderId}/status`,
          {
            headers: { Origin: paymentApp.origin },
            data: { status: "cancelled" },
          },
        )
      ).ok(),
    ).toBeTruthy();
  } finally {
    await customer?.close();
  }
});

test("listagem e horários recuperam falhas; remarcação atualiza painel, cliente e reserva", async ({
  page,
  paymentApp,
}) => {
  await page.route("**/api/backend/admin/pedidos?**", (route) =>
    route.fulfill({ status: 503, json: { message: "Consulta indisponível." } }),
  );
  await page.goto("/admin/dashboard?view=scheduled");
  await page
    .getByRole("button", {
      name: "Falha ao carregar pedidos. Tentar novamente",
      exact: true,
    })
    .waitFor();
  await page.unroute("**/api/backend/admin/pedidos?**");
  await page
    .getByRole("button", {
      name: "Falha ao carregar pedidos. Tentar novamente",
      exact: true,
    })
    .click();
  await page
    .getByRole("button")
    .filter({ has: page.getByText(`#${orderId}`, { exact: true }) })
    .click();
  await page.route("**/api/backend/pedido/horarios/**", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Horários indisponíveis." },
    }),
  );
  await page
    .getByRole("button", { name: "Editar agendamento", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: `Editar pedido #${orderId}`,
    exact: true,
  });
  await expect(
    dialog.getByText("Não foi possível consultar os horários.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Salvar", exact: true }),
  ).toBeDisabled();
  await dialog
    .getByLabel("Observação", { exact: true })
    .fill("Remarcação combinada com o cliente");
  await page.unroute("**/api/backend/pedido/horarios/**");
  await dialog
    .getByRole("button", { name: "Tentar novamente os horários", exact: true })
    .click();
  await dialog
    .getByLabel("Data", { exact: true })
    .fill(addDays(paymentApp.slot, 2));
  await expect(
    dialog.getByText(
      "Nenhum horário disponível nesta data. Escolha outra data.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Salvar", exact: true }),
  ).toBeDisabled();
  const destination = addDays(paymentApp.slot, 7);
  await dialog.getByLabel("Data", { exact: true }).fill(destination);
  await expect(dialog.getByLabel("Horário", { exact: true })).toHaveValue("");
  await dialog.getByLabel("Horário", { exact: true }).selectOption("12:00");
  await page.route(`**/api/backend/admin/pedidos/${orderId}`, (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Não foi possível remarcar agora." },
    }),
  );
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    page.getByText("Não foi possível remarcar agora.", { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Data", { exact: true })).toHaveValue(
    destination,
  );
  await expect(dialog.getByLabel("Observação", { exact: true })).toHaveValue(
    "Remarcação combinada com o cliente",
  );
  await page.unroute(`**/api/backend/admin/pedidos/${orderId}`);
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/admin/pedidos/${orderId}`) &&
      r.request().method() === "PATCH",
  );
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  const saved = await response;
  expect(saved.ok()).toBeTruthy();
  expect(saved.request().postDataJSON().dataEntrega).toBe(
    `${destination}T12:00:00-03:00`,
  );
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText("Remarcação combinada com o cliente", { exact: true }),
  ).toBeVisible();
  expect(await paymentApp.stockForDate(paymentApp.slot.slice(0, 10))).toBe(0);
  expect(await paymentApp.stockForDate(destination)).toBe(1);
  const clientPage = await customer.newPage();
  await clientPage.goto(`/orderstatus?id=${orderId}`);
  await expect(
    clientPage.getByText(
      `${destination.slice(5).split("-").reverse().join("/")}, 12:00`,
      { exact: true },
    ),
  ).toBeVisible();
});

test("falta de estoque na nova data mantém pedido e reserva originais e permite correção", async ({
  page,
  paymentApp,
}) => {
  const destination = addDays(paymentApp.slot, 14);
  await paymentApp.setStockCapacity(destination, 0);
  const dialog = await openScheduled(page);
  await dialog.getByLabel("Data", { exact: true }).fill(destination);
  await dialog.getByLabel("Horário", { exact: true }).selectOption("12:00");
  await dialog
    .getByLabel("Observação", { exact: true })
    .fill("Manter edição após conflito");
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    page.getByText(
      `Estoque insuficiente de Frango teste para ${destination}.`,
      { exact: true },
    ),
  ).toBeVisible();
  expect(await paymentApp.stockForDate(paymentApp.slot.slice(0, 10))).toBe(1);
  expect(await paymentApp.stockForDate(destination)).toBe(0);
  const unchanged = await (
    await client.get(`/api/backend/pedido/${orderId}`)
  ).json();
  expect(new Date(unchanged.dataEntrega).getTime()).toBe(
    new Date(paymentApp.slot).getTime(),
  );
  await expect(dialog.getByLabel("Observação", { exact: true })).toHaveValue(
    "Manter edição após conflito",
  );
  await paymentApp.setStockCapacity(destination, 100);
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(await paymentApp.stockForDate(destination)).toBe(1);
});

test("pedido em produção permite somente observação e mantém o horário", async ({
  page,
  paymentApp,
}) => {
  const headers = { Origin: paymentApp.origin };
  expect(
    (
      await page.request.patch(`/api/backend/admin/pedidos/${orderId}/status`, {
        headers,
        data: { status: "production" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/admin/dashboard");
  const card = page
    .getByRole("article")
    .filter({ has: page.getByText(`#${orderId}`, { exact: true }) });
  await card.getByRole("button", { name: "Detalhes", exact: true }).click();
  await page
    .getByRole("button", { name: "Editar agendamento", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: `Editar pedido #${orderId}`,
    exact: true,
  });
  await expect(dialog.getByLabel("Data", { exact: true })).toBeDisabled();
  await expect(dialog.getByLabel("Horário", { exact: true })).toBeDisabled();
  await dialog.getByLabel("Observação", { exact: true }).fill("a".repeat(501));
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    dialog.getByText("Use até 500 caracteres.", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByLabel("Observação", { exact: true })
    .fill("Sem alteração de horário");
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/admin/pedidos/${orderId}`) &&
      r.request().method() === "PATCH",
  );
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  const saved = await response;
  expect(saved.ok()).toBeTruthy();
  expect(saved.request().postDataJSON()).toEqual({
    obs: "Sem alteração de horário",
  });
  await expect(dialog).not.toBeVisible();
  const changed = await (
    await client.get(`/api/backend/pedido/${orderId}`)
  ).json();
  expect(changed.obs).toBe("Sem alteração de horário");
  expect(new Date(changed.dataEntrega).getTime()).toBe(
    new Date(paymentApp.slot).getTime(),
  );
});
