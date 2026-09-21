import { test, expect } from "../fixtures/payment-app";
test.use({ integrationSuite: "controles" });
test.beforeEach(async ({ page, paymentApp }) => {
  expect(
    (
      await page.request.post("/api/backend/auth/login", {
        headers: { Origin: paymentApp.origin },
        data: await paymentApp.customer(true),
      })
    ).ok(),
  ).toBeTruthy();
});
test("PDV pesquisa, filtra e preserva edição de itens no rascunho", async ({
  page,
}) => {
  await page.goto("/admin/dashboard");
  await page.getByRole("link", { name: "Novo pedido", exact: true }).click();
  await expect(page).toHaveURL(/pedidos-pdv/);
  await page.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(
    page.getByLabel("Pesquisar produtos", { exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByLabel("Filtrar produtos").selectOption("promotion");
  await expect(page.getByText("Nenhum produto encontrado.")).toBeVisible();
  await page.getByLabel("Filtrar produtos").selectOption("available");
  await page.getByRole("button", { name: /Frango teste/ }).click();
  await page
    .getByRole("button", { name: "Adicionar item", exact: true })
    .click();
  await page.getByRole("button", { name: "Q Editar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Editar itens do pedido" });
  await dialog
    .getByLabel("Observação de Frango teste", { exact: true })
    .fill("Separar o molho");
  await dialog.getByRole("button", { name: "Aumentar Frango teste" }).click();
  await dialog.getByRole("button", { name: "Concluir edição" }).click();
  await page
    .getByRole("button", { name: "Salvar pedido", exact: true })
    .click();
  await expect(
    page.getByText("Rascunho salvo.", { exact: true }),
  ).toBeVisible();
  const drafts = await (
    await page.request.get("/api/backend/admin/pdv/rascunhos")
  ).json();
  expect(drafts[0].dados.orderItems[0]).toMatchObject({
    quantity: 2,
    note: "Separar o molho",
  });
});
test("agenda mantém pedidos de segunda-feira no dia correto", async ({
  page,
  paymentApp,
}) => {
  const headers = { Origin: paymentApp.origin };
  expect(
    (
      await page.request.put("/api/backend/admin/configuracoes", {
        headers,
        data: {
          configuracoes: [
            {
              chave: "HORARIOATENDIMENTO",
              valor: JSON.stringify({
                seg: { abertura: "11:30", fechamento: "14:00" },
              }),
            },
          ],
        },
      })
    ).ok(),
  ).toBeTruthy();
  const date = new Date(paymentApp.slot);
  while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() + 1);
  await paymentApp.setStockCapacity(date.toISOString().slice(0, 10), 20);
  expect(
    (
      await page.request.post("/api/backend/pedido/carrinho", {
        headers,
        data: { produtoId: 101, quantidade: 1 },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await page.request.put("/api/backend/pedido/carrinho", {
        headers,
        data: {
          tipoRecebimento: "pickup",
          dataEntrega: date.toISOString(),
          formaPagamento: "Pagamento na Entrega - Dinheiro",
        },
      })
    ).ok(),
  ).toBeTruthy();
  const saved = await page.request.post("/api/backend/pedido/finalizar", {
    headers: { ...headers, "Idempotency-Key": "segunda-controle" },
    data: {},
  });
  expect(saved.ok()).toBeTruthy();
  const order = await saved.json();
  await page.goto("/admin/dashboard?view=scheduled");
  await page
    .getByRole("button", { name: "Segunda-feira", exact: true })
    .click();
  await expect(
    page
      .getByRole("button")
      .filter({ has: page.getByText(`#${order.id}`, { exact: true }) }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Domingo", exact: true }).click();
  await expect(
    page.getByText(`#${order.id}`, { exact: true }),
  ).not.toBeVisible();
});
test("substituição usa identificadores textuais e preserva o ingrediente obrigatório", async ({
  page,
  paymentApp,
}) => {
  await paymentApp.configureProduct({
    ingredientes: [
      {
        id: "base",
        nome: "Base obrigatória",
        valor: 1,
        removivel: false,
        quantia: 1,
      },
      { id: "cebola", nome: "Cebola", valor: 2, removivel: true, quantia: 1 },
      { id: "tomate", nome: "Tomate", valor: 1, removivel: true, quantia: 1 },
    ],
    adicionais: [{ id: "molho", nome: "Molho", valor: 5 }],
  });
  await page.request.delete("/api/backend/pedido/carrinho", {
    headers: { Origin: paymentApp.origin },
  });
  await page.goto("/productdetails/101");
  await page
    .getByRole("checkbox", { name: "Remover Cebola", exact: true })
    .check();
  const dialog = page.getByRole("dialog", { name: "Substituir Cebola" });
  await dialog.getByRole("radio", { name: "Tomate", exact: true }).check();
  await expect(
    dialog.getByRole("radio", { name: "Tomate", exact: true }),
  ).toBeChecked();
  await dialog.getByRole("button", { name: "Substituir", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Adicionar Molho", exact: true })
    .check();
  await page.getByRole("button", { name: /Adicionar/i }).click();
  await expect(page).toHaveURL(/\/$/);
  const cart = await (
    await page.request.get("/api/backend/pedido/carrinho")
  ).json();
  expect(
    cart.itens[0].produto.ingredientes.map((i: { id: string }) => i.id),
  ).toContain("base");
  expect(cart.itens[0].produto.substituicoes).toMatchObject([
    { removerId: "cebola", adicionarId: "tomate" },
  ]);
  expect(cart.itens[0].valor).toBe(70);
  await page.goto("/cart");
  await expect(page.getByText(/Cebola substituído por Tomate/)).toBeVisible();
  await expect(page.getByText(/Adicionais: Molho/)).toBeVisible();
  const headers = { Origin: paymentApp.origin };
  expect((await page.request.put("/api/backend/pedido/carrinho", { headers, data: { tipoRecebimento: "pickup", dataEntrega: paymentApp.slot, formaPagamento: "Pagamento na Entrega - Dinheiro" } })).ok()).toBeTruthy();
  const saved = await page.request.post("/api/backend/pedido/finalizar", { headers: { ...headers, "Idempotency-Key": "pedido-com-opcoes" }, data: {} });
  expect(saved.ok()).toBeTruthy();
  const pedido = await saved.json();
  await page.goto("/admin/dashboard?view=scheduled");
  await page.getByRole("button").filter({ has: page.getByText(`#${pedido.id}`, { exact: true }) }).click();
  await expect(page.getByText(/Cebola substituído por Tomate/).first()).toBeVisible();
  await expect(page.getByText(/Adicionais: Molho/).first()).toBeVisible();
});
