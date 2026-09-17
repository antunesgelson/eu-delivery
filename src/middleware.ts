import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  BACKEND_URL,
  cookiesSessao,
} from "@/lib/backend";
export async function middleware(req: NextRequest) {
  const signin = new URL("/signin", req.url);
  signin.searchParams.set(
    "callbackUrl",
    req.nextUrl.pathname + req.nextUrl.search,
  );
  const headers = new Headers(req.headers);
  let session: any;
  try {
    const token = req.cookies.get(ACCESS_COOKIE)?.value;
    let user: any;
    if (token) {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) user = await response.json();
      else if (response.status !== 401)
        return new NextResponse("Não foi possível validar a sessão.", {
          status: 503,
        });
    }
    if (!user) {
      const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
      if (!refresh) return NextResponse.redirect(signin);
      const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return NextResponse.redirect(signin);
      session = await response.json();
      user = session.user;
      req.cookies.set(ACCESS_COOKIE, session.token);
      req.cookies.set(REFRESH_COOKIE, session.refreshToken);
      headers.set("cookie", req.cookies.toString());
    }
    const response = user.isAdmin
      ? NextResponse.next({ request: { headers } })
      : NextResponse.redirect(new URL("/", req.url));
    return session ? cookiesSessao(response, session) : response;
  } catch {
    return new NextResponse(
      "A API está temporariamente indisponível. Tente novamente.",
      { status: 503 },
    );
  }
}
export const config = { matcher: ["/admin/:path*"] };
