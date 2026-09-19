import { test, expect } from "../fixtures/session-app";
import { BrowserContext, Page } from "@playwright/test";

async function login(page: Page, origin: string) {
  const email = process.env.E2E_ADMIN_EMAIL,
    senha = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !senha)
    throw new Error("Defina as credenciais administrativas locais.");
  const result = await page.request.post(`${origin}/api/backend/auth/login`, {
    headers: { Origin: origin },
    data: { email, senha },
  });
  expect(result.ok()).toBeTruthy();
}

async function invalidateAccess(context: BrowserContext) {
  const token = (await context.cookies()).find(
    (cookie) => cookie.name === "zanini_access",
  );
  expect(token).toBeTruthy();
  // Simula um access token expirado, mantendo a credencial real de refresh.
  await context.addCookies([{ ...token!, value: "access-token-expirado" }]);
}

async function refreshCookie(context: BrowserContext) {
  return (await context.cookies()).find(
    (cookie) => cookie.name === "zanini_refresh",
  )?.value;
}

test.beforeEach(async ({ page, sessionApp }) => {
  sessionApp.faults.refreshStatus = null;
  sessionApp.faults.meUnavailable = false;
  sessionApp.faults.refreshRequests = 0;
});

test("API indisponível durante a renovação preserva cookies e permite recuperar o carrinho", async ({
  page,
  context,
  sessionApp,
}) => {
  const tel = `55499${Date.now().toString().slice(-8)}`;
  const challenge = await (
    await page.request.post("/api/backend/auth/wp", {
      headers: { Origin: sessionApp.origin },
      data: { tel },
    })
  ).json();
  expect(
    challenge.developmentCode,
    "Use AUTH_DELIVERY_MODE=development",
  ).toBeTruthy();
  const authenticated = await page.request.post("/api/backend/auth/verify", {
    headers: { Origin: sessionApp.origin },
    data: {
      tel,
      desafioId: challenge.desafioId,
      code: challenge.developmentCode,
    },
  });
  expect(authenticated.ok()).toBeTruthy();
  const added = await page.request.post("/api/backend/pedido/carrinho", {
    headers: { Origin: sessionApp.origin },
    data: { produtoId: 302, quantidade: 1 },
  });
  expect(added.ok()).toBeTruthy();
  const saved = await added.json();
  const before = await refreshCookie(context);
  await invalidateAccess(context);
  sessionApp.faults.refreshStatus = 503;
  await page.goto("/cart");
  await expect(
    page.getByText(
      "Não foi possível verificar sua sessão. Tente novamente para continuar.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(`${sessionApp.origin}/cart`);
  expect(await refreshCookie(context)).toBe(before);
  expect(sessionApp.faults.refreshRequests).toBe(1);
  sessionApp.faults.refreshStatus = null;
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Carrinho", exact: true }),
  ).toBeVisible();
  expect(await refreshCookie(context)).not.toBe(before);
  const current = await page.request.get("/api/backend/pedido/carrinho");
  expect(current.ok()).toBeTruthy();
  expect((await current.json()).id).toBe(saved.id);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Carrinho", exact: true }),
  ).toBeVisible();
  // Não reserva estoque; remove só a linha criada por este teste.
  const item = saved.itens[saved.itens.length - 1];
  await page.request.delete(`/api/backend/pedido/carrinho/item/${item.id}`, {
    headers: { Origin: sessionApp.origin },
  });
});

test("limite temporário de renovação não apaga a sessão", async ({
  page,
  context,
  sessionApp,
}) => {
  await login(page, sessionApp.origin);
  const before = await refreshCookie(context);
  await invalidateAccess(context);
  sessionApp.faults.refreshStatus = 429;
  await page.goto("/historic");
  await expect(
    page.getByRole("button", { name: "Tentar novamente", exact: true }),
  ).toBeVisible();
  expect(await refreshCookie(context)).toBe(before);
  sessionApp.faults.refreshStatus = null;
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Seus pedidos", exact: true }),
  ).toBeVisible();
});

test("sessão revogada pelo backend limpa os cookies e retorna ao login", async ({
  page,
  context,
  sessionApp,
}) => {
  await login(page, sessionApp.origin);
  // Revoga esta sessão na API real, sem passar pelo proxy que removeria os cookies.
  const access = (await context.cookies()).find(
    (cookie) => cookie.name === "zanini_access",
  )!;
  const backend = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4052";
  const revoked = await page.request.post(`${backend}/auth/logout`, {
    headers: { Authorization: `Bearer ${access.value}` },
  });
  expect(revoked.ok()).toBeTruthy();
  await page.goto("/checkout?origem=sessao");
  await expect(page).toHaveURL(/\/signin\?callbackUrl=/);
  expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe(
    "/checkout?origem=sessao",
  );
  expect(await refreshCookie(context)).toBeUndefined();
  expect(
    (await context.cookies()).some((cookie) => cookie.name === "zanini_access"),
  ).toBe(false);
  await expect(
    page.getByRole("heading", { name: "faça login", exact: true }),
  ).toBeVisible();
});

test("admin preserva credencial em falha temporária e renova antes de abrir a rota protegida", async ({
  page,
  context,
  sessionApp,
}) => {
  await login(page, sessionApp.origin);
  const before = await refreshCookie(context);
  await invalidateAccess(context);
  sessionApp.faults.refreshStatus = 503;
  const unavailable = await page.goto("/admin/pedidos-pdv");
  expect(unavailable?.status()).toBe(503);
  await expect(page).toHaveURL(`${sessionApp.origin}/admin/pedidos-pdv`);
  expect(await refreshCookie(context)).toBe(before);
  sessionApp.faults.refreshStatus = null;
  const recovered = await page.reload();
  expect(recovered?.status()).toBe(200);
  await expect(page).toHaveURL(`${sessionApp.origin}/admin/pedidos-pdv`);
  expect(await refreshCookie(context)).not.toBe(before);
});

test("falha ao consultar sessão oferece nova tentativa sem redirecionar para login", async ({
  page,
  context,
  sessionApp,
}) => {
  await login(page, sessionApp.origin);
  const before = await refreshCookie(context);
  sessionApp.faults.meUnavailable = true;
  await page.goto("/profile");
  await expect(
    page.getByRole("button", { name: "Tentar novamente", exact: true }),
  ).toBeVisible();
  expect(sessionApp.faults.refreshRequests).toBe(0);
  expect(await refreshCookie(context)).toBe(before);
  sessionApp.faults.meUnavailable = false;
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(page).toHaveURL(`${sessionApp.origin}/profile`);
  await expect(
    page.getByRole("button", { name: "Tentar novamente", exact: true }),
  ).toHaveCount(0);
  expect((await page.request.get("/api/backend/auth/me")).ok()).toBeTruthy();
});
