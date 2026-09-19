import { APIRequestContext, BrowserContext, Page } from "@playwright/test";
import { randomInt } from "node:crypto";
import { test, expect } from "../fixtures/payment-app";

test.use({ integrationSuite: "clientes-admin", timezoneId: "Asia/Tokyo" });
let customer: BrowserContext;
let client: APIRequestContext;
let id: number;
let name: string;
let email: string;
const url = "/admin/dashboard?view=reports&report=customers";

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
  customer = await browser.newContext({ baseURL: paymentApp.origin });
  client = customer.request;
  const credentials = await paymentApp.customer();
  email = credentials.email;
  expect(
    (
      await client.post("/api/backend/auth/login", {
        headers,
        data: credentials,
      })
    ).ok(),
  ).toBeTruthy();
  id = (await (await client.get("/api/backend/usuario")).json()).id;
  name = `Cliente integração ${id}`;
  expect(
    (
      await page.request.put(`/api/backend/admin/clientes/${id}`, {
        headers,
        data: { nome: name },
      })
    ).ok(),
  ).toBeTruthy();
});
test.afterEach(async () => {
  await customer?.close();
});

async function openEditor(page: Page) {
  await page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name, exact: true }) })
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  return page.getByRole("dialog", { name: "Editar cliente", exact: true });
}

test("valida o cadastro, normaliza os dados e remove campos opcionais na API e no perfil", async ({
  page,
  paymentApp,
}) => {
  await page.goto(url);
  let dialog = await openEditor(page);
  let writes = 0;
  page.on("request", (r) => {
    if (r.method() === "PUT" && r.url().endsWith(`/admin/clientes/${id}`))
      writes++;
  });
  await dialog.getByLabel("Nome", { exact: true }).fill(" ");
  await dialog.getByLabel("E-mail", { exact: true }).fill("invalido");
  await dialog.getByLabel("Telefone com DDD", { exact: true }).fill("123");
  await dialog.getByLabel("CPF", { exact: true }).fill("11111111111");
  await dialog.getByLabel("Nascimento", { exact: true }).fill("2099-01-01");
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  for (const message of [
    "Informe o nome.",
    "Informe um e-mail válido.",
    "Informe o telefone com DDD.",
    "Informe um CPF válido.",
    "Informe uma data de nascimento válida, sem data futura.",
  ]) {
    await expect(dialog.getByText(message, { exact: true })).toBeVisible();
  }
  expect(writes).toBe(0);
  const phone = `489${randomInt(10000000, 100000000)}`;
  name = `Ana integração ${id}`;
  await dialog.getByLabel("Nome", { exact: true }).fill(`  ${name}  `);
  await dialog
    .getByLabel("E-mail", { exact: true })
    .fill(`  editada-${id}@test.example  `);
  await dialog
    .getByLabel("Telefone com DDD", { exact: true })
    .fill(`(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`);
  await dialog.getByLabel("CPF", { exact: true }).fill("52998224725");
  await expect(dialog.getByLabel("CPF", { exact: true })).toHaveValue(
    "529.982.247-25",
  );
  await dialog.getByLabel("Nascimento", { exact: true }).fill("1996-02-29");
  const saved = page.waitForResponse(
    (r) =>
      r.request().method() === "PUT" &&
      r.url().endsWith(`/admin/clientes/${id}`),
  );
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  const result = await saved;
  expect(result.ok()).toBeTruthy();
  expect(result.request().postDataJSON()).toEqual({
    nome: name,
    email: `editada-${id}@test.example`,
    tel: `55${phone}`,
    cpf: "52998224725",
    dataDeNascimento: "1996-02-29",
  });
  await expect(dialog).not.toBeVisible();
  const persisted = await (await client.get("/api/backend/usuario")).json();
  expect(persisted).toMatchObject({
    nome: name,
    tel: `55${phone}`,
    dataDeNascimento: "1996-02-29",
    isAdmin: false,
  });
  const clientPage = await customer.newPage();
  await clientPage.goto("/profile");
  await expect(clientPage.getByLabel("nome", { exact: true })).toHaveValue(
    name,
  );
  await expect(clientPage.getByLabel(/aniversário/)).toHaveValue("1996-02-29");
  await page
    .getByLabel("Buscar cliente")
    .fill(`+55 (${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`);
  dialog = await openEditor(page);
  await expect(dialog.getByLabel("Nascimento", { exact: true })).toHaveValue(
    "1996-02-29",
  );
  for (const label of ["E-mail", "Telefone com DDD", "CPF", "Nascimento"])
    await dialog.getByLabel(label, { exact: true }).fill("");
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(await (await client.get("/api/backend/usuario")).json()).toMatchObject(
    { nome: name, email: null, tel: null, cpf: "", dataDeNascimento: null },
  );
  await page.getByLabel("Buscar cliente").fill(name);
  dialog = await openEditor(page);
  for (const label of ["E-mail", "Telefone com DDD", "CPF", "Nascimento"])
    await expect(dialog.getByLabel(label, { exact: true })).toHaveValue("");
  expect(
    (
      await client.put(`/api/backend/admin/clientes/${id}`, {
        headers: { Origin: paymentApp.origin },
        data: { nome: "Sem permissão" },
      })
    ).status(),
  ).toBe(403);
});

