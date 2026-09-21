import { test, expect } from "../fixtures/payment-app";
test.use({ integrationSuite: "cupons-admin" });
test.beforeEach(async ({ page, paymentApp }) => {
  const login = await page.request.post("/api/backend/auth/login", {
    headers: { Origin: paymentApp.origin },
    data: await paymentApp.customer(true),
  });
  expect(login.ok()).toBeTruthy();
  await page.goto("/admin/cupom");
  await expect(
    page.getByRole("heading", { name: "Gestão de cupons" }),
  ).toBeVisible();
});

async function novo(page: import("@playwright/test").Page, code: string) {
  await page.getByRole("button", { name: "Novo cupom", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Código do cupom", { exact: true }).fill(code);
  await dialog
    .getByLabel("Descrição para o cliente", { exact: true })
    .fill("Campanha de teste");
  await dialog.getByLabel("Percentual", { exact: true }).fill("10");
  return dialog;
}

test("valida percentual e preserva formulário em falha antes de salvar e recarregar", async ({
  page,
}) => {
  const dialog = await novo(page, "ADMIN10");
  await dialog.getByLabel("Percentual", { exact: true }).fill("100");
  await dialog
    .getByRole("button", { name: "Criar cupom", exact: true })
    .click();
  await expect(
    dialog.getByText("O desconto percentual máximo é 99%."),
  ).toBeVisible();
  await dialog.getByLabel("Percentual", { exact: true }).fill("10");
  await page.route("**/api/backend/cupom", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 503,
          json: { message: "Falha temporária de cupom." },
        })
      : route.continue(),
  );
  await dialog
    .getByRole("button", { name: "Criar cupom", exact: true })
    .click();
  await expect(
    page.getByText("Falha temporária de cupom.", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByLabel("Código do cupom", { exact: true }),
  ).toHaveValue("ADMIN10");
  await page.unroute("**/api/backend/cupom");
  await dialog
    .getByRole("button", { name: "Criar cupom", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByText("ADMIN10", { exact: true })).toBeVisible();
  const coupons = await (await page.request.get("/api/backend/cupom")).json();
  expect(
    coupons.filter((c: { nome: string }) => c.nome === "ADMIN10"),
  ).toHaveLength(1);
});

test("reconcilia resposta perdida sem duplicar e permite editar, pausar e excluir", async ({
  page,
}) => {
  const dialog = await novo(page, "RESPOSTA10");
  await page.route("**/api/backend/cupom", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const saved = await route.fetch();
    expect(saved.ok()).toBeTruthy();
    await route.fulfill({
      status: 503,
      json: { message: "Resposta perdida." },
    });
  });
  await dialog
    .getByRole("button", { name: "Criar cupom", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.unroute("**/api/backend/cupom");
  const card = page
    .locator("article")
    .filter({ has: page.getByText("RESPOSTA10", { exact: true }) });
  await card.getByRole("button", { name: "Editar", exact: true }).click();
  await dialog
    .getByLabel("Descrição para o cliente", { exact: true })
    .fill("Descrição atualizada");
  await dialog
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(card.getByText("Descrição atualizada")).toBeVisible();
  await card
    .getByRole("button", { name: "Ações de RESPOSTA10", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Pausar", exact: true }).click();
  await expect(card.getByText("Pausado", { exact: true })).toBeVisible();
  const publicos = await (
    await page.request.get("/api/backend/cupom/publicos")
  ).json();
  expect(publicos.some((c: { nome: string }) => c.nome === "RESPOSTA10")).toBe(
    false,
  );
  await card
    .getByRole("button", { name: "Ações de RESPOSTA10", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Excluir", exact: true }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(card).toHaveCount(0);
});
