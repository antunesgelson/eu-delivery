import { APIRequestContext, BrowserContext, Page } from "@playwright/test";
import { test, expect } from "../fixtures/payment-app";
import { AdminMenuCategory } from "../../src/lib/menu-stock";

test.use({ integrationSuite: "cardapio", timezoneId: "Asia/Tokyo" });
let customer: BrowserContext;
let shop: Page;
let client: APIRequestContext;
let origin: string;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nYQAAAAASUVORK5CYII=",
  "base64",
);

test.beforeEach(async ({ page, browser, paymentApp }) => {
  origin = paymentApp.origin;
  const headers = { Origin: origin };
  expect(
    (
      await page.request.post("/api/backend/auth/login", {
        headers,
        data: await paymentApp.customer(true),
      })
    ).ok(),
  ).toBeTruthy();
  customer = await browser.newContext({ baseURL: origin });
  client = customer.request;
  expect(
    (
      await client.post("/api/backend/auth/login", {
        headers,
        data: await paymentApp.customer(),
      })
    ).ok(),
  ).toBeTruthy();
  shop = await customer.newPage();
});
test.afterEach(async () => {
  await customer?.close();
});

async function catalog(
  page: Page,
): Promise<{ version: number; categories: AdminMenuCategory[] }> {
  const result = await page.request.get("/api/backend/admin/catalogo");
  expect(result.ok()).toBeTruthy();
  return result.json();
}
async function changeCatalog(
  page: Page,
  update: (categories: AdminMenuCategory[]) => void,
) {
  const data = await catalog(page);
  update(data.categories);
  const result = await page.request.put("/api/backend/admin/catalogo", {
    headers: { Origin: origin },
    data,
  });
  expect(result.ok()).toBeTruthy();
  return result.json();
}
function categoryCard(page: Page, title: string) {
  return page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
}
async function createProduct(
  page: Page,
  category: AdminMenuCategory,
  title: string,
) {
  await page.goto(`/admin/cardapio/novo-item?categoryId=${category.id}`);
  await page.getByLabel("Nome do item", { exact: true }).fill(title);
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Produto cadastrado no painel para pedir na loja.");
  await page.getByLabel("Preço do item", { exact: true }).fill("2590");
  await page.getByLabel("Estoque de Sábado", { exact: true }).fill("6");
  await page.getByLabel("Estoque de Domingo", { exact: true }).fill("8");
}
async function saveProduct(page: Page, edit = false) {
  const saved = page.waitForResponse(
    (r) =>
      r.url().endsWith("/admin/catalogo") && r.request().method() === "PUT",
  );
  await page
    .getByRole("button", {
      name: edit ? "Salvar alterações" : "Salvar item",
      exact: true,
    })
    .click();
  const response = await saved;
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/admin\/cardapio$/);
  return response.json();
}