test("conflito e indisponibilidade preservam a edição; envio pendente bloqueia fechamento e duplicação", async ({
  page,
  paymentApp,
}) => {
  const other = await paymentApp.customer();
  await page.goto(url);
  const dialog = await openEditor(page);
  await dialog.getByLabel("Nome", { exact: true }).fill("Edição preservada");
  await dialog.getByLabel("E-mail", { exact: true }).fill(other.email);
  const conflict = page.waitForResponse(
    (r) =>
      r.request().method() === "PUT" &&
      r.url().endsWith(`/admin/clientes/${id}`),
  );
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  expect((await conflict).status()).toBe(409);
  await expect(
    page.getByText("Já existe um registro com esses dados.", { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Nome", { exact: true })).toHaveValue(
    "Edição preservada",
  );
  expect((await (await client.get("/api/backend/usuario")).json()).nome).toBe(
    name,
  );
  await dialog.getByLabel("E-mail", { exact: true }).fill(email);
  await page.route(`**/api/backend/admin/clientes/${id}`, (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Cadastro temporariamente indisponível." },
    }),
  );
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    page.getByText("Cadastro temporariamente indisponível.", { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Nome", { exact: true })).toHaveValue(
    "Edição preservada",
  );
  await page.unroute(`**/api/backend/admin/clientes/${id}`);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let writes = 0;
  await page.route(`**/api/backend/admin/clientes/${id}`, async (route) => {
    writes++;
    await gate;
    await route.continue();
  });
  try {
    await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(
      dialog.getByRole("button", { name: "Salvando…", exact: true }),
    ).toBeDisabled();
    await expect(
      dialog.getByRole("button", { name: "Cancelar", exact: true }),
    ).toBeDisabled();
    await expect(dialog.getByLabel("Nome", { exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    expect(writes).toBe(1);
  } finally {
    release();
  }
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Edição preservada", exact: true }),
  ).toBeVisible();
  expect((await (await client.get("/api/backend/usuario")).json()).nome).toBe(
    "Edição preservada",
  );
});

test("listagem recupera falhas, distingue busca vazia e permite edição sem os indicadores", async ({
  page,
}) => {
  await page.route("**/api/backend/admin/relatorios", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Relatório indisponível." },
    }),
  );
  await page.route("**/api/backend/admin/clientes?**", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Clientes indisponíveis." },
    }),
  );
  await page.goto(url);
  const retry = page.getByRole("button", {
    name: "Falha ao carregar clientes. Tentar novamente",
    exact: true,
  });
  await expect(retry).toBeVisible();
  await expect(
    page.getByText("Nenhum registro para este relatório.", { exact: true }),
  ).not.toBeVisible();
  await page.unroute("**/api/backend/admin/clientes?**");
  await retry.click();
  await expect(
    page.getByText("Não foi possível carregar os indicadores.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Buscar cliente")
    .fill("nenhum-cliente-para-esta-busca");
  await expect(
    page.getByText("Nenhum registro para este relatório.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Buscar cliente").fill(email);
  const dialog = await openEditor(page);
  await dialog
    .getByLabel("Nome", { exact: true })
    .fill("Cliente sem indicadores");
  const refreshed = page.waitForResponse(
    (response) => response.url().includes("/admin/clientes?") && response.ok(),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await refreshed;
  await expect(dialog.getByLabel("Nome", { exact: true })).toHaveValue(
    "Cliente sem indicadores",
  );
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Cliente sem indicadores", exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/backend/admin/relatorios");
  await page
    .getByRole("button", { name: "Atualizar indicadores", exact: true })
    .click();
  await expect(
    page.getByText("Não foi possível carregar os indicadores.", {
      exact: true,
    }),
  ).not.toBeVisible();
});
