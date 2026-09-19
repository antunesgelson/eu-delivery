import { APIRequestContext, Page } from "@playwright/test";
import { test, expect } from "../fixtures/payment-app";

let admin: APIRequestContext;
let validity: string;
let publicCoupon: { id: string };
let minimumCoupon: { id: string };
const orders: number[] = [];
test.use({ timezoneId: "America/Sao_Paulo", integrationSuite: "cupons" });

test.beforeAll(async ({ playwright, paymentApp }) => {
  admin = await playwright.request.newContext({
    baseURL: paymentApp.origin,
    extraHTTPHeaders: { Origin: paymentApp.origin },
  });
  expect(
    (
      await admin.post("/api/backend/auth/login", {
        data: await paymentApp.customer(true),
      })
    ).ok(),
  ).toBeTruthy();
  validity = paymentApp.slot.slice(0, 10);
  for (const data of [
    {
      nome: "PUBLICO10",
      tipo: "porcentagem",
      valor: 10,
      valorMinimoGasto: 50,
      listaPublica: true,
      unicoUso: false,
    },
    {
      nome: "MINIMO100",
      tipo: "valor_fixo",
      valor: 5,
      valorMinimoGasto: 100,
      listaPublica: true,
      unicoUso: false,
    },
    {
      nome: "PRIVADO5",
      tipo: "valor_fixo",
      valor: 5,
      valorMinimoGasto: 0,
      listaPublica: false,
      unicoUso: true,
    },
  ]) {
    const result = await admin.post("/api/backend/cupom", {
      data: {
        ...data,
        descricao: "Cupom de integração",
        quantidade: 10,
        validade: validity,
        status: true,
      },
    });
    expect(result.ok()).toBeTruthy();
    const coupon = await result.json();
    if (data.nome === "PUBLICO10") publicCoupon = coupon;
    if (data.nome === "MINIMO100") minimumCoupon = coupon;
  }
});
test.afterAll(async () => {
  try {
    for (const id of orders)
      expect(
        (
          await admin.patch(`/api/backend/admin/pedidos/${id}/status`, {
            data: { status: "cancelled" },
          })
        ).ok(),
      ).toBeTruthy();
  } finally {
    await admin?.dispose();
  }
});
test.beforeEach(async ({ page, paymentApp }) => {
  const headers = { Origin: paymentApp.origin };
  expect(
    (
      await page.request.post("/api/backend/auth/login", {
        headers,
        data: await paymentApp.customer(false, 1000),
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await page.request.post("/api/backend/pedido/carrinho", {
        headers,
        data: { produtoId: 101, quantidade: 1 },
      })
    ).ok(),
  ).toBeTruthy();
});
async function apply(page: Page, code: string) {
  await page
    .getByRole("textbox", { name: "Código do cupom", exact: true })
    .fill(code);
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
}
async function cart(page: Page) {
  const response = await page.request.get("/api/backend/pedido/carrinho");
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test("lista recupera falha, mostra validade correta e aplica/remove desconto confirmado pela API", async ({
  page,
  paymentApp,
}) => {
  await page.route("**/api/backend/cupom/publicos", (route) =>
    route.fulfill({ status: 503, json: { message: "Lista indisponível." } }),
  );
  await page.goto("/cupom");
  await expect(
    page.getByText("Não foi possível carregar os cupons disponíveis.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute("**/api/backend/cupom/publicos");
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  const publicCard = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "PUBLICO10", exact: true }),
    });
  await expect(
    publicCard.getByText(validity.split("-").reverse().join("/"), {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("article")
      .filter({ hasText: "MINIMO100" })
      .getByRole("button"),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "PRIVADO5", exact: true }),
  ).toHaveCount(0);
  let sent = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/pedido/carrinho") && r.method() === "PUT") sent++;
  });
  await apply(page, "");
  await expect(
    page.getByText("Informe o código do cupom.", { exact: true }),
  ).toBeVisible();
  expect(sent).toBe(0);
  await page.route("**/api/backend/pedido/carrinho", (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({
          status: 503,
          json: { message: "Carrinho indisponível." },
        })
      : route.continue(),
  );
  await apply(page, "  publico10  ");
  await expect(
    page.getByText("Carrinho indisponível.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Código do cupom", exact: true }),
  ).toHaveValue("  publico10  ");
  expect((await cart(page)).descontoCupom).toBe(0);
  await page.unroute("**/api/backend/pedido/carrinho");
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/backend/pedido/carrinho", async (route) => {
    if (route.request().method() === "PUT") await gate;
    await route.continue();
  });
  const applied = page.waitForResponse(
    (r) =>
      r.url().endsWith("/pedido/carrinho") && r.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Aplicando…", exact: true }),
  ).toBeDisabled();
  await expect(publicCard.getByRole("button")).toBeDisabled();
  release();
  const result = await applied;
  expect(result.request().postDataJSON()).toEqual({ cupom: "PUBLICO10" });
  expect(result.ok()).toBeTruthy();
  await expect(page).toHaveURL(`${paymentApp.origin}/cart`);
  expect((await cart(page)).valorFinal).toBe(58.5);
  await page.goto("/cupom");
  await expect(
    page.getByText("Desconto de R$ 6,50 no pedido.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remover cupom", exact: true })
    .click();
  await expect(
    page.getByText("Cupom removido.", { exact: true }),
  ).toBeVisible();
  expect((await cart(page)).valorFinal).toBe(65);
  await page.reload();
  await expect(page.getByText("Cupom ativo", { exact: true })).toHaveCount(0);
});

