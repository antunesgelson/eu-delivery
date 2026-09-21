import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { randomBytes, createHash } from "node:crypto";
import {
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  rm,
  readdir,
} from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const frontend = fileURLToPath(new URL("..", import.meta.url));
const backend = resolve(
  process.env.E2E_BACKEND_DIR || join(frontend, "../eu-delivery-back"),
);
const requireBackend = createRequire(join(backend, "package.json"));
const { parse } = requireBackend("dotenv");
const { createConnection } = requireBackend("mysql2/promise");
const disponiveis = (await readdir(join(frontend, "tests/e2e")))
  .filter((name) => name.endsWith(".spec.ts"))
  .sort();
const selecionadas = process.argv.slice(2).length
  ? process.argv.slice(2)
  : disponiveis;
if (selecionadas.some((name) => !disponiveis.includes(name)))
  throw new Error("Informe somente nomes de arquivos existentes em tests/e2e.");
if (Number(process.versions.node.split(".")[0]) < 22)
  throw new Error("Use Node.js 22.13 ou superior.");
let arquivoEnv = {};
try {
  arquivoEnv = parse(
    await readFile(
      resolve(process.env.E2E_BACKEND_ENV || join(backend, ".env.codex.local")),
    ),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const mysql = Object.fromEntries(
  ["MYSQL_HOST", "MYSQL_PORT", "MYSQL_USER", "MYSQL_PASSWORD"].map((key) => [
    key,
    process.env[key] ?? arquivoEnv[key] ?? "",
  ]),
);
mysql.MYSQL_HOST ||= "127.0.0.1";
mysql.MYSQL_PORT ||= "3306";
if (!["127.0.0.1", "localhost"].includes(mysql.MYSQL_HOST))
  throw new Error("A integração exige MySQL local.");
if (!mysql.MYSQL_USER)
  throw new Error("Configure MYSQL_USER e MYSQL_PASSWORD ou E2E_BACKEND_ENV.");
const temporario = await mkdtemp(join(tmpdir(), "zanini-integration-"));
const emptyEnv = join(temporario, "empty.env");
await writeFile(emptyEnv, "", { mode: 0o600 });
// Apenas as credenciais MySQL são lidas do ambiente local; integrações externas ficam desligadas.
const ambiente = {
  ...process.env,
  ...mysql,
  NODE_ENV: "test",
  DOTENV_CONFIG_PATH: emptyEnv,
  E2E_BACKEND_ENV: emptyEnv,
  E2E_BACKEND_DIR: backend,
  AUTH_DELIVERY_MODE: "development",
  JWT_SECRET: randomBytes(32).toString("hex"),
  NEXT_TELEMETRY_DISABLED: "1",
  SMTP_HOST: "",
  SMTP_USER: "",
  SMTP_PASSWORD: "",
  WHATSAPP_GATEWAY_URL: "",
  WHATSAPP_GATEWAY_TOKEN: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  MERCADO_PAGO_TOKEN: "",
  MERCADO_PAGO_WEBHOOK_SECRET: "",
  MERCADO_PAGO_COLLECTOR_ID: "",
  MERCADO_PAGO_NOTIFICATION_URL: "",
};
const filhos = new Set();
let interrompido = false;
function iniciar(args, cwd, env = ambiente, stdio = "inherit") {
  if (interrompido) throw new Error("Validação interrompida.");
  const child = spawn(process.execPath, args, { cwd, env, stdio });
  filhos.add(child);
  child.once("exit", () => filhos.delete(child));
  return child;
}
async function executar(args, cwd, env = ambiente) {
  const child = iniciar(args, cwd, env);
  const [code] = await once(child, "exit");
  if (code !== 0) throw new Error(`Falha na etapa ${args[0]} (saída ${code}).`);
}
async function parar(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const terminou = once(child, "exit");
  child.kill("SIGTERM");
  let timer;
  try {
    await Promise.race([
      terminou,
      new Promise((resolve) => {
        timer = setTimeout(resolve, 5000);
      }),
    ]);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
      await terminou;
    }
  } finally {
    clearTimeout(timer);
  }
}
const interromper = () => {
  interrompido = true;
  for (const child of filhos) child.kill("SIGTERM");
};
process.on("SIGINT", interromper);
process.on("SIGTERM", interromper);
async function portaLivre() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function aguardar(url, child) {
  for (let i = 0; i < 100; i++) {
    if (interrompido || child.exitCode !== null || child.signalCode !== null)
      throw new Error(
        "Servidor temporário encerrou antes de ficar disponível.",
      );
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return;
    } catch {
      /* Aguarda inicialização. */
    }
    await delay(200);
  }
  throw new Error(
    "Servidor temporário não ficou disponível. Confira builds e migrations.",
  );
}
const playwright = join(frontend, "node_modules/@playwright/test/cli.js");
const tradicionais = new Set([
  "pdv.spec.ts",
  "historico.spec.ts",
  "enderecos.spec.ts",
  "login.spec.ts",
  "sessao.spec.ts",
]);
let conexao;
const aprovadas = [];
try {
  await readFile(join(frontend, ".next-production/BUILD_ID"));
  await readFile(join(backend, "dist/main.js"));
  conexao = await createConnection({
    host: mysql.MYSQL_HOST,
    port: Number(mysql.MYSQL_PORT),
    user: mysql.MYSQL_USER,
    password: mysql.MYSQL_PASSWORD,
  });
  for (const suite of selecionadas.filter((name) => tradicionais.has(name))) {
    const database = `zanini_ci_${Date.now()}_${randomBytes(6).toString("hex")}`;
    let api,
      web,
      criado = false;
    try {
      // Nome criado neste processo: nenhum banco configurado pelo usuário é removido.
      await conexao.query(
        `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4`,
      );
      criado = true;
      const apiPort = await portaLivre(),
        webPort = await portaLivre();
      const apiOrigin = `http://127.0.0.1:${apiPort}`,
        origin = `http://localhost:${webPort}`;
      const env = {
        ...ambiente,
        MYSQL_DB: database,
        HOST: "127.0.0.1",
        PORT_SERVER_WEB: String(apiPort),
        FRONTEND_URL: origin,
        CORS_ORIGINS: origin,
        BACKEND_URL: apiOrigin,
        ADMIN_EMAIL: "integration@example.test",
        ADMIN_PASSWORD: randomBytes(24).toString("hex"),
        E2E_BASE_URL: origin,
        E2E_BACKEND_URL: apiOrigin,
      };
      env.E2E_ADMIN_EMAIL = env.ADMIN_EMAIL;
      env.E2E_ADMIN_PASSWORD = env.ADMIN_PASSWORD;
      console.log(`\nPreparando banco vazio e servidores para ${suite}`);
      await executar(
        [
          "node_modules/typeorm/cli.js",
          "migration:run",
          "-d",
          "dist/database/data-source.js",
        ],
        backend,
        env,
      );
      await executar(["dist/database/seed.js"], backend, env);
      api = iniciar(["dist/main.js"], backend, env, "ignore");
      await aguardar(`${apiOrigin}/health/ready`, api);
      web = iniciar(
        [
          "node_modules/next/dist/bin/next",
          "start",
          "--hostname",
          "127.0.0.1",
          "--port",
          String(webPort),
        ],
        frontend,
        { ...env, NODE_ENV: "production" },
        "ignore",
      );
      await aguardar(`${origin}/api/backend/configuracao`, web);
      await executar([playwright, "test", suite], frontend, env);
      aprovadas.push(suite);
    } finally {
      await parar(web);
      await parar(api);
      if (criado) await conexao.query(`DROP DATABASE \`${database}\``);
    }
  }
  const isoladas = selecionadas.filter((name) => !tradicionais.has(name));
  if (isoladas.length) {
    await executar([playwright, "test", ...isoladas], frontend);
    aprovadas.push(...isoladas);
  }
  const versao = async (dir) => {
    const packageJson = JSON.parse(
      await readFile(join(dir, "package.json"), "utf8"),
    );
    let commit = null,
      alterado = null;
    try {
      commit = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: dir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      alterado = !!execFileSync("git", ["status", "--porcelain"], {
        cwd: dir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      /* Checkout sem Git: o hash do lockfile continua disponível. */
    }
    return {
      name: packageJson.name,
      commit,
      alterado,
      lockfileSha256: createHash("sha256")
        .update(await readFile(join(dir, "package-lock.json")))
        .digest("hex"),
    };
  };
  const migrationsDir = join(backend, "src/database/migrations");
  const migrations = await Promise.all(
    (await readdir(migrationsDir)).sort().map(async (name) => ({
      name,
      sha256: createHash("sha256")
        .update(await readFile(join(migrationsDir, name)))
        .digest("hex"),
    })),
  );
  await mkdir(join(frontend, "artifacts"), { recursive: true });
  await writeFile(
    join(frontend, "artifacts/integration.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        node: process.version,
        frontend: await versao(frontend),
        backend: await versao(backend),
        migrations,
        suites: aprovadas,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "\nIntegração aprovada. Versões e migrations registradas em artifacts/integration.json.",
  );
} finally {
  await Promise.all([...filhos].map(parar));
  if (conexao) await conexao.end();
  await rm(temporario, { recursive: true, force: true });
  process.off("SIGINT", interromper);
  process.off("SIGTERM", interromper);
}
