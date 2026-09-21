import { test as base, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { AddressInfo } from "node:net";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

type PaymentApp = {
  origin: string;
  slot: string;
  faults: { checkout: boolean; reconciliation: boolean };
  customer: (
    isAdmin?: boolean,
    cashbackCentavos?: number,
  ) => Promise<{ email: string; senha: string }>;
  expireResetLink: (id: string) => Promise<void>;
  configureProduct: (options: {
    ingredientes?: Array<{
      id: string;
      nome: string;
      valor: number;
      removivel: boolean;
      quantia: number;
    }>;
    adicionais?: Array<{ id: string; nome: string; valor: number }>;
  }) => Promise<void>;
  stockForDate: (date: string) => Promise<number>;
  setStockCapacity: (date: string, capacity: number) => Promise<void>;
  setDeadline: (id: number, timestamp: number) => Promise<void>;
  reconcile: (id: number) => Promise<boolean>;
  reserved: () => Promise<number>;
  notify: (id: number, status: "approved" | "refunded") => Promise<void>;
};

export const test = base.extend<
  {},
  { paymentApp: PaymentApp; integrationSuite: string }
>({
  // Escopos distintos criam workers/APIs próprios e não compartilham rate limits.
  integrationSuite: ["default", { scope: "worker", option: true }],
  paymentApp: [
    async ({ integrationSuite }, use) => {
      const originalEnv = { ...process.env };
      const backendDir = resolve(
        process.env.E2E_BACKEND_DIR || "../eu-delivery-back",
      );
      const requireBackend = createRequire(resolve(backendDir, "package.json"));
      const { createPaymentHarness } = requireBackend(
        "./test/browser-payment-harness.cjs",
      );
      const harness: PaymentApp & { close: () => Promise<void> } =
        await createPaymentHarness();
      let app: ReturnType<typeof spawn> | undefined;
      try {
        const reservation = createServer();
        await new Promise<void>((resolve) =>
          reservation.listen(0, "127.0.0.1", resolve),
        );
        const port = (reservation.address() as AddressInfo).port;
        await new Promise<void>((resolve) =>
          reservation.close(() => resolve()),
        );
        const origin = `http://localhost:${port}`;
        app = spawn(
          process.execPath,
          [
            resolve("node_modules/next/dist/bin/next"),
            "start",
            "--hostname",
            "127.0.0.1",
            "--port",
            String(port),
          ],
          {
            env: {
              ...originalEnv,
              NODE_ENV: "production",
              BACKEND_URL: harness.origin,
              FRONTEND_URL: origin,
              NEXT_TELEMETRY_DISABLED: "1",
            },
            stdio: "ignore",
          },
        );
        let ready = false;
        for (let attempt = 0; attempt < 60; attempt++) {
          if (app.exitCode !== null)
            throw new Error(
              "Execute npm run build no frontend antes desta suíte.",
            );
          try {
            ready = (
              await fetch(`${origin}/api/backend/configuracao`, {
                signal: AbortSignal.timeout(1000),
              })
            ).ok;
          } catch {
            /* Aguarda o servidor. */
          }
          if (ready) break;
          await delay(250);
        }
        if (!ready)
          throw new Error(
            `Frontend temporário (${integrationSuite}) não iniciou.`,
          );
        await use({ ...harness, origin });
      } finally {
        if (app) {
          app.kill("SIGTERM");
          await Promise.race([
            new Promise<void>((resolve) => app!.once("exit", () => resolve())),
            delay(5000),
          ]);
          if (app.exitCode === null && app.signalCode === null)
            app.kill("SIGKILL");
        }
        try {
          await harness.close();
        } finally {
          for (const key of Object.keys(process.env))
            if (!(key in originalEnv)) delete process.env[key];
          Object.assign(process.env, originalEnv);
        }
      }
    },
    { scope: "worker", timeout: 60000 },
  ],
  baseURL: async ({ paymentApp }, use) => use(paymentApp.origin),
});
export { expect };