test("categoria e produto cadastrados no painel aparecem na loja aberta e geram pedido no administrativo", async ({
  page,
}) => {
  await shop.goto("/");
  await page.goto("/admin/cardapio");
  await page
    .getByRole("button", { name: "Nova categoria", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Nome da categoria", { exact: true })
    .fill("Novidades da integração");
  await page.route("**/api/backend/admin/catalogo", (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({
          status: 503,
          json: { message: "Não foi possível salvar o cardápio agora." },
        })
      : route.continue(),
  );
  await dialog
    .getByRole("button", { name: "Criar categoria", exact: true })
    .click();
  await expect(
    page.getByText("Não foi possível salvar o cardápio agora.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByLabel("Nome da categoria", { exact: true }),
  ).toHaveValue("Novidades da integração");
  await page.unroute("**/api/backend/admin/catalogo");
  await dialog
    .getByRole("button", { name: "Criar categoria", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const category = (await catalog(page)).categories.find(
    (c) => c.title === "Novidades da integração",
  )!;
  await categoryCard(page, category.title)
    .getByRole("button", { name: "Adicionar item", exact: true })
    .click();
  await page.getByRole("button", { name: "Salvar item", exact: true }).click();
  await expect(
    page.getByText("Informe o nome do item.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Informe um preço válido.", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Nome do item", { exact: true })
    .fill("Prato cadastrado no painel");
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Arroz, frango e acompanhamentos.");
  await page.getByLabel("Preço do item", { exact: true }).fill("2590");
  await page.getByLabel("Estoque de Sábado", { exact: true }).fill("6");
  await page.getByLabel("Estoque de Domingo", { exact: true }).fill("8");
  await page
    .locator("#product-image")
    .setInputFiles({ name: "prato.png", mimeType: "image/png", buffer: png });
  const saved = await saveProduct(page);
  const product = saved.categories.find(
    (c: AdminMenuCategory) => c.id === category.id,
  ).products[0];
  expect(product.image).toMatch(/^\/api\/backend\/produto\/\d+\/imagem\?v=/);
  const imageResponse = await client.get(product.image);
  expect(imageResponse.ok()).toBeTruthy();
  expect(imageResponse.headers()["content-type"]).toContain("image/png");
  expect(await imageResponse.body()).toEqual(png);
  await expect(
    shop.getByText(product.title, { exact: true }).first(),
  ).toBeVisible({ timeout: 15000 });
  await shop.getByText(product.title, { exact: true }).first().click();
  await expect(shop).toHaveURL(new RegExp(`/productdetails/${product.id}$`));
  await expect(
    shop.getByText("Arroz, frango e acompanhamentos.", { exact: true }),
  ).toBeVisible();
  await shop
    .getByRole("button", { name: "Aumentar quantidade", exact: true })
    .click();
  await expect(shop.getByRole("button", { name: /Adicionar/ })).toContainText(
    "51.80",
  );
  await shop.getByRole("button", { name: /Adicionar/ }).click();
  await expect(shop).toHaveURL(`${origin}/`);
  await shop.goto("/checkout");
  await shop.getByRole("button", { name: /Escolher recebimento/ }).click();
  await shop.getByRole("button", { name: /Retirar na loja/ }).click();
  await shop.getByRole("button", { name: /Escolher horário/ }).click();
  const schedule = shop.getByRole("dialog");
  // Uma data futura mantém o cenário válido após o fechamento da loja.
  await schedule.locator("button[aria-pressed]").nth(1).click();
  await schedule
    .getByRole("button", { name: /^Retirar entre/ })
    .first()
    .click();
  await schedule
    .getByRole("button", { name: "Confirmar horário", exact: true })
    .click();
  await shop.getByRole("button", { name: /Escolher pagamento/ }).click();
  await shop.getByRole("button", { name: /Dinheiro/ }).click();
  const finalized = shop.waitForResponse((r) =>
    r.url().endsWith("/pedido/finalizar"),
  );
  await shop.getByRole("button", { name: /Enviar pedido/ }).click();
  const response = await finalized;
  expect(response.ok()).toBeTruthy();
  const order = await response.json();
  expect(order.itens[0].produto.id).toBe(product.id);
  expect(order.itens[0].quantidade).toBe(2);
  expect(order.valorFinal).toBe(51.8);
  await expect(shop).toHaveURL(new RegExp(`/orderstatus\\?id=${order.id}$`));
  const after = (await catalog(page)).categories.find(
    (c) => c.id === category.id,
  )!.products[0];
  const day = order.dataEntrega.slice(0, 10);
  expect(after.stockByDate![day]).toBe(
    (new Date(`${day}T12:00Z`).getUTCDay() === 6 ? 6 : 8) - 2,
  );
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const future = day > today;
  await page.goto(
    future ? "/admin/dashboard?view=scheduled" : "/admin/dashboard",
  );
  if (future && new Date(`${day}T12:00Z`).getUTCDay() === 0) {
    await page.getByRole("button", { name: "Domingo", exact: true }).click();
  }
  await expect(page.getByText(`#${order.id}`, { exact: true })).toBeVisible();
  expect(
    (
      await page.request.patch(
        `/api/backend/admin/pedidos/${order.id}/status`,
        { headers: { Origin: origin }, data: { status: "cancelled" } },
      )
    ).ok(),
  ).toBeTruthy();
});

test("conflito preserva o formulário, atualização chega ao produto aberto e resposta perdida não duplica cadastro", async ({
  page,
}) => {
  const category = (await catalog(page)).categories[0];
  await createProduct(page, category, "Edição com concorrência");
  const result = await saveProduct(page);
  const product = result.categories
    .flatMap((c: AdminMenuCategory) => c.products)
    .find((p: { title: string }) => p.title === "Edição com concorrência");
  await shop.goto(`/productdetails/${product.id}`);
  await shop
    .getByRole("button", { name: "Aumentar quantidade", exact: true })
    .click();
  await page.goto(
    `/admin/cardapio/novo-item?categoryId=${category.id}&productId=${product.id}`,
  );
  await page
    .getByLabel("Nome do item", { exact: true })
    .fill("Nome após conflito");
  await page.getByLabel("Preço do item", { exact: true }).fill("3000");
  await changeCatalog(page, (categories) => {
    categories[0].badge = "Alteração de outro administrador";
  });
  await page
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await expect(
    page.getByText(
      "O cardápio ou estoque foi atualizado. Recarregue antes de salvar.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Nome do item", { exact: true })).toHaveValue(
    "Nome após conflito",
  );
  await expect(page.getByLabel("Preço do item", { exact: true })).toHaveValue(
    "30,00",
  );
  await saveProduct(page, true);
  expect((await catalog(page)).categories[0].badge).toBe(
    "Alteração de outro administrador",
  );
  await expect(
    shop.getByRole("heading", { name: "Nome após conflito", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(shop.getByRole("button", { name: /Adicionar/ })).toContainText(
    "60.00",
  );
  await createProduct(page, category, "Resposta perdida");
  await page.route("**/api/backend/admin/catalogo", async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    const saved = await route.fetch();
    expect(saved.ok()).toBeTruthy();
    await route.fulfill({
      status: 503,
      json: { message: "Resposta perdida após salvar." },
    });
  });
  await page.getByRole("button", { name: "Salvar item", exact: true }).click();
  await expect(
    page.getByText("Resposta perdida após salvar.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome do item", { exact: true })).toHaveValue(
    "Resposta perdida",
  );
  await page.unroute("**/api/backend/admin/catalogo");
  await saveProduct(page);
  expect(
    (await catalog(page)).categories
      .flatMap((c) => c.products)
      .filter((p) => p.title === "Resposta perdida"),
  ).toHaveLength(1);
});

test("duplicação usa IDs próprios, pausa da categoria remove itens da loja e estoque por dia pode ser liberado", async ({
  page,
}) => {
  const category: AdminMenuCategory = {
    id: `disponibilidade-${Date.now()}`,
    title: "Disponibilidade de teste",
    badge: "Teste",
    status: "active",
    products: [
      {
        id: Date.now(),
        title: "Produto para disponibilidade",
        description: "Teste",
        price: 20,
        image: `data:image/png;base64,${png.toString("base64")}`,
        servingSize: 1,
        stock: { saturday: 6, sunday: 8 },
        forcedSoldOut: false,
        productKind: "simple",
        components: [],
      },
    ],
  };
  await changeCatalog(page, (categories) => {
    categories.push(category);
  });
  const product = category.products[0];
  await shop.goto(`/productdetails/${product.id}`);
  await page.goto("/admin/cardapio");
  const card = categoryCard(page, category.title);
  await card
    .getByRole("button", { name: "Ações categoria", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Duplicar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: `${category.title} cópia`, exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      (await catalog(page)).categories.some(
        (c) => c.title === `${category.title} cópia`,
      ),
    )
    .toBe(true);
  const copy = (await catalog(page)).categories.find(
    (c) => c.title === `${category.title} cópia`,
  )!;
  await expect(page.getByText("Categoria duplicada.", { exact: true })).toBeVisible();
  expect(copy.products[0].id).not.toBe(product.id);
  await card
    .getByRole("button", { name: "Ações categoria", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Editar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("switch", { name: "Categoria ativa na loja", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    shop.getByText("Produto indisponível no momento.", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  expect(
    (await client.get(`/api/backend/produto/${product.id}`)).status(),
  ).toBe(404);
  const publicMenu = await (
    await client.get("/api/backend/categoria/lista/detalhes")
  ).json();
  expect(publicMenu.some((c: { id: string }) => c.id === category.id)).toBe(
    false,
  );
  const copied = categoryCard(page, copy.title);
  const expand = copied.getByRole("button", {
    name: "Expandir categoria",
    exact: true,
  });
  if (await expand.count()) await expand.click();
  const soldOut = copied.getByRole("switch", {
    name: "Esgotar estoque de Sábado",
    exact: true,
  });
  await soldOut.click();
  await expect
    .poll(async () =>
      Object.values(
        (await catalog(page)).categories.find((c) => c.id === copy.id)!
          .products[0].soldOutByDate ?? {},
      ).some(Boolean),
    )
    .toBe(true);
  await soldOut.click();
  await expect
    .poll(async () =>
      Object.values(
        (await catalog(page)).categories.find((c) => c.id === copy.id)!
          .products[0].soldOutByDate ?? {},
      ).some(Boolean),
    )
    .toBe(false);
  await page.reload();
  await copied
    .getByRole("button", { name: "Expandir categoria", exact: true })
    .click();
  await expect(soldOut).not.toBeChecked();
});

test("produto composto cadastrado no painel permite pedido e baixa o estoque do componente", async ({
  page,
  paymentApp,
}) => {
  const category: AdminMenuCategory = {
    id: `combos-${Date.now()}`,
    title: "Combos da integração",
    badge: "Teste",
    status: "active",
    products: [],
  };
  await changeCatalog(page, (categories) => {
    categories.push(category);
  });
  await createProduct(page, category, "Meio frango integrado");
  await page.getByRole("button", { name: /Produto composto/ }).click();
  await page.getByRole("button", { name: "Salvar item", exact: true }).click();
  await expect(
    page.getByText(
      "Informe pelo menos um componente para o produto composto.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Adicionar componente", exact: true })
    .click();
  await page
    .getByLabel("Produto base do componente", { exact: true })
    .selectOption("101");
  await page
    .getByLabel("Quantidade consumida do componente", { exact: true })
    .fill("0.5");
  const saved = await saveProduct(page);
  const product = saved.categories.find(
    (c: AdminMenuCategory) => c.id === category.id,
  ).products[0];
  expect(product.components).toEqual([{ productId: 101, quantity: 0.5 }]);
  await shop.route(`**/api/backend/produto/${product.id}`, (route) =>
    route.fulfill({ status: 503, json: { message: "Consulta indisponível." } }),
  );
  await shop.goto(`/productdetails/${product.id}`);
  await expect(
    shop.getByText("Não foi possível carregar o produto.", { exact: true }),
  ).toBeVisible();
  await shop.unroute(`**/api/backend/produto/${product.id}`);
  await shop
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await shop
    .getByRole("button", { name: "Aumentar quantidade", exact: true })
    .click();
  await shop.getByRole("button", { name: /Adicionar/ }).click();
  await expect(shop).toHaveURL(`${origin}/`);
  expect(
    (
      await client.put("/api/backend/pedido/carrinho", {
        headers: { Origin: origin },
        data: {
          tipoRecebimento: "pickup",
          dataEntrega: paymentApp.slot,
          formaPagamento: "Pagamento na Entrega - Dinheiro",
        },
      })
    ).ok(),
  ).toBeTruthy();
  await shop.goto("/checkout");
  const finalized = shop.waitForResponse((r) =>
    r.url().endsWith("/pedido/finalizar"),
  );
  await shop.getByRole("button", { name: /Enviar pedido/ }).click();
  const response = await finalized;
  expect(response.ok()).toBeTruthy();
  const order = await response.json();
  expect(order.itens[0].produto.id).toBe(product.id);
  expect(order.itens[0].quantidade).toBe(2);
  const base = (await catalog(page)).categories
    .flatMap((c) => c.products)
    .find((p) => p.id === 101)!;
  expect(base.stockByDate![paymentApp.slot.slice(0, 10)]).toBe(99);
  expect(
    (
      await page.request.patch(
        `/api/backend/admin/pedidos/${order.id}/status`,
        { headers: { Origin: origin }, data: { status: "cancelled" } },
      )
    ).ok(),
  ).toBeTruthy();
});
