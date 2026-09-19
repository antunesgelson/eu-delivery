import { test as base, expect } from "@playwright/test";
import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

type SessionApp = {
  origin: string;
  faults: {
    refreshStatus: number | null;
    meUnavailable: boolean;
    refreshRequests: number;
  };
};

async function listen(server: Server) {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return (server.address() as AddressInfo).port;
}

export const test = base.extend<{}, { sessionApp: SessionApp }>({
  sessionApp: [
    async ({}, use) => {
      const backend = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4052";
      if (
        !["localhost", "127.0.0.1", "[::1]"].includes(new URL(backend).hostname)
      )
        throw new Error("Esta suíte exige uma API local.");
      const faults: SessionApp["faults"] = {
        refreshStatus: null,
        meUnavailable: false,
        refreshRequests: 0,
      };
      // Injeta falhas antes da API real para exercitar também o proxy Next e seus cookies.
      const bridge = createServer(async (request, response) => {
        try {
          if (request.url === "/auth/refresh") faults.refreshRequests++;
          const status =
            request.url === "/auth/refresh"
              ? faults.refreshStatus
              : request.url === "/auth/me" && faults.meUnavailable
                ? 503
                : null;
          if (status) {
            response.writeHead(status, { "content-type": "application/json" });
            response.end(
              JSON.stringify({
                message: "Serviço de sessão temporariamente indisponível.",
              }),
            );
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of request) chunks.push(Buffer.from(chunk));
          const body = Buffer.concat(chunks);
          const upstream = await fetch(new URL(request.url ?? "/", backend), {
            method: request.method,
            headers: {
              "Content-Type": "application/json",
              ...(request.headers.authorization
                ? { Authorization: request.headers.authorization }
                : {}),
            },
            body: body.length ? body : undefined,
            signal: AbortSignal.timeout(15000),
          });
          response.writeHead(upstream.status, {
            "content-type":
              upstream.headers.get("content-type") ?? "application/json",
          });
          response.end(Buffer.from(await upstream.arrayBuffer()));
        } catch {
          response.writeHead(503, { "content-type": "application/json" });
          response.end(JSON.stringify({ message: "API local indisponível." }));
        }
      });
      const bridgePort = await listen(bridge);
      const reservation = createServer();
      const port = await listen(reservation);
      await new Promise<void>((resolve) => reservation.close(() => resolve()));
      const origin = `http://localhost:${port}`;
      const app = spawn(
        process.execPath,
        [
          resolve("node_modules/next/dist/bin/next"),
          "start",
          "--port",
          String(port),
        ],
        {
          env: {
            ...process.env,
            NODE_ENV: "production",
            BACKEND_URL: `http://127.0.0.1:${bridgePort}`,
            NEXT_TELEMETRY_DISABLED: "1",
          },
          stdio: "ignore",
        },
      );
      try {
        let ready = false;
        for (let attempt = 0; attempt < 60; attempt++) {
          if (app.exitCode !== null)
            throw new Error(
              "O frontend de teste não iniciou. Execute npm run build antes da suíte.",
            );
          try {
            ready = (
              await fetch(`${origin}/api/backend/configuracao`, {
                signal: AbortSignal.timeout(1000),
              })
            ).ok;
          } catch {
            /* Aguarda a inicialização. */
          }
          if (ready) break;
          await delay(250);
        }
        if (!ready)
          throw new Error(
            "Frontend/API locais indisponíveis para a suíte de sessão.",
          );
        await use({ origin, faults });
      } finally {
        app.kill("SIGTERM");
        await Promise.race([
          new Promise<void>((resolve) => app.once("exit", () => resolve())),
          delay(5000),
        ]);
        if (app.exitCode === null && app.signalCode === null)
          app.kill("SIGKILL");
        bridge.closeAllConnections();
        await new Promise<void>((resolve) => bridge.close(() => resolve()));
      }
    },
    { scope: "worker", timeout: 30000 },
  ],
  baseURL: async ({ sessionApp }, use) => use(sessionApp.origin),
});
export { expect };
