import { test, expect, Page } from "@playwright/test";

const origin = process.env.E2E_BASE_URL || "http://localhost:4051";
const backend = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4052";
const headers = { Origin: origin };
let adminToken: string;
const orders: number[] = [];

test.beforeAll(async ({ request }) => {
  for (const url of [origin, backend]) {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
      throw new Error("Esta suíte exige serviços locais.");
  }
  const email = process.env.E2E_ADMIN_EMAIL,
    senha = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !senha)
    throw new Error("Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD locais.");
  const login = await request.post(`${backend}/auth/login`, {
    data: { email, senha },
  });
  expect(login.ok()).toBeTruthy();
  adminToken = (await login.json()).token;
});

test.beforeEach(async ({ page }) => {
  const tel = `55489${Date.now().toString().slice(-8)}`;
  const created = await page.request.post(`${backend}/admin/clientes`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { nome: `Endereços E2E ${tel}`, tel },
  });
  expect(created.ok()).toBeTruthy();
  const challenge = await (
    await page.request.post(`${backend}/auth/wp`, { data: { tel } })
  ).json();
  expect(
    challenge.developmentCode,
    "Use AUTH_DELIVERY_MODE=development",
  ).toBeTruthy();
  const login = await page.request.post(`${origin}/api/backend/auth/verify`, {
    headers,
    data: {
      tel,
      desafioId: challenge.desafioId,
      code: challenge.developmentCode,
    },
  });
  expect(login.ok()).toBeTruthy();
  const added = await page.request.post("/api/backend/pedido/carrinho", {
    headers,
    data: { produtoId: 101, quantidade: 1 },
  });
  expect(added.ok()).toBeTruthy();
});

async function fillAddress(page: Page, cep = "88650-000") {
  await page.getByLabel("apelido", { exact: true }).fill("Casa E2E");
  await page.getByLabel("endereço", { exact: true }).fill("Rua da entrega");
  await page.getByLabel("bairro", { exact: true }).fill("Centro");
  await page.getByLabel("cep", { exact: true }).fill(cep);
  await page.getByLabel("número", { exact: true }).fill("42");
}

