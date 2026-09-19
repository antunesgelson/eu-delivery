// Compartilhado pelo login no navegador e pelos callbacks no servidor.
export function destinoSeguro(value: string | null, fallback = "/") {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return fallback;
  return value;
}

export function destinoAdmin(value: string) {
  const pathname = value.split(/[?#]/)[0];
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
