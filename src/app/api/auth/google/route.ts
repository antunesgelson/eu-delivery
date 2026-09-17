import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { destinoSeguro } from "@/lib/backend";
export async function GET(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    return NextResponse.redirect(
      new URL("/signin?error=google-unavailable", req.url),
    );
  const state = randomBytes(32).toString("hex");
  const uri = `${process.env.FRONTEND_URL ?? req.nextUrl.origin}/api/auth/google/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: uri,
    response_type: "code",
    scope: "openid email profile",
    state,
  }).toString();
  const response = NextResponse.redirect(url);
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  response.cookies.set("zanini_oauth_state", state, options);
  response.cookies.set(
    "zanini_oauth_return",
    destinoSeguro(req.nextUrl.searchParams.get("callbackUrl")),
    options,
  );
  return response;
}
