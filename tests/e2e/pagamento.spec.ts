import { test, expect } from "../fixtures/payment-app";
import { Page } from "@playwright/test";

test.beforeEach(async ({ page, paymentApp }) => {
  paymentApp.faults.checkout = false;
  paymentApp.faults.reconciliation = false;
  const login = await page.request.post("/api/backend/auth/login", {
    headers: { Origin: paymentApp.origin },
    data: await paymentApp.customer(),
  });
  expect(login.ok()).toBeTruthy();
  const add = await page.request.post("/api/backend/pedido/carrinho", {
    headers: { Origin: paymentApp.origin },
    data: { produtoId: 101, quantidade: 1 },
  });
  expect(add.ok()).toBeTruthy();
  const update = await page.request.put("/api/backend/pedido/carrinho", {
    headers: { Origin: paymentApp.origin },
    data: {
      tipoRecebimento: "pickup",
      dataEntrega: paymentApp.slot,
      formaPagamento: "Pagamento online - Pix",
    },
  });
  expect(update.ok()).toBeTruthy();
});

async function finalize(page: Page, origin: string) {
  const response = await page.request.post("/api/backend/pedido/finalizar", {
    headers: { Origin: origin, "Idempotency-Key": `payment-${Date.now()}` },
    data: {},
  });
  expect(response.ok()).toBeTruthy();
  const order = await response.json();
  await page.goto(`/orderstatus?id=${order.id}`);
  await expect(
    page.getByRole("heading", { name: "Aguardando pagamento", exact: true }),
  ).toBeVisible();
  return order.id as number;
}

async function update(page: Page) {
  await page
    .getByRole("button", { name: "Atualizar pagamento", exact: true })
    .click();
}

test("seleção de pagamento recupera falha; expiração, aprovação tardia e estorno seguem a API", async ({
  page,
  paymentApp,
}) => {
  await page.route("**/api/backend/pagamento/metodos", (route) =>
    route.fulfill({ status: 503, json: { message: "Indisponível" } }),
  );
  await page.goto("/formofpayment");
  await expect(
    page.getByText("Não foi possível consultar as formas de pagamento.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute("**/api/backend/pagamento/metodos");
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Pagamento online", exact: true })
    .click();
  await page.getByRole("button", { name: /Pix/ }).click();
  await expect(page).toHaveURL(`${paymentApp.origin}/checkout`);
  const sent = page.waitForResponse((r) =>
    r.url().endsWith("/pedido/finalizar"),
  );
  await page.getByRole("button", { name: /Enviar pedido/ }).click();
  const result = await sent;
  expect(result.ok()).toBeTruthy();
  const order = await result.json();
  const id = order.id;
  await expect(page).toHaveURL(`${paymentApp.origin}/orderstatus?id=${id}`);
  expect(await paymentApp.reserved()).toBe(1);
  const checkout = await page.request.post(
    `/api/backend/pagamento/${id}/checkout`,
    { headers: { Origin: paymentApp.origin } },
  );
  expect(checkout.ok()).toBeTruthy();
  await paymentApp.setDeadline(id, Date.now() - 1000);
  paymentApp.faults.reconciliation = true;
  await paymentApp.reconcile(id);
  await update(page);
  await expect(
    page.getByText(/Prazo encerrado\. Estamos conferindo/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pagar com Mercado Pago", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Pedido enviado", exact: true }),
  ).toBeVisible();
  expect(await paymentApp.reserved()).toBe(1);
  paymentApp.faults.reconciliation = false;
  await paymentApp.setDeadline(id, Date.now() - 1000);
  await paymentApp.reconcile(id);
  await update(page);
  await expect(
    page.getByRole("heading", { name: "Pedido cancelado", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Prazo de pagamento encerrado",
      exact: true,
    }),
  ).toBeVisible();
  expect(await paymentApp.reserved()).toBe(0);
  await paymentApp.notify(id, "approved");
  await update(page);
  await expect(
    page.getByRole("heading", { name: "Estorno pendente", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/O pagamento foi confirmado após o cancelamento/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pagar com Mercado Pago", exact: true }),
  ).toHaveCount(0);
  await paymentApp.notify(id, "refunded");
  await update(page);
  await expect(
    page.getByRole("heading", { name: "Estorno confirmado", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/O pagamento foi confirmado após o cancelamento/),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Pedido cancelado", exact: true }),
  ).toBeVisible();
  expect(await paymentApp.reserved()).toBe(0);
});

test("falha no provedor permite tentar novamente sem novo pedido", async ({
  page,
  paymentApp,
}) => {
  const id = await finalize(page, paymentApp.origin);
  paymentApp.faults.checkout = true;
  await page
    .getByRole("button", { name: "Pagar com Mercado Pago", exact: true })
    .click();
  await expect(
    page.getByText("Provedor temporariamente indisponível.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(`${paymentApp.origin}/orderstatus?id=${id}`);
  paymentApp.faults.checkout = false;
  // O navegador nunca acessa o provedor: a navegação é interceptada localmente.
  await page.route("https://sandbox.mercadopago.com.br/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Checkout de teste</h1>",
    }),
  );
  await page
    .getByRole("button", { name: "Pagar com Mercado Pago", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Checkout de teste", exact: true }),
  ).toBeVisible();
  await page.goto(`${paymentApp.origin}/orderstatus?id=${id}`);
  await paymentApp.notify(id, "approved");
  await update(page);
  await expect(
    page.getByRole("heading", { name: "Pagamento confirmado", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pagar com Mercado Pago", exact: true }),
  ).toHaveCount(0);
});

test("falha de atualização mantém resumo e bloqueia pagamento até nova consulta", async ({
  page,
  paymentApp,
}) => {
  const id = await finalize(page, paymentApp.origin);
  await page.route(`**/api/backend/pedido/${id}`, (route) =>
    route.fulfill({ status: 503, json: { message: "API indisponível" } }),
  );
  await update(page);
  await expect(
    page.getByText(/Os dados abaixo são da última consulta/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Resumo do pedido", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pagar com Mercado Pago", exact: true }),
  ).toBeDisabled();
  await page.unroute(`**/api/backend/pedido/${id}`);
  await update(page);
  await expect(
    page.getByRole("button", { name: "Pagar com Mercado Pago", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText(/Os dados abaixo são da última consulta/),
  ).toHaveCount(0);
});
