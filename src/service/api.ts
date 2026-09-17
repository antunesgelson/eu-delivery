import axios, { AxiosError } from "axios";
import { toast } from "sonner";
export const api = axios.create({ baseURL: "/api/backend", timeout: 20000 });
let refresh: Promise<unknown> | null = null;
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const config = error.config as typeof error.config & { _retried?: boolean };
    if (
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      (!config.url?.startsWith("/auth/") ||
        config.url === "/auth/me" ||
        config.url === "/auth/logout")
    ) {
      config._retried = true;
      try {
        refresh ??= api.post("/auth/refresh").finally(() => {
          refresh = null;
        });
        await refresh;
        return api(config);
      } catch {
        if (typeof window !== "undefined")
          window.dispatchEvent(new Event("zanini:signout"));
      }
    }
    return Promise.reject(error);
  },
);
export function mostrarErro(error: unknown) {
  const data = axios.isAxiosError(error) ? error.response?.data : undefined;
  const message =
    data?.message ?? "Não foi possível concluir a operação. Tente novamente.";
  for (const [i, text] of (Array.isArray(message)
    ? message
    : [message]
  ).entries())
    setTimeout(() => toast.error(String(text)), i * 200);
}
