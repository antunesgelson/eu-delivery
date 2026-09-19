import { NextRequest, NextResponse } from "next/server";
import { refreshRecusado } from "@/lib/session";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  BACKEND_URL,
  cookiesSessao,
  limparSessao,
} from "@/lib/backend";
export const dynamic = "force-dynamic";
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const params = await context.params;
  const path = params.path.join("/");
  if (
    !/^(auth|usuario|endereco|categoria|produto|pedido|cupom|configuracao|admin|pagamento)(\/|$)/.test(
      path,
    ) ||
    params.path.some(
      (p) => p === "." || p === ".." || p.includes("/") || p.includes("\\"),
    )
  )
    return NextResponse.json(
      { message: "Rota não encontrada." },
      { status: 404 },
    );
  const writing = !["GET", "HEAD"].includes(request.method);
  if (writing && request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json(
      { message: "Origem da requisição inválida." },
      { status: 403 },
    );
  if (path.endsWith("webhook"))
    return NextResponse.json(
      { message: "Use o endpoint do provedor na API." },
      { status: 404 },
    );
  try {
    let body = writing ? await request.text() : undefined;
    if (body && new TextEncoder().encode(body).length > 4 * 1024 * 1024)
      return NextResponse.json(
        { message: "Envio maior que 4MB." },
        { status: 413 },
      );
    if (path === "auth/refresh")
      body = JSON.stringify({
        refreshToken: request.cookies.get(REFRESH_COOKIE)?.value ?? "",
      });
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = request.cookies.get(ACCESS_COOKIE)?.value;
    if (token) headers.Authorization = `Bearer ${token}`;
    const key = request.headers.get("idempotency-key");
    if (key) headers["Idempotency-Key"] = key;
    const response = await fetch(
      `${BACKEND_URL}/${params.path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body: body || undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!writing && /^produto\/\d+\/imagem$/.test(path) && response.ok) {
      const type = response.headers.get("content-type") ?? "";
      if (/^image\/(png|jpeg|webp)(;|$)/.test(type)) {
        return new NextResponse(await response.arrayBuffer(), {
          status: response.status,
          headers: {
            "Content-Type": type,
            "Cache-Control": "public, max-age=60",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    }
    const data = await response.json();
    if (
      response.ok &&
      ["auth/login", "auth/verify", "auth/google", "auth/refresh"].includes(
        path,
      )
    )
      return cookiesSessao(
        NextResponse.json({ user: data.user }, { status: response.status }),
        data,
      );
    const result = NextResponse.json(data, { status: response.status });
    if (
      path === "auth/logout" ||
      (path === "auth/redefinir-senha" && response.ok) ||
      (path === "auth/refresh" && refreshRecusado(response.status))
    )
      return limparSessao(result);
    return result;
  } catch {
    return NextResponse.json(
      { message: "Não foi possível acessar a API. Tente novamente." },
      { status: 503 },
    );
  }
}
export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
