import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { ensaiarRestauracao } from "./restore-smoke.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const project = `zanini-smoke-${Date.now()}-${randomBytes(4).toString("hex")}`;
const directory = await mkdtemp(join(tmpdir(), "zanini-docker-"));
const envFile = join(directory, ".env");
await writeFile(envFile, "", { mode: 0o600 });
const environment = {
  ...process.env,
  MYSQL_DB: "zanini_smoke",
  MYSQL_USER: "zanini",
  MYSQL_PASSWORD: randomBytes(24).toString("hex"),
  MYSQL_ROOT_PASSWORD: randomBytes(24).toString("hex"),
  JWT_SECRET: randomBytes(32).toString("hex"),
  ADMIN_EMAIL: "docker@example.test",
  ADMIN_PASSWORD: randomBytes(24).toString("hex"),
  API_PORT: "0",
  WEB_PORT: "0",
  MYSQL_HOST_PORT: "0",
  COMPOSE_PROJECT_NAME: project,
};
const base = [
  "compose",
  "--project-name",
  project,
  "--env-file",
  envFile,
  "--file",
  "compose.yaml",
];
let current;
let interrupted = false;
const interrupt = () => {
  interrupted = true;
  current?.kill("SIGTERM");
};
process.on("SIGINT", interrupt);
process.on("SIGTERM", interrupt);
async function compose(args, capture = false, input) {
  if (interrupted && args[0] !== "down")
    throw new Error("Validação interrompida.");
  const child = spawn("docker", [...base, ...args], {
    cwd: root,
    env: environment,
    stdio: [
      input === undefined ? "ignore" : "pipe",
      capture ? "pipe" : "inherit",
      "inherit",
    ],
  });
  current = child;
  let inputError;
  if (input !== undefined) {
    child.stdin.on("error", (error) => {
      inputError = error;
    });
    child.stdin.end(input);
  }
  let output = "";
  if (capture)
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
  let code;
  try {
    // Aguarda também o fechamento dos streams ao capturar o dump SQL.
    [code] = await once(child, "close");
  } catch (error) {
    if (error.code === "ENOENT")
      throw new Error(
        "Docker CLI indisponível. Instale e inicie o Docker antes desta validação.",
      );
    throw error;
  } finally {
    current = undefined;
  }
  if (code !== 0)
    throw new Error(`Docker Compose falhou em ${args[0]} (saída ${code}).`);
  if (inputError) throw inputError;
  return output.trim();
}
async function json(url, status = 200) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, status);
  return response.json();
}
async function aguardarEngine() {
  const deadline = Date.now() + 60000;
  console.log("Aguardando o Docker Engine ficar disponível…");
  while (Date.now() < deadline && !interrupted) {
    const probe = spawn(
      "docker",
      ["version", "--format", "{{.Server.Version}}"],
      {
        cwd: root,
        env: environment,
        stdio: "ignore",
        timeout: Math.min(10000, deadline - Date.now()),
        killSignal: "SIGKILL",
      },
    );
    current = probe;
    try {
      const [code] = await once(probe, "exit");
      if (code === 0) return;
    } finally {
      current = undefined;
    }
    if (Date.now() < deadline && !interrupted) await delay(1000);
  }
  throw new Error(
    interrupted
      ? "Validação interrompida."
      : "Docker Engine não ficou disponível em 60 segundos. Verifique a inicialização do Docker Desktop; nenhum projeto de teste foi criado.",
  );
}
let started = false;
try {
  await compose(["version"], true);
  await compose(["config", "--quiet"]);
  await aguardarEngine();
  started = true;
  await compose([
    "up",
    "--build",
    "--detach",
    "--wait",
    "--wait-timeout",
    "180",
  ]);
  let api = `http://${await compose(["port", "api", "4052"], true)}`;
  const web = `http://${await compose(["port", "web", "4051"], true)}`;
  // Após descobrir a porta publicada, fixa a origem pública no servidor Next.
  environment.WEB_PORT = new URL(web).port;
  environment.FRONTEND_URL = web;
  await compose([
    "up",
    "--detach",
    "--no-deps",
    "--force-recreate",
    "--wait",
    "--wait-timeout",
    "120",
    "web",
  ]);
  assert.deepEqual(await json(`${api}/health/ready`), { status: "ok" });
  // Seed só neste projeto descartável, nunca automaticamente no startup normal.
  await compose([
    "run",
    "--rm",
    "--no-deps",
    "api",
    "node",
    "dist/database/seed.js",
  ]);
  const catalog = await json(`${web}/api/backend/categoria/lista/detalhes`);
  assert.ok(catalog.length > 0);
  for (const origin of [undefined, "null", "https://outro.example.test"]) {
    const response = await fetch(`${web}/api/backend/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(origin ? { Origin: origin } : {}),
        "X-Forwarded-Host": "outro.example.test",
        "X-Forwarded-Proto": "https",
      },
      body: "{}",
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 403);
    assert.equal(
      (await response.json()).message,
      "Origem da requisição inválida.",
    );
  }
  const login = await fetch(`${web}/api/backend/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: web },
    body: JSON.stringify({
      email: environment.ADMIN_EMAIL,
      senha: environment.ADMIN_PASSWORD,
    }),
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(login.status, 201);
  assert.equal((await login.json()).user.isAdmin, true);
  await compose(["run", "--rm", "migrate"]);
  await compose(["restart", "api"]);
  // Preserva os containers ao aguardar o reinício.
  await compose([
    "up",
    "--detach",
    "--no-recreate",
    "--wait",
    "--wait-timeout",
    "120",
  ]);
  // O Engine pode atribuir outra porta publicada mesmo ao reiniciar o mesmo container.
  api = `http://${await compose(["port", "api", "4052"], true)}`;
  assert.deepEqual(await json(`${api}/health/ready`), { status: "ok" });
  assert.deepEqual(
    await json(`${web}/api/backend/categoria/lista/detalhes`),
    catalog,
  );
  await compose(["stop", "db"]);
  assert.deepEqual(await json(`${api}/health/live`), { status: "ok" });
  assert.deepEqual(await json(`${api}/health/ready`, 503), {
    status: "unavailable",
  });
  await compose(["start", "db"]);
  let recovered = false;
  for (let i = 0; i < 30; i++) {
    try {
      recovered = (
        await fetch(`${api}/health/ready`, {
          signal: AbortSignal.timeout(3000),
        })
      ).ok;
    } catch {
      /* Aguarda o banco. */
    }
    if (recovered) break;
    await delay(1000);
  }
  assert.ok(recovered, "API deve recuperar a conexão após retorno do banco.");
  const restore = await ensaiarRestauracao({
    compose,
    environment,
    directory,
    api,
    web,
  });
  await mkdir(join(root, "artifacts"), { recursive: true });
  await writeFile(
    join(root, "artifacts/docker.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        project,
        restore,
        checks: [
          "migrations em volume vazio",
          "catálogo e login pelo frontend",
          "origem pública aceita e origens inválidas recusadas",
          "migrations repetidas e reinício",
          "falha e recuperação do banco",
          "backup e restauração em outro banco, com pedidos, pagamentos e benefícios",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Docker validado em volume novo.");
} finally {
  // O nome exclusivo impede remover containers ou volumes de outros ambientes.
  try {
    if (started) await compose(["down", "--volumes", "--remove-orphans"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", interrupt);
  }
}
