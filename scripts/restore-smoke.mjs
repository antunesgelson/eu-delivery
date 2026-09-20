import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Exclusivo do projeto descartável de test:docker; não aceita um banco operacional.
export async function ensaiarRestauracao({
  compose,
  environment,
  directory,
  api,
  web,
}) {
  assert.equal(environment.MYSQL_DB, "zanini_smoke");
  assert.match(
    environment.COMPOSE_PROJECT_NAME,
    /^zanini-smoke-\d+-[a-f0-9]+$/,
  );
  const source = "zanini_smoke";
  const destination = "zanini_restored";
  let token;
  async function request(path, method = "GET", body, expected = 200, key) {
    const response = await fetch(`${api}/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, expected, `${method} ${path}`);
    return response.json();
  }
  token = (
    await request(
      "auth/login",
      "POST",
      {
        email: environment.ADMIN_EMAIL,
        senha: environment.ADMIN_PASSWORD,
      },
      201,
    )
  ).token;
  const customer = await request(
    "admin/clientes",
    "POST",
    {
      nome: "Cliente do ensaio de restauração",
      tel: "5548999990000",
    },
    201,
  );
  // Próximo sábado, sempre futuro, para não depender do horário da execução.
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  while (date.getUTCDay() !== 6) date.setUTCDate(date.getUTCDate() + 1);
  const slots = await request(
    `pedido/horarios/${date.toISOString().slice(0, 10)}`,
  );
  const slot = slots.find((item) => item.disponivel);
  assert.ok(slot, "O seed deve oferecer um horário futuro de teste.");
  const payload = {
    clienteId: customer.id,
    itens: [{ produtoId: 101, quantidade: 1 }],
    dataEntrega: slot.data,
    canal: "entrega",
    endereco: {
      apelido: "Teste",
      rua: "Rua de teste",
      numero: "10",
      bairro: "Centro",
      cep: "88650000",
    },
    formaPagamento: "Pagamento na Entrega - Dinheiro",
  };
  const pending = await request(
    "admin/pdv",
    "POST",
    payload,
    201,
    "restore-pending",
  );
  const paid = await request(
    "admin/pdv",
    "POST",
    {
      ...payload,
      formaPagamento: "Pagamento na Entrega - Dividido",
      pagamentoStatus: "paid",
      pagamentos: [
        { metodo: "cash", valor: 30 },
        { metodo: "card", valor: 45 },
      ],
    },
    201,
    "restore-paid",
  );
  assert.equal(pending.valorFinal, 75);
  assert.equal(paid.valorFinal, 75);
  for (const status of ["production", "ready", "completed"]) {
    await request(`admin/pedidos/${paid.id}/status`, "PATCH", { status });
  }
  const orders = await Promise.all(
    [pending, paid].map((p) => request(`pedido/${p.id}`)),
  );
  assert.equal(orders[0].pagamentoStatus, "pending");
  assert.equal(orders[1].status, "completed");
  assert.deepEqual(orders[1].pagamentosDivididos, [
    { metodo: "cash", valor: 30 },
    { metodo: "card", valor: 45 },
  ]);
  assert.ok(orders[1].cashbackGanhoCentavos > 0);
  const catalog = await request("categoria/lista/detalhes");
  // Congela todas as escritas do ensaio, incluindo a rotina de conciliação.
  await compose(["stop", "web", "api"]);
  const dump = (database) =>
    compose(
      [
        "exec",
        "-T",
        "db",
        "sh",
        "-c",
        'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --user="$MYSQL_USER" --single-transaction --no-tablespaces --set-gtid-purged=OFF --hex-blob --skip-comments --skip-dump-date --skip-extended-insert --order-by-primary "$1"',
        "dump",
        database,
      ],
      true,
    );
  const sql = await dump(source);
  assert.ok(
    sql.includes("CREATE TABLE"),
    "Backup deve conter a estrutura do banco.",
  );
  const backup = join(directory, "backup.sql");
  await writeFile(backup, sql, { mode: 0o600 });
  const rootSql = (statement, database) =>
    compose(
      [
        "exec",
        "-T",
        "db",
        "sh",
        "-c",
        'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql --user=root --batch --skip-column-names "$@"',
        "restore",
        ...(database ? [database] : []),
      ],
      true,
      statement,
    );
  // CREATE sem IF NOT EXISTS: restauração nunca reutiliza um destino existente.
  await rootSql(
    `CREATE DATABASE ${destination}; GRANT ALL ON ${destination}.* TO 'zanini'@'%';`,
  );
  await rootSql(await readFile(backup, "utf8"), destination);
  const restored = await dump(destination);
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  assert.equal(
    digest(restored),
    digest(sql),
    "Estrutura e linhas restauradas devem ser idênticas.",
  );
  const tables = [
    "migrations",
    "usuarios",
    "pedidos",
    "pedidos_itens",
    "pagamentos",
    "estoques_data",
    "beneficios_movimentos",
    "auditoria",
  ];
  const counts = Object.fromEntries(
    (
      await rootSql(
        tables
          .map((table) => `SELECT '${table}', COUNT(*) FROM ${table}`)
          .join(" UNION ALL "),
        destination,
      )
    )
      .split("\n")
      .map((line) => {
        const [table, count] = line.split("\t");
        return [table, Number(count)];
      }),
  );
  for (const table of tables.filter((name) => name !== "pagamentos"))
    assert.ok(counts[table] > 0, `${table} deve conter dados no ensaio.`);
  // Pagamentos presenciais ficam no pedido; este ensaio não emite pagamentos online.
  assert.equal(counts.pagamentos, 0);
  assert.equal(counts.pedidos, 2);
  environment.MYSQL_DB = destination;
  await compose([
    "up",
    "--detach",
    "--no-deps",
    "--force-recreate",
    "--wait",
    "--wait-timeout",
    "120",
    "api",
  ]);
  api = `http://${await compose(["port", "api", "4052"], true)}`;
  assert.deepEqual(await request("health/ready"), { status: "ok" });
  assert.deepEqual(
    await Promise.all([pending, paid].map((p) => request(`pedido/${p.id}`))),
    orders,
  );
  assert.deepEqual(await request("categoria/lista/detalhes"), catalog);
  // A chave idempotente também sobrevive à restauração: repetir não cria outro pedido.
  assert.equal(
    (await request("admin/pdv", "POST", payload, 201, "restore-pending")).id,
    pending.id,
  );
  await compose([
    "up",
    "--detach",
    "--no-deps",
    "--wait",
    "--wait-timeout",
    "120",
    "web",
  ]);
  const response = await fetch(`${web}/api/backend/categoria/lista/detalhes`, {
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), catalog);
  console.log("Backup restaurado e conferido em banco separado.");
  // O SQL fica somente no diretório temporário privado e é removido pelo chamador.
  return {
    source,
    destination,
    bytes: Buffer.byteLength(sql),
    sha256: digest(sql),
    counts,
    applicationVerified: true,
  };
}
