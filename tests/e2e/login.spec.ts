import { test, expect, Page } from "@playwright/test";

const origin = process.env.E2E_BASE_URL || "http://localhost:4051";
const backend = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4052";

function phone() {
  return `489${Date.now().toString().slice(-8)}`;
}

test.beforeAll(() => {
  for (const url of [origin, backend]) {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
      throw new Error(
        "Esta suíte exige serviços locais com AUTH_DELIVERY_MODE=development.",
      );
  }
});

async function requestCode(page: Page, tel: string) {
  await page
    .getByRole("textbox", { name: "Telefone com DDD", exact: true })
    .fill(tel);
  const received = page.waitForResponse(
    (r) => r.url().endsWith("/auth/wp") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "whatsapp", exact: true }).click();
  const response = await received;
  expect(response.ok()).toBeTruthy();
  expect(response.request().postDataJSON().tel).toBe(`55${tel}`);
  const challenge = await response.json();
  expect(
    challenge.developmentCode,
    "Use autenticação de desenvolvimento",
  ).toBeTruthy();
  await expect(page).toHaveURL(/\/signin\/getcode\?/);
  return challenge as { desafioId: string; developmentCode: string };
}

async function confirmCode(page: Page, code: string) {
  const input = page.getByRole("textbox", {
    name: "Código de acesso",
    exact: true,
  });
  await input.fill("");
  await input.fill(code);
  await expect(input).toHaveValue(code);
  await page
    .getByRole("button", { name: "Confirmar código", exact: true })
    .click();
}

test("login por telefone valida formulário, recupera código incorreto e falha de rede e retorna ao checkout", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/checkout?origem=login");
  await expect(page).toHaveURL(/signin\?callbackUrl=/);
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/auth/wp")) requests++;
  });
  await page.getByRole("button", { name: "whatsapp", exact: true }).click();
  await expect(
    page.getByText("Informe o telefone com DDD.", { exact: true }),
  ).toBeVisible();
  expect(requests).toBe(0);
  const challenge = await requestCode(page, phone());
  await confirmCode(page, "000000");
  await expect(
    page.getByText("Código inválido, expirado ou já utilizado.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar código", exact: true }),
  ).toBeEnabled();
  await page.route("**/api/backend/auth/verify", (route) =>
    route.abort("failed"),
  );
  await confirmCode(page, challenge.developmentCode);
  await expect(
    page.getByText("Não foi possível concluir a operação. Tente novamente.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute("**/api/backend/auth/verify");
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/backend/auth/verify", async (route) => {
    await gate;
    const response = await route.fetch();
    expect(Object.keys(await response.json())).toEqual(["user"]);
    await route.fulfill({ response });
  });
  const responsePromise = page.waitForResponse((r) =>
    r.url().endsWith("/auth/verify"),
  );
  await page
    .getByRole("button", { name: "Confirmar código", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Verificando…", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("textbox", { name: "Código de acesso", exact: true }),
  ).toBeDisabled();
  release();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveURL(`${origin}/checkout?origem=login`);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Resumo do pedido", exact: true }),
  ).toBeVisible();
  const cookies = await context.cookies();
  for (const name of ["zanini_access", "zanini_refresh"]) {
    expect(cookies.find((cookie) => cookie.name === name)?.httpOnly).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("reenvio respeita intervalo e mantém o novo desafio depois de recarregar", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/signin?callbackUrl=%2Fhistoric");
  const tel = phone();
  const first = await requestCode(page, tel);
  const originalDeadline = new URL(page.url()).searchParams.get("reenviarEm");
  await page.reload();
  expect(new URL(page.url()).searchParams.get("reenviarEm")).toBe(
    originalDeadline,
  );
  const resend = page.getByRole("button", {
    name: "Reenviar código",
    exact: true,
  });
  await expect(resend).toBeDisabled();
  await expect(resend).toBeEnabled({ timeout: 70000 });
  const received = page.waitForResponse((r) => r.url().endsWith("/auth/wp"));
  await resend.click();
  const response = await received;
  expect(response.ok()).toBeTruthy();
  const second = await response.json();
  expect(second.desafioId).not.toBe(first.desafioId);
  await expect
    .poll(() => new URL(page.url()).searchParams.get("desafioId"))
    .toBe(second.desafioId);
  await page.reload();
  await expect(resend).toBeDisabled();
  const old = await page.request.post("/api/backend/auth/verify", {
    headers: { Origin: origin },
    data: {
      tel: `55${tel}`,
      desafioId: first.desafioId,
      code: first.developmentCode,
    },
  });
  expect(old.status()).toBe(401);
  await confirmCode(page, second.developmentCode);
  await expect(page).toHaveURL(`${origin}/historic`);
  await expect(
    page.getByRole("region", { name: "Resumo do histórico", exact: true }),
  ).toBeVisible();
});

test("login administrativo valida os campos, rejeita senha errada e abre o destino protegido", async ({
  page,
}) => {
  const email = process.env.E2E_ADMIN_EMAIL,
    senha = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !senha)
    throw new Error("Defina as credenciais administrativas locais.");
  await page.goto("/signin?callbackUrl=%2Fadmin%2Fpedidos-pdv");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByText("Informe um e-mail válido.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "E-mail", exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-incorreta-e2e");
  const denied = page.waitForResponse((r) => r.url().endsWith("/auth/login"));
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  expect((await denied).status()).toBe(401);
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/backend/auth/login", async (route) => {
    await gate;
    await route.continue();
  });
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Entrando…", exact: true }),
  ).toBeDisabled();
  release();
  await expect(page).toHaveURL(`${origin}/admin/pedidos-pdv`);
});

test("link incompleto permite reiniciar login e retorno externo é descartado", async ({
  page,
}) => {
  await page.goto("/signin/getcode?callbackUrl=%2Fcart");
  await expect(
    page.getByText(
      "Este link está incompleto ou inválido. Informe seu telefone para receber um novo código.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Voltar ao login", exact: true })
    .click();
  expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe("/cart");
  await page.goto(
    `/signin?callbackUrl=${encodeURIComponent("/\\example.com")}`,
  );
  const challenge = await requestCode(page, phone());
  expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe("/");
  await confirmCode(page, challenge.developmentCode);
  await expect(page).toHaveURL(`${origin}/`);
});
