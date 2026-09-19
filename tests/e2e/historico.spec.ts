import { test, expect, BrowserContext } from "@playwright/test";

const origin = process.env.E2E_BASE_URL || "http://localhost:4051";
const backend = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4052";
const run = Date.now().toString();
const tel = `55479${run.slice(-8)}`;
let cookies: Parameters<BrowserContext["addCookies"]>[0] = [];
const pedidos: { id: number; valorFinal: number }[] = [];
let adminToken: string;

test.beforeAll(async ({ request }) => {
  for (const url of [origin, backend]) {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname))
      throw new Error("Esta suíte exige serviços locais.");
  }
  const email = process.env.E2E_ADMIN_EMAIL,
    senha = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !senha)
    throw new Error(
      "Defina as credenciais administrativas locais E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD.",
    );
  const login = await request.post(`${backend}/auth/login`, {
    data: { email, senha },
  });
  expect(login.ok()).toBeTruthy();
  adminToken = (await login.json()).token;
  const headers = { Authorization: `Bearer ${adminToken}` };
  const cliente = await request.post(`${backend}/admin/clientes`, {
    headers,
    data: { nome: `Histórico E2E ${run}`, tel },
  });
  expect(cliente.ok()).toBeTruthy();
  const clienteId = (await cliente.json()).id;
  const desafio = await (
    await request.post(`${backend}/auth/wp`, { data: { tel } })
  ).json();
  expect(
    desafio.developmentCode,
    "Use AUTH_DELIVERY_MODE=development",
  ).toBeTruthy();
  const session = await request.post(`${origin}/api/backend/auth/verify`, {
    headers: { Origin: origin },
    data: { tel, desafioId: desafio.desafioId, code: desafio.developmentCode },
  });
  expect(session.ok()).toBeTruthy();
  cookies = (await request.storageState()).cookies;
  const day = new Date();
  day.setUTCDate(day.getUTCDate() + 14);
  while (day.getUTCDay() !== 6) day.setUTCDate(day.getUTCDate() + 1);
  const date = day.toISOString().slice(0, 10);
  const slots = await (
    await request.get(`${backend}/pedido/horarios/${date}`)
  ).json();
  const slot = slots.find((value: { disponivel: boolean }) => value.disponivel);
  expect(slot).toBeTruthy();
  for (let index = 0; index < 11; index++) {
    const response = await request.post(`${backend}/admin/pdv`, {
      headers: { ...headers, "Idempotency-Key": `historic-${run}-${index}` },
      data: {
        clienteId,
        itens: [{ produtoId: 101, quantidade: 1, obs: `Observação ${index}` }],
        dataEntrega: slot.data,
        canal: index === 10 ? "entrega" : "retirada",
        endereco:
          index === 10
            ? {
                apelido: "Casa teste",
                rua: "Rua do histórico",
                numero: "42",
                bairro: "Centro",
                cep: "88650000",
              }
            : undefined,
        formaPagamento: "Pagamento na Entrega - Dinheiro",
        pagamentoStatus: "pending",
        ajuste: index,
      },
    });
    expect(response.status()).toBe(201);
    const order = await response.json();
    pedidos.push({ id: order.id, valorFinal: order.valorFinal });
    // Cada pedido é cancelado logo após a criação para liberar a reserva.
    const cancel = await request.patch(
      `${backend}/admin/pedidos/${order.id}/status`,
      { headers, data: { status: "cancelled" } },
    );
    expect(cancel.ok()).toBeTruthy();
  }
});

test.beforeEach(async ({ page, context }) => {
  await context.addCookies(cookies);
  const clear = await page.request.delete("/api/backend/pedido/carrinho", {
    headers: { Origin: origin },
  });
  expect(clear.ok()).toBeTruthy();
  await page.goto("/historic");
  await expect(
    page.getByRole("button", {
      name: `Detalhes do pedido #${pedidos[10].id}`,
      exact: true,
    }),
  ).toBeVisible();
});

test("paginação mantém total e último pedido e mostra endereço de entrega", async ({
  page,
}) => {
  const summary = page.getByRole("region", { name: "Resumo do histórico" });
  await expect(summary.getByText("11", { exact: true })).toBeVisible();
  await expect(summary.getByText("R$ 85,00", { exact: true })).toBeVisible();
  await page
    .getByRole("button", {
      name: `Detalhes do pedido #${pedidos[10].id}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Entrega no endereço", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Rua do histórico, 42, Centro", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  await expect(page.getByText("Página 2", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: `Detalhes do pedido #${pedidos[0].id}`,
      exact: true,
    }),
  ).toBeVisible();
  await expect(summary.getByText("11", { exact: true })).toBeVisible();
  await expect(summary.getByText("R$ 85,00", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Próxima", exact: true }),
  ).toBeDisabled();
});

test("repetição preserva carrinho e não duplica itens após resposta perdida", async ({
  page,
}) => {
  const existing = await page.request.post("/api/backend/pedido/carrinho", {
    headers: { Origin: origin },
    data: { produtoId: 302, quantidade: 1 },
  });
  expect(existing.ok()).toBeTruthy();
  const id = pedidos[10].id;
  await page
    .getByRole("button", { name: `Detalhes do pedido #${id}`, exact: true })
    .click();
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let firstKey: string | undefined;
  await page.route(`**/api/backend/pedido/${id}/repetir`, async (route) => {
    firstKey = route.request().headers()["idempotency-key"];
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    await gate;
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Pedir novamente", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Adicionando…", exact: true }),
  ).toBeDisabled();
  release();
  await expect(
    page.getByText("Não foi possível concluir a operação. Tente novamente.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute(`**/api/backend/pedido/${id}/repetir`);
  const retried = page.waitForResponse((response) =>
    response.url().endsWith(`/pedido/${id}/repetir`),
  );
  await page
    .getByRole("button", { name: "Pedir novamente", exact: true })
    .click();
  const response = await retried;
  expect(response.status()).toBe(201);
  expect(response.request().headers()["idempotency-key"]).toBe(firstKey);
  const cart = await response.json();
  expect(cart.itens).toHaveLength(2);
  expect(cart.valorFinal).toBe(80);
  expect(
    cart.itens.find(
      (item: { produto: { id: number } }) => item.produto.id === 101,
    ).obs,
  ).toBe("Observação 10");
  expect(cart.dataEntrega).toBeNull();
  expect(cart.endereco).toEqual({});
  expect(cart.formaPagamento).toBe("");
  await expect(page).toHaveURL(/\/cart$/);
  await page.reload();
  const persisted = await (
    await page.request.get("/api/backend/pedido/carrinho")
  ).json();
  expect(persisted.itens).toHaveLength(2);
  expect(persisted.valorFinal).toBe(80);
});

test.afterAll(async ({ request }) => {
  if (!adminToken) return;
  for (const order of pedidos) {
    await request.patch(`${backend}/admin/pedidos/${order.id}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: "cancelled" },
    });
  }
});
