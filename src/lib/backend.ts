import { NextResponse } from "next/server";
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:4052";
export const ACCESS_COOKIE = "zanini_access";
export const REFRESH_COOKIE = "zanini_refresh";
export function cookiesSessao(
  response: NextResponse,
  data: { token: string; refreshToken: string; expiresIn: number },
) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set(ACCESS_COOKIE, data.token, {
    ...options,
    maxAge: data.expiresIn,
  });
  response.cookies.set(REFRESH_COOKIE, data.refreshToken, {
    ...options,
    maxAge: 30 * 86400,
  });
  response.cookies.delete("@eu:token");
  return response;
}
export function limparSessao(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete("@eu:token");
  return response;
}
export function destinoSeguro(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return "/";
  return value;
}