test("consultar cupons e tentar código inválido preserva cashback; aplicação válida troca na API", async ({
  page,
  paymentApp,
}) => {
  await page.goto("/cart");
  const used = page.waitForResponse(
    (r) =>
      r.url().endsWith("/pedido/carrinho") && r.request().method() === "PUT",
  );
  await page
    .getByRole("switch", { name: "Utilizar cashback", exact: true })
    .click();
  expect((await used).ok()).toBeTruthy();
  expect((await cart(page)).cashBack).toBe(10);
  await page.getByRole("button", { name: "Trocar", exact: true }).click();
  await expect(page).toHaveURL(`${paymentApp.origin}/cupom`);
  expect((await cart(page)).cashBack).toBe(10);
  await expect(
    page.getByText(
      "O cashback será substituído somente ao aplicar um cupom válido.",
      { exact: true },
    ),
  ).toBeVisible();
  await apply(page, "INEXISTENTE");
  await expect(
    page.getByText("Cupom não encontrado.", { exact: true }),
  ).toBeVisible();
  expect((await cart(page)).cashBack).toBe(10);
  await apply(page, "MINIMO100");
  await expect(
    page.getByText("Cupom indisponível ou valor mínimo não atingido.", {
      exact: true,
    }),
  ).toBeVisible();
  expect((await cart(page)).cashBack).toBe(10);
  await apply(page, "PUBLICO10");
  await expect(page).toHaveURL(`${paymentApp.origin}/cart`);
  const result = await cart(page);
  expect(result.cashBack).toBe(0);
  expect(result.descontoCupom).toBe(6.5);
  expect(result.valorFinal).toBe(58.5);
  await expect(
    page.getByRole("switch", { name: "Utilizar cashback", exact: true }),
  ).toBeDisabled();
});

test("cupom privado persiste no checkout e uso único é recusado no próximo pedido", async ({
  page,
  paymentApp,
}) => {
  await page.goto("/cupom");
  await apply(page, "privado5");
  await expect(page).toHaveURL(`${paymentApp.origin}/cart`);
  const headers = { Origin: paymentApp.origin };
  expect(
    (
      await page.request.put("/api/backend/pedido/carrinho", {
        headers,
        data: {
          tipoRecebimento: "pickup",
          dataEntrega: paymentApp.slot,
          formaPagamento: "Pagamento na Entrega - Dinheiro",
        },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/checkout");
  const finalized = page.waitForResponse((r) =>
    r.url().endsWith("/pedido/finalizar"),
  );
  await page.getByRole("button", { name: /Enviar pedido/ }).click();
  const response = await finalized;
  expect(response.ok()).toBeTruthy();
  const order = await response.json();
  orders.push(order.id);
  expect(order.descontoCupom).toBe(5);
  expect(order.valorFinal).toBe(60);
  expect(order.cupom.nome).toBe("PRIVADO5");
  await expect(page).toHaveURL(
    `${paymentApp.origin}/orderstatus?id=${order.id}`,
  );
  expect(
    (
      await page.request.post("/api/backend/pedido/carrinho", {
        headers,
        data: { produtoId: 101, quantidade: 1 },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto("/cupom");
  await apply(page, "PRIVADO5");
  await expect(
    page.getByText("Este cupom já foi utilizado.", { exact: true }),
  ).toBeVisible();
  expect((await cart(page)).descontoCupom).toBe(0);
});

test("lista vazia permite código recebido e seleção exige sessão e itens no carrinho", async ({
  page,
  context,
  paymentApp,
}) => {
  for (const coupon of [publicCoupon, minimumCoupon])
    expect(
      (await admin.delete(`/api/backend/cupom/${coupon.id}`)).ok(),
    ).toBeTruthy();
  await page.goto("/cupom");
  await expect(
    page.getByText(
      "Nenhum cupom público disponível no momento. Você ainda pode informar um código recebido.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Aplicar", exact: true }),
  ).toBeEnabled();
  expect(
    (
      await page.request.delete("/api/backend/pedido/carrinho", {
        headers: { Origin: paymentApp.origin },
      })
    ).ok(),
  ).toBeTruthy();
  await page.reload();
  await expect(
    page.getByText(/Adicione produtos ao carrinho para usar um cupom/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Aplicar", exact: true }),
  ).toBeDisabled();
  await context.clearCookies();
  await page.goto("/cupom");
  await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fcupom/);
});
