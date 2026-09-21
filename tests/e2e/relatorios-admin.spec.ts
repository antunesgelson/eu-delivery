import { test, expect } from "../fixtures/payment-app";
import { readFile } from "node:fs/promises";
test.use({ integrationSuite: "relatorios-admin" });
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
test("relatório filtra finalizações e exporta os valores apresentados", async ({
  page,
  paymentApp,
}) => {
  const headers = { Origin: paymentApp.origin };
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
          dataEntrega: paymentApp.slot,
          formaPagamento: "Pagamento na Entrega - Dinheiro",
        },
      })
    ).ok(),
  ).toBeTruthy();
  const created = await page.request.post("/api/backend/pedido/finalizar", {
    headers: { ...headers, "Idempotency-Key": "relatorio-novo" },
    data: {},
  });
  expect(created.ok()).toBeTruthy();
  const order = await created.json();
  expect(
    (
      await page.request.patch(
        `/api/backend/admin/pedidos/${order.id}/pagamento`,
        { headers, data: { paymentStatus: "paid" } },
      )
    ).ok(),
  ).toBeTruthy();
  for (const status of ["production", "ready", "completed"])
    expect(
      (
        await page.request.patch(
          `/api/backend/admin/pedidos/${order.id}/status`,
          { headers, data: { status } },
        )
      ).ok(),
    ).toBeTruthy();
  await page.goto("/admin/dashboard?view=reports&report=orders");
  await expect(
    page.getByRole("cell", { name: `#${order.id}`, exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar página CSV" }).click();
  const download = await downloadPromise;
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain('"Pedido";"Cliente";"Finalização"');
  expect(csv).toContain(`"#${order.id}"`);
  await page.getByLabel("Data inicial", { exact: true }).fill("2020-01-01");
  await page.getByLabel("Data final", { exact: true }).fill("2020-01-31");
  await page.getByRole("button", { name: "Aplicar período" }).click();
  await expect(
    page.getByText("Nenhum registro para este relatório."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Exportar página CSV" }),
  ).toBeDisabled();
  await page.getByLabel("Data inicial", { exact: true }).fill("2020-02-01");
  await page.getByRole("button", { name: "Aplicar período" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Informe um período válido" }),
  ).toContainText("Informe um período válido");
});
test("falha de indicadores não bloqueia os clientes e permite tentar novamente", async ({
  page,
}) => {
  await page.route("**/api/backend/admin/relatorios?**", (route) =>
    route.fulfill({ status: 503, json: { message: "Relatório indisponível" } }),
  );
  await page.goto("/admin/dashboard?view=reports&report=customers");
  await expect(
    page.getByText("Não foi possível carregar os indicadores."),
  ).toBeVisible();
  await expect(page.getByLabel("Buscar cliente")).toBeEnabled();
  await page.unroute("**/api/backend/admin/relatorios?**");
  await page.getByRole("button", { name: "Atualizar indicadores" }).click();
  await expect(
    page.getByText("Não foi possível carregar os indicadores."),
  ).not.toBeVisible();
  await expect(
    page.getByText("Clientes cadastrados", { exact: true }),
  ).toBeVisible();
});
test("menu móvel navega, filtra opções e encerra a sessão", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/config");
  await page.getByRole("button", { name: "Abrir menu administrativo" }).click();
  const nav = page.getByRole("dialog", { name: "Navegação administrativa" });
  await nav.getByLabel("Buscar no menu").fill("cupons");
  await expect(
    nav.getByRole("link", { name: "Gestor de cardápio" }),
  ).toHaveCount(0);
  await nav.getByRole("link", { name: "Cupons", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/cupom/);
  await expect(nav).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Gestão de cupons" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir menu administrativo" }).click();
  await nav.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/admin/config");
  await expect(page).toHaveURL(/\/signin/);
});
