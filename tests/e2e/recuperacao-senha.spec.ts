import { test, expect } from "../fixtures/payment-app";

const notice = "Se o e-mail estiver cadastrado, você receberá as instruções.";
const invalid =
  "Este link está incompleto, inválido ou expirado. Solicite novas instruções para redefinir sua senha.";

test("recuperação valida e-mail, recupera falha de rede e mantém resposta genérica", async ({
  page,
  paymentApp,
}) => {
  const customer = await paymentApp.customer();
  await page.goto("/signin?callbackUrl=%2Fadmin%2Fpedidos-pdv");
  await page
    .getByRole("link", { name: "Esqueci minha senha", exact: true })
    .click();
  expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe(
    "/admin/pedidos-pdv",
  );
  let sent = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/auth/esqueci-senha")) sent++;
  });
  await page
    .getByRole("button", { name: "Enviar instruções", exact: true })
    .click();
  await expect(
    page.getByText("Informe um e-mail válido.", { exact: true }),
  ).toBeVisible();
  expect(sent).toBe(0);
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(` ${customer.email.toUpperCase()} `);
  await page.route("**/api/backend/auth/esqueci-senha", (route) =>
    route.abort("failed"),
  );
  await page
    .getByRole("button", { name: "Enviar instruções", exact: true })
    .click();
  await expect(
    page.getByText("Não foi possível concluir a operação. Tente novamente.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeEnabled();
  await page.unroute("**/api/backend/auth/esqueci-senha");
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/auth/esqueci-senha"),
  );
  await page
    .getByRole("button", { name: "Enviar instruções", exact: true })
    .click();
  const result = await response;
  expect(result.ok()).toBeTruthy();
  expect(result.request().postDataJSON().email).toBe(
    customer.email.toUpperCase(),
  );
  const challenge = await result.json();
  expect(challenge.developmentToken).toBeTruthy();
  await expect(
    page.getByRole("status").filter({ hasText: notice }),
  ).toBeVisible();
  await expect(
    page.getByText(challenge.developmentToken, { exact: true }),
  ).toHaveCount(0);
  await paymentApp.expireResetLink(challenge.desafioId);
  await page.goto(
    `/signin/redefinir?desafioId=${challenge.desafioId}&token=${challenge.developmentToken}&callbackUrl=%2Fadmin%2Fpedidos-pdv`,
  );
  await page
    .getByLabel("Nova senha", { exact: true })
    .fill("Senha-local-expirada-2026");
  await page
    .getByLabel("Confirme a senha", { exact: true })
    .fill("Senha-local-expirada-2026");
  await page.getByRole("button", { name: "Salvar senha", exact: true }).click();
  await expect(page.getByText(invalid, { exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Voltar ao login", exact: true })
    .click();
  expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe(
    "/admin/pedidos-pdv",
  );
  await page.goto("/signin/redefinir");
  await page.getByLabel("E-mail", { exact: true }).fill("ausente@test.example");
  const unknown = page.waitForResponse((r) =>
    r.url().endsWith("/auth/esqueci-senha"),
  );
  await page
    .getByRole("button", { name: "Enviar instruções", exact: true })
    .click();
  expect((await unknown).ok()).toBeTruthy();
  await expect(
    page.getByRole("status").filter({ hasText: notice }),
  ).toBeVisible();
});

test("troca de senha valida confirmação, recupera indisponibilidade e revoga sessões e link", async ({
  page,
  context,
  browser,
  paymentApp,
}) => {
  const customer = await paymentApp.customer(true);
  const headers = { Origin: paymentApp.origin };
  expect(
    (
      await page.request.post("/api/backend/auth/login", {
        headers,
        data: customer,
      })
    ).ok(),
  ).toBeTruthy();
  const other = await browser.newContext({ baseURL: paymentApp.origin });
  try {
    expect(
      (
        await other.request.post("/api/backend/auth/login", {
          headers,
          data: customer,
        })
      ).ok(),
    ).toBeTruthy();
    const forgot = await page.request.post("/api/backend/auth/esqueci-senha", {
      headers,
      data: { email: customer.email },
    });
    expect(forgot.ok()).toBeTruthy();
    const challenge = await forgot.json();
    expect(challenge.developmentToken).toBeTruthy();
    const url = `/signin/redefinir?desafioId=${challenge.desafioId}&token=${challenge.developmentToken}`;
    await page.goto(url);
    await page
      .getByRole("button", { name: "Salvar senha", exact: true })
      .click();
    await expect(
      page.getByText("Use pelo menos 12 caracteres.", { exact: true }),
    ).toBeVisible();
    const newPassword = "Senha-local-nova-2026";
    await page.getByLabel("Nova senha", { exact: true }).fill(newPassword);
    await page
      .getByLabel("Confirme a senha", { exact: true })
      .fill("senha-diferente");
    await page
      .getByRole("button", { name: "Salvar senha", exact: true })
      .click();
    await expect(
      page.getByText("As senhas precisam ser iguais.", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Confirme a senha", { exact: true })
      .fill(newPassword);
    await page.route("**/api/backend/auth/redefinir-senha", (route) =>
      route.fulfill({
        status: 503,
        json: { message: "Serviço temporariamente indisponível." },
      }),
    );
    await page
      .getByRole("button", { name: "Salvar senha", exact: true })
      .click();
    await expect(
      page.getByText("Serviço temporariamente indisponível.", { exact: true }),
    ).toBeVisible();
    expect(
      (await context.cookies()).some((c) => c.name === "zanini_access"),
    ).toBe(true);
    await expect(page.getByLabel("Nova senha", { exact: true })).toHaveValue(
      newPassword,
    );
    await page.unroute("**/api/backend/auth/redefinir-senha");
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/backend/auth/redefinir-senha", async (route) => {
      await gate;
      await route.continue();
    });
    await page
      .getByRole("button", { name: "Salvar senha", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Salvando senha…", exact: true }),
    ).toBeDisabled();
    await expect(page.getByLabel("Nova senha", { exact: true })).toBeDisabled();
    release();
    await expect(
      page
        .getByRole("status")
        .filter({
          hasText: "Senha atualizada. Entre novamente com sua nova senha.",
        }),
    ).toBeVisible();
    expect(
      (await context.cookies()).filter((c) =>
        ["zanini_access", "zanini_refresh"].includes(c.name),
      ),
    ).toHaveLength(0);
    expect((await other.request.get("/api/backend/auth/me")).status()).toBe(
      401,
    );
    expect(
      (
        await other.request.post("/api/backend/auth/refresh", { headers })
      ).status(),
    ).toBe(401);
    await page.reload();
    await page.getByLabel("Nova senha", { exact: true }).fill(newPassword);
    await page
      .getByLabel("Confirme a senha", { exact: true })
      .fill(newPassword);
    await page
      .getByRole("button", { name: "Salvar senha", exact: true })
      .click();
    await expect(page.getByText(invalid, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Salvar senha", exact: true }),
    ).toHaveCount(0);
    expect(
      (
        await page.request.post("/api/backend/auth/login", {
          headers,
          data: customer,
        })
      ).status(),
    ).toBe(401);
    await page
      .getByRole("link", { name: "Voltar ao login", exact: true })
      .click();
    await page.getByLabel("E-mail", { exact: true }).fill(customer.email);
    await page.getByLabel("Senha", { exact: true }).fill(newPassword);
    const login = page.waitForResponse((r) => r.url().endsWith("/auth/login"));
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    expect((await login).ok()).toBeTruthy();
    await expect(page).toHaveURL(`${paymentApp.origin}/admin/dashboard`);
  } finally {
    await other.close();
  }
});

test("link incompleto não envia senha e permite solicitar outro com retorno seguro", async ({
  page,
}) => {
  let sent = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/auth/redefinir-senha")) sent++;
  });
  for (const query of [
    "token=curto",
    "desafioId=invalido",
    "token=&desafioId=",
  ]) {
    await page.goto(
      `/signin/redefinir?${query}&callbackUrl=https%3A%2F%2Fexample.com`,
    );
    await expect(page.getByText(invalid, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Salvar senha", exact: true }),
    ).toHaveCount(0);
  }
  expect(sent).toBe(0);
  await page
    .getByRole("link", { name: "Solicitar novo link", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Recuperar senha", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe(
    "/admin/dashboard",
  );
});
