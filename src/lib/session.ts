// Estes retornos recusam a credencial de renovação. Falhas de rede, 429 e 5xx
// permitem nova tentativa e não devem apagar os cookies da sessão.
export function refreshRecusado(status?: number) {
  return status === 400 || status === 401 || status === 403;
}
