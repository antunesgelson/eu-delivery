import { test, expect, Page, BrowserContext } from "@playwright/test";

// Execute somente com a API local em AUTH_DELIVERY_MODE=development.
const origin = process.env.E2E_BASE_URL || "http://localhost:4051";
const backend = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4052";
const email = process.env.E2E_ADMIN_EMAIL;
const senha = process.env.E2E_ADMIN_PASSWORD;
const run = Date.now().toString();
const nome = `Cliente PDV E2E ${run}`;
const tel = `55489${run.slice(-8)}`;
const coupon = `E2E${run}`;
let clienteId: number;
let addressId: number;
let couponId: string;
let adminToken: string;
let sessionCookies: Parameters<BrowserContext["addCookies"]>[0] = [];
const orders: number[] = [];
const drafts: number[] = [];

test.beforeAll(async ({ request }) => {
  for (const url of [origin, backend]) {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
      throw new Error("Esta suíte exige serviços locais.");
  }
  if (!email || !senha)
    throw new Error(
      "Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD para o administrador local.",
    );
  const login = await request.post(`${backend}/auth/login`, {
    data: { email, senha },
  });
  expect(login.ok()).toBeTruthy();
  const admin = (await login.json()).token;
  adminToken = admin;
  const session = await request.post(`${origin}/api/backend/auth/login`, {
    headers: { Origin: origin },
    data: { email, senha },
  });
  expect(session.ok()).toBeTruthy();
  sessionCookies = (await request.storageState()).cookies;
  const cliente = await request.post(`${backend}/admin/clientes`, {
    headers: { Authorization: `Bearer ${admin}` },
    data: { nome, tel },
  });
  expect(cliente.ok()).toBeTruthy();
  clienteId = (await cliente.json()).id;
  const otp = await request.post(`${backend}/auth/wp`, { data: { tel } });
  const challenge = await otp.json();
  expect(
    challenge.developmentCode,
    "A API precisa usar o modo de desenvolvimento",
  ).toBeTruthy();
  const auth = await request.post(`${backend}/auth/verify`, {
    data: {
      tel,
      desafioId: challenge.desafioId,
      code: challenge.developmentCode,
    },
  });
  expect(auth.ok()).toBeTruthy();
  const token = (await auth.json()).token;
  const address = await request.post(`${backend}/endereco`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      apelido: "Casa E2E",
      rua: "Rua de teste",
      numero: "123",
      bairro: "Centro",
      cep: "88650000",
    },
  });
  expect(address.ok()).toBeTruthy();
  addressId = (await address.json()).id;
  const created = await request.post(`${backend}/cupom`, {
    headers: { Authorization: `Bearer ${admin}` },
    data: {
      nome: coupon,
      descricao: "Teste local do PDV",
      tipo: "porcentagem",
      valor: 10,
      valorMinimoGasto: 0,
      quantidade: 10,
      validade: "2099-12-31",
      status: true,
      listaPublica: false,
      unicoUso: false,
    },
  });
  expect(created.ok()).toBeTruthy();
  couponId = (await created.json()).id;
});

test.beforeEach(async ({ page, context }) => {
  await context.addCookies(sessionCookies);
  await page.goto("/admin/pedidos-pdv");
  await expect(
    page.getByRole("button", { name: "Selecionar cliente", exact: false }),
  ).toBeVisible();
});

async function selectClient(page: Page) {
  await page.getByRole("button", { name: /Selecionar cliente/ }).click();
  await page
    .getByLabel("Buscar cliente")
    .fill(`(48) ${tel.slice(4, 9)}-${tel.slice(9)}`);
  await page
    .getByRole("button", { name: `${nome} ${tel}`, exact: true })
    .click();
  await expect(page.getByText(/Cashback: R\$\s*0,00/)).toBeVisible();
}

async function addProduct(page: Page) {
  await page
    .getByRole("button", {
      name: "Frango assado recheado R$ 65,00",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Adicionar item", exact: true })
    .click();
}

test("cliente, endereço, cupom e rascunho geram pedido persistido na API", async ({
  page,
}) => {
  await selectClient(page);
  await addProduct(page);
  await page.getByRole("button", { name: /\[ E \] Retirada/ }).click();
  const modal = page.getByRole("dialog");
  await modal
    .getByRole("button", { name: /Entrega enviar ao cliente/ })
    .click();
  await page.getByLabel("Endereço cadastrado").selectOption(String(addressId));
  await expect(page.getByLabel("Entrega: rua", { exact: true })).toHaveValue(
    "Rua de teste",
  );
  await page.getByRole("switch", { name: "Agendar pedido" }).check();
  // Uma data futura evita os horários encerrados do dia e reservas de outras verificações.
  await modal
    .getByRole("button", { name: /Conforme disponibilidade/ })
    .nth(4)
    .click();
  await modal.getByRole("button", { name: "11:30", exact: true }).click();
  await modal.getByRole("button", { name: "Salvar", exact: true }).click();
  await page.getByRole("button", { name: /\[ R \] Pagamento/ }).click();
  await page
    .getByRole("button", { name: /Dinheiro em espécie no balcão/ })
    .click();
  await page.getByRole("button", { name: "Salvar forma de pagamento" }).click();
  await page.getByRole("button", { name: /Ajustar R\$/ }).click();
  await page
    .getByRole("button", { name: "Cupom desconto", exact: true })
    .click();
  await page.getByLabel("Valor do ajuste").fill(coupon);
  await page.getByRole("button", { name: /Aplicar desconto/ }).click();
  const draftResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/admin/pdv/rascunhos") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Salvar pedido", exact: true })
    .click();
  const draft = await (await draftResponse).json();
  drafts.push(draft.id);
  await page.reload();
  await page.getByRole("button", { name: /Rascunhos/ }).click();
  await page
    .getByRole("dialog")
    .locator("div.flex.items-center")
    .filter({ hasText: `#${draft.id}` })
    .getByRole("button", { name: "Abrir" })
    .click();
  await expect(
    page.getByRole("button", { name: new RegExp(nome) }),
  ).toBeVisible();
  await expect(
    page.getByText(`Cupom ${coupon}: desconto calculado ao gerar o pedido.`),
  ).toBeVisible();
  const result = page.waitForResponse(
    (response) =>
      response.url().endsWith("/admin/pdv") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Gerar pedido/ }).click();
  const response = await result;
  expect(response.status()).toBe(201);
  const order = await response.json();
  orders.push(order.id);
  expect(response.request().postDataJSON().clienteId).toBe(clienteId);
  expect(order.valorFinal).toBe(68.5);
  const saved = await page.request.get(`/api/backend/pedido/${order.id}`);
  expect(saved.ok()).toBeTruthy();
  expect(await saved.json()).toMatchObject({
    valorFinal: 68.5,
    canal: "entrega",
    pagamentoStatus: "pending",
    endereco: { rua: "Rua de teste", cep: "88650000" },
  });
});

