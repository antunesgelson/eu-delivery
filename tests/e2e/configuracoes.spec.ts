import { test, expect } from "../fixtures/payment-app";
test.use({ integrationSuite: "configuracoes" });

test.beforeEach(async ({ page, paymentApp }) => {
  const response = await page.request.post("/api/backend/auth/login", {
    headers: { Origin: paymentApp.origin },
    data: await paymentApp.customer(true),
  });
  expect(response.ok()).toBeTruthy();
  await page.goto("/admin/config");
  await expect(
    page.getByRole("button", { name: "Salvar configurações" }),
  ).toBeVisible();
});

test("configurações persistem juntas e atualizam contato, retirada e horários públicos", async ({
  page,
  paymentApp,
}) => {
  await page
    .getByLabel("Telefone da loja", { exact: true })
    .fill("48999990000");
  await page
    .getByLabel("Rua de retirada", { exact: true })
    .fill("Rua da configuração");
  await page
    .getByLabel("Instagram", { exact: true })
    .fill("https://www.instagram.com/loja.teste");
  await page.getByLabel("Intervalo de Sábado", { exact: true }).check();
  await page
    .getByLabel("Início do intervalo de Sábado", { exact: true })
    .fill("11:45");
  await page
    .getByLabel("Fim do intervalo de Sábado", { exact: true })
    .fill("12:15");
  const sent = page.waitForResponse(
    (r) =>
      r.url().endsWith("/admin/configuracoes") &&
      r.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  expect((await sent).ok()).toBeTruthy();
  await expect(
    page.getByText("Configurações salvas.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Rua de retirada", { exact: true })).toHaveValue(
    "Rua da configuração",
  );
  await expect(page.getByLabel("Instagram", { exact: true })).toHaveValue(
    "https://www.instagram.com/loja.teste",
  );
  const config = await (
    await page.request.get("/api/backend/configuracao")
  ).json();
  expect(
    config.find((c: { chave: string }) => c.chave === "TELEFONE").valor,
  ).toBe("48999990000");
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 1);
  while (future.getUTCDay() !== 6) future.setUTCDate(future.getUTCDate() + 1);
  const slots = await (
    await page.request.get(
      `/api/backend/pedido/horarios/${future.toISOString().slice(0, 10)}`,
    )
  ).json();
  expect(slots.map((s: { horario: string }) => s.horario)).toEqual([
    "12:30",
    "13:00",
    "13:30",
  ]);
  await page.goto(paymentApp.origin);
  await expect(
    page.locator('a[href="https://www.instagram.com/loja.teste"]').first(),
  ).toBeAttached();
});

test("horários inválidos não são enviados e a edição permanece após falha de gravação", async ({
  page,
}) => {
  await page.getByLabel("Fechamento de Sábado", { exact: true }).fill("10:00");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(
    page.getByText("O fechamento deve ser após a abertura.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Fechamento de Sábado", { exact: true }).fill("14:00");
  await page
    .getByLabel("Rua de retirada", { exact: true })
    .fill("Edição preservada");
  await page.route("**/api/backend/admin/configuracoes", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Configuração temporariamente indisponível." },
    }),
  );
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(
    page.getByText("Configuração temporariamente indisponível.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Rua de retirada", { exact: true })).toHaveValue(
    "Edição preservada",
  );
  await expect(
    page.getByRole("button", { name: "Salvar configurações" }),
  ).toBeEnabled();
  const config = await (
    await page.request.get("/api/backend/configuracao")
  ).json();
  expect(
    JSON.parse(
      config.find((c: { chave: string }) => c.chave === "ENDERECO").valor,
    ).rua,
  ).not.toBe("Edição preservada");
  await page.unroute("**/api/backend/admin/configuracoes");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(
    page.getByText("Configurações salvas.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Rua de retirada", { exact: true })).toHaveValue(
    "Edição preservada",
  );
});

test("dias fechados e faixas de entrega são preservados após recarga", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "Domingo", exact: true }).uncheck();
  await page
    .getByRole("checkbox", { name: "Segunda-feira", exact: true })
    .check();
  await page
    .getByLabel("Abertura de Segunda-feira", { exact: true })
    .fill("09:00");
  await page
    .getByLabel("Fechamento de Segunda-feira", { exact: true })
    .fill("12:00");
  await page.getByRole("button", { name: "Adicionar faixa de CEP" }).click();
  await page.getByLabel("CEP inicial 2", { exact: true }).fill("88650001");
  await page.getByLabel("CEP final 2", { exact: true }).fill("88650009");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(
    page.getByText("Configurações salvas.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Domingo", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("Abertura de Segunda-feira", { exact: true }),
  ).toHaveValue("09:00");
  await expect(page.getByLabel("CEP final 2", { exact: true })).toHaveValue(
    "88650009",
  );
});
