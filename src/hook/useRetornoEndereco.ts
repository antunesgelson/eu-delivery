"use client";

import { useSearchParams } from "next/navigation";

// Somente estas telas podem iniciar a seleção de endereço para um pedido.
export function useRetornoEndereco() {
  const params = useSearchParams();
  const value = params.get("returnTo");
  const returnTo = value === "/checkout" || value === "/cart" ? value : null;
  const addressLink = (path: string) =>
    returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path;
  return { returnTo, addressLink };
}