test("cadastro valida os campos e seleciona o cliente salvo", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Selecionar cliente/ }).click();
  await page.getByRole("button", { name: "Cadastrar novo cliente" }).click();
  await page.getByRole("button", { name: "Salvar e selecionar" }).click();
  await expect(
    page.getByText("Informe o nome.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Informe o telefone com DDD.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Nome do novo cliente").fill(`${nome} Novo`);
  await page
    .getByLabel("Telefone do novo cliente")
    .fill(`(47) 9${run.slice(-8)}`);
  await page.getByRole("button", { name: "Salvar e selecionar" }).click();
  await expect(
    page.getByRole("button", { name: new RegExp(`${nome} Novo`) }),
  ).toBeVisible();
});

test("ajuste cancelado não muda desconto e cashback respeita saldo real", async ({
  page,
}) => {
  await selectClient(page);
  await addProduct(page);
  await page.getByRole("button", { name: /Ajustar R\$/ }).click();
  await page
    .getByRole("button", { name: "Percentual (%)", exact: true })
    .click();
  await page.getByLabel("Valor do ajuste").fill("10");
  await page.getByRole("button", { name: /Aplicar desconto/ }).click();
  await expect(page.getByText("R$ 58,50", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Adicionar unidade", exact: true })
    .click();
  await expect(page.getByText("R$ 117,00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Ajustar R\$/ }).click();
  await page.getByLabel("Valor do ajuste").fill("50");
  await page.getByRole("button", { name: /Cancelar/ }).click();
  await expect(page.getByText("R$ 117,00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Ajustar R\$/ }).click();
  await page.getByRole("button", { name: "Cashback", exact: true }).click();
  await page.getByLabel("Valor do ajuste").fill("1");
  await page.getByRole("button", { name: /Aplicar desconto/ }).click();
  await expect(
    page.getByText("Cashback acima do saldo disponível ou do subtotal."),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("falha na consulta de clientes permite tentar novamente", async ({
  page,
}) => {
  await page.route("**/api/backend/admin/clientes?*", (route) =>
    route.fulfill({ status: 503, json: { message: "Falha de teste" } }),
  );
  await page.getByRole("button", { name: /Selecionar cliente/ }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Não foi possível carregar os clientes." }),
  ).toBeVisible({ timeout: 15000 });
  await page.unroute("**/api/backend/admin/clientes?*");
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await page.getByLabel("Buscar cliente").fill(nome);
  await expect(
    page.getByRole("button", { name: `${nome} ${tel}`, exact: true }),
  ).toBeVisible();
});

test("rascunho não reaplica cupom cuja edição foi cancelada", async ({
  page,
}) => {
  await selectClient(page);
  await addProduct(page);
  await page.getByRole("button", { name: /Ajustar R\$/ }).click();
  await page
    .getByRole("button", { name: "Cupom desconto", exact: true })
    .click();
  await page.getByLabel("Valor do ajuste").fill(coupon);
  await page.getByRole("button", { name: /Cancelar/ }).click();
  const response = page.waitForResponse(
    (result) =>
      result.url().endsWith("/admin/pdv/rascunhos") &&
      result.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Salvar pedido", exact: true })
    .click();
  const draft = await (await response).json();
  drafts.push(draft.id);
  expect(draft.dados.appliedAdjustment).toBeNull();
  await page.reload();
  await page.getByRole("button", { name: /Rascunhos/ }).click();
  await page
    .getByRole("dialog")
    .locator("div.flex.items-center")
    .filter({ hasText: `#${draft.id}` })
    .getByRole("button", { name: "Abrir" })
    .click();
  await expect(
    page.getByText("Total antes do cupom", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: new RegExp(nome) }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Ajustar R\$/ }).click();
  await expect(page.getByLabel("Valor do ajuste")).toHaveValue("");
});

test.afterAll(async ({ request }) => {
  if (!adminToken) return;
  const headers = { Authorization: `Bearer ${adminToken}` };
  for (const id of orders)
    await request.patch(`${backend}/admin/pedidos/${id}/status`, {
      headers,
      data: { status: "cancelled" },
    });
  for (const id of drafts)
    await request.delete(`${backend}/admin/pdv/rascunhos/${id}`, { headers });
  if (couponId)
    await request.delete(`${backend}/cupom/${couponId}`, { headers });
});