async function cart(page: Page) {
  const response = await page.request.get("/api/backend/pedido/carrinho");
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test("checkout cadastra, edita e seleciona endereço; finaliza entrega e acompanha status real", async ({
  page,
}) => {
  await page.goto("/checkout");
  await page.getByRole("button", { name: /Escolher recebimento/ }).click();
  await page
    .getByRole("link", { name: "Cadastrar endereço", exact: true })
    .click();
  await expect(page).toHaveURL(/deliveryaddress\/add\?returnTo=%2Fcheckout$/);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByText("Informe um apelido.", { exact: true }),
  ).toBeVisible();
  await fillAddress(page);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page).toHaveURL(/deliveryaddress\?returnTo=%2Fcheckout$/);
  await page
    .getByRole("link", { name: "Editar Casa E2E", exact: true })
    .click();
  await page.getByLabel("número", { exact: true }).fill("88");
  await page
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await expect(
    page.getByText("Rua da entrega, 88", { exact: true }),
  ).toBeVisible();

  // Falha apenas no transporte: o cadastro deve permanecer disponível para repetir a seleção.
  await page.route("**/api/backend/pedido/carrinho", async (route) => {
    if (route.request().method() === "PUT")
      await route.fulfill({
        status: 503,
        json: { message: "Entrega temporariamente indisponível." },
      });
    else await route.continue();
  });
  await page
    .getByRole("button", { name: "Entregar aqui", exact: true })
    .click();
  await expect(
    page.getByText("Entrega temporariamente indisponível.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/deliveryaddress\?returnTo=%2Fcheckout$/);
  await page.unroute("**/api/backend/pedido/carrinho");
  await page
    .getByRole("button", { name: "Entregar aqui", exact: true })
    .click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.reload();
  await expect(
    page.getByText("Rua da entrega, 88", { exact: true }),
  ).toBeVisible();
  const selected = await cart(page);
  expect(selected.endereco.cep).toBe("88650000");
  expect(selected.taxaEntrega).toBe(10);
  expect(selected.valorFinal).toBe(75);

  await page.getByRole("button", { name: /Escolher horário/ }).click();
  const dialog = page.getByRole("dialog");
  // O dia seguinte continua disponível mesmo quando o CI roda após o fechamento.
  await dialog.locator("button[aria-pressed]").nth(1).click();
  await dialog
    .getByRole("button", { name: /^Receber entre/ })
    .first()
    .click();
  await dialog
    .getByRole("button", { name: "Confirmar horário", exact: true })
    .click();
  await page.getByRole("button", { name: /Escolher pagamento/ }).click();
  await page.getByRole("button", { name: /Dinheiro/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  const final = page.waitForResponse((r) =>
    r.url().endsWith("/pedido/finalizar"),
  );
  await page.getByRole("button", { name: /Enviar pedido/ }).click();
  const response = await final;
  expect(response.ok()).toBeTruthy();
  const order = await response.json();
  orders.push(order.id);
  expect(order.canal).toBe("entrega");
  expect(order.endereco.numero).toBe("88");
  expect(order.valorFinal).toBe(75);
  await expect(page).toHaveURL(new RegExp(`/orderstatus\\?id=${order.id}$`));
  await expect(
    page.getByText("Entrega no endereço", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Taxa de entrega", { exact: true }),
  ).toBeVisible();
  for (const status of ["production", "ready"]) {
    const change = await page.request.patch(
      `${backend}/admin/pedidos/${order.id}/status`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { status },
      },
    );
    expect(change.ok()).toBeTruthy();
  }
  await expect(
    page.getByRole("heading", { name: "Pronto para entrega", exact: true }),
  ).toBeVisible({ timeout: 12000 });
  await expect(
    page.getByText("Você já pode vir até a loja para retirar seu pedido.", {
      exact: true,
    }),
  ).toHaveCount(0);
});

test("CEP fora da área mantém o carrinho; favoritos, exclusão e retorno ao carrinho persistem", async ({
  page,
}) => {
  await page.goto("/deliveryaddress/add?returnTo=%2Fcart");
  await fillAddress(page, "88000-000");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Entregar aqui", exact: true })
    .click();
  await expect(
    page.getByText("Endereço fora da área atendida.", { exact: true }),
  ).toBeVisible();
  expect((await cart(page)).taxaEntrega).toBe(0);
  expect((await cart(page)).endereco).toEqual({});
  await page
    .getByRole("link", { name: "Editar Casa E2E", exact: true })
    .click();
  await page.getByLabel("cep", { exact: true }).fill("88650-000");
  await page
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Favoritar Casa E2E", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Desfavoritar Casa E2E", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Desfavoritar Casa E2E", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Entregar aqui", exact: true })
    .click();
  await expect(page).toHaveURL(/\/cart$/);
  expect((await cart(page)).taxaEntrega).toBe(10);
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Alterar", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirmar retirada", exact: true })
    .click();
  await expect(
    page.getByText("Retirada no local", { exact: true }),
  ).toBeVisible();
  expect((await cart(page)).taxaEntrega).toBe(0);
  expect((await cart(page)).valorFinal).toBe(65);
  await page.goto("/deliveryaddress?returnTo=https%3A%2F%2Fexample.com");
  await expect(
    page.getByRole("button", { name: "Entregar aqui", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Excluir Casa E2E", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sim", exact: true })
    .click();
  await expect(
    page.getByText("Nenhum endereço cadastrado.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Nenhum endereço cadastrado.", { exact: true }),
  ).toBeVisible();
});

test.afterAll(async ({ request }) => {
  for (const id of orders) {
    const response = await request.patch(
      `${backend}/admin/pedidos/${id}/status`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { status: "cancelled" },
      },
    );
    expect(response.ok()).toBeTruthy();
  }
});
