import { randomInt } from "node:crypto";
import { test, expect } from "../fixtures/payment-app";

// Cada cenário usa uma conta verificada apenas no banco temporário da suíte.
test.beforeEach(async ({ page, paymentApp }) => {
  const headers = { Origin: paymentApp.origin };
  const tel = `55489${randomInt(10000000, 100000000)}`;
  const request = await page.request.post("/api/backend/auth/wp", {
    headers,
    data: { tel },
  });
  expect(request.ok()).toBeTruthy();
  const challenge = await request.json();
  expect(challenge.developmentCode).toBeTruthy();
  const login = await page.request.post("/api/backend/auth/verify", {
    headers,
    data: {
      tel,
      desafioId: challenge.desafioId,
      code: challenge.developmentCode,
    },
  });
  expect(login.ok()).toBeTruthy();
});

test("perfil valida campos, salva dados normalizados, atualiza sessão e permite limpar opcionais", async ({
  page,
}) => {
  await page.goto("/profile");
  const save = page.getByRole("button", {
    name: "Salvar Alterações",
    exact: true,
  });
  const name = page.getByLabel("nome", { exact: true });
  const phone = page.getByLabel("telefone", { exact: true });
  const email = page.getByLabel("email", { exact: true });
  const cpf = page.getByLabel(/cpf/);
  const birthday = page.getByLabel(/aniversário/);
  const original = await (
    await page.request.get("/api/backend/usuario")
  ).json();
  await expect(phone).toHaveAttribute("readonly", "");
  let writes = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/usuario") && r.method() === "PUT") writes++;
  });
  await name.fill(" ");
  await email.fill("email-invalido");
  await cpf.fill("11111111111");
  await birthday.fill("2099-01-01");
  await save.click();
  await expect(
    page.getByText("Informe seu nome.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Informe um e-mail válido.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Informe um CPF válido.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Informe uma data de nascimento válida, sem data futura.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(writes).toBe(0);
  await name.fill("  Ana Integração  ");
  await email.fill("ana-perfil@test.example");
  await birthday.fill("1996-02-29");
  await cpf.fill("52998224724");
  await save.click();
  await expect(
    page.getByText("Informe um CPF válido.", { exact: true }),
  ).toBeVisible();
  expect(writes).toBe(0);
  await cpf.fill("52998224725");
  await expect(cpf).toHaveValue("529.982.247-25");
  const saved = page.waitForResponse(
    (r) => r.url().endsWith("/usuario") && r.request().method() === "PUT",
  );
  await save.click();
  const result = await saved;
  expect(result.ok()).toBeTruthy();
  expect(result.request().postDataJSON()).toEqual({
    nome: "Ana Integração",
    email: "ana-perfil@test.example",
    cpf: "52998224725",
    dataDeNascimento: "1996-02-29",
  });
  await expect(page.getByText("Olá Ana", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Alterações não salvas.", { exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(name).toHaveValue("Ana Integração");
  await expect(cpf).toHaveValue("529.982.247-25");
  await expect(birthday).toHaveValue("1996-02-29");
  const persisted = await (
    await page.request.get("/api/backend/usuario")
  ).json();
  expect(persisted.tel).toBe(original.tel);
  expect(persisted.isAdmin).toBe(false);
  await email.fill("");
  await cpf.fill("");
  await birthday.fill("");
  const cleared = page.waitForResponse(
    (r) => r.url().endsWith("/usuario") && r.request().method() === "PUT",
  );
  await save.click();
  expect((await cleared).ok()).toBeTruthy();
  await expect(save).toBeEnabled();
  await page.reload();
  await expect(email).toHaveValue("");
  await expect(cpf).toHaveValue("");
  await expect(birthday).toHaveValue("");
  const empty = await (await page.request.get("/api/backend/usuario")).json();
  expect(empty.email).toBeNull();
  expect(empty.dataDeNascimento).toBeNull();
  expect(empty.cpf).toBe("");
});

test("perfil recupera carregamento e gravação indisponíveis sem perder edição", async ({
  page,
}) => {
  await page.route("**/api/backend/usuario", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Perfil temporariamente indisponível." },
    }),
  );
  await page.goto("/profile");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Não foi possível carregar seu perfil." }),
  ).toBeVisible();
  await page.unroute("**/api/backend/usuario");
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  const name = page.getByLabel("nome", { exact: true });
  await name.fill("Bruna Recuperação");
  await page.route("**/api/backend/usuario", (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({
          status: 503,
          json: { message: "Perfil temporariamente indisponível." },
        })
      : route.continue(),
  );
  await page
    .getByRole("button", { name: "Salvar Alterações", exact: true })
    .click();
  await expect(
    page.getByText("Perfil temporariamente indisponível.", { exact: true }),
  ).toBeVisible();
  await expect(name).toHaveValue("Bruna Recuperação");
  await expect(
    page.getByText("Alterações não salvas.", { exact: true }),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/backend/usuario")).json()).nome,
  ).not.toBe("Bruna Recuperação");
  await page.unroute("**/api/backend/usuario");
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/backend/usuario", async (route) => {
    if (route.request().method() === "PUT") await gate;
    await route.continue();
  });
  await page
    .getByRole("button", { name: "Salvar Alterações", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Salvando alterações…", exact: true }),
  ).toBeDisabled();
  await expect(name).toBeDisabled();
  release();
  await expect(
    page.getByText("Perfil atualizado com sucesso.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(name).toHaveValue("Bruna Recuperação");
});

test("atualização em segundo plano preserva rascunho e conflito de e-mail permite correção", async ({
  page,
  paymentApp,
}) => {
  const other = await paymentApp.customer();
  await page.goto("/profile");
  const name = page.getByLabel("nome", { exact: true });
  const email = page.getByLabel("email", { exact: true });
  const save = page.getByRole("button", {
    name: "Salvar Alterações",
    exact: true,
  });
  await name.fill("Carla Rascunho");
  const headers = { Origin: paymentApp.origin };
  expect(
    (
      await page.request.put("/api/backend/usuario", {
        headers,
        data: { nome: "Nome remoto", email: "atualizado-remoto@test.example" },
      })
    ).ok(),
  ).toBeTruthy();
  await page.route("**/api/backend/usuario", (route) =>
    route.fulfill({ status: 503, json: { message: "Consulta indisponível." } }),
  );
  // O React Query revalida ao receber o evento de visibilidade do navegador.
  await page.evaluate(() =>
    window.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(
    page.getByText(
      "Não foi possível atualizar seu perfil. Suas alterações foram preservadas. Tente novamente antes de salvar.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(name).toHaveValue("Carla Rascunho");
  await expect(save).toBeDisabled();
  await page.unroute("**/api/backend/usuario");
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(email).toHaveValue("atualizado-remoto@test.example");
  await expect(name).toHaveValue("Carla Rascunho");
  await email.fill(other.email);
  const conflict = page.waitForResponse(
    (r) => r.url().endsWith("/usuario") && r.request().method() === "PUT",
  );
  await save.click();
  expect((await conflict).status()).toBe(409);
  await expect(
    page.getByText("Já existe um registro com esses dados.", { exact: true }),
  ).toBeVisible();
  await expect(name).toHaveValue("Carla Rascunho");
  const unchanged = await (
    await page.request.get("/api/backend/usuario")
  ).json();
  expect(unchanged.nome).toBe("Nome remoto");
  expect(unchanged.email).toBe("atualizado-remoto@test.example");
  await email.fill("carla-perfil@test.example");
  await save.click();
  await expect(
    page.getByText("Perfil atualizado com sucesso.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(name).toHaveValue("Carla Rascunho");
  await expect(email).toHaveValue("carla-perfil@test.example");
});
