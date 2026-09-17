import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, cookiesSessao, destinoSeguro } from "@/lib/backend";
export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state"),
    code = req.nextUrl.searchParams.get("code");
  const fail = () =>
    NextResponse.redirect(new URL("/signin?error=google", req.url));
  if (!state || state !== req.cookies.get("zanini_oauth_state")?.value || !code)
    return fail();
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${process.env.FRONTEND_URL ?? req.nextUrl.origin}/api/auth/google/callback`,
        code,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!tokenResponse.ok) return fail();
    const google = await tokenResponse.json();
    const backend = await fetch(`${BACKEND_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: google.id_token }),
      signal: AbortSignal.timeout(10000),
    });
    if (!backend.ok) return fail();
    const response = cookiesSessao(
      NextResponse.redirect(
        new URL(
          destinoSeguro(req.cookies.get("zanini_oauth_return")?.value ?? null),
          req.url,
        ),
      ),
      await backend.json(),
    );
    response.cookies.delete("zanini_oauth_state");
    response.cookies.delete("zanini_oauth_return");
    return response;
  } catch {
    return fail();
  }
}
