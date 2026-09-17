"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mostrarErro } from "@/service/api";
import { CartDTO } from "@/dto/cartDTO";
import useAuth from "./useAuth";
export type PedidoAPI = CartDTO & {
  valorFinal: number;
  descontoCupom: number;
  pagamentoStatus: string;
  pagamentoExpiraEm?: string | null;
  cancelamentoMotivo?: string;
  created_at: string;
  canal: string;
  cliente?: { id: number; nome: string; tel: string; email: string };
  cashbackGanhoCentavos: number;
  ajusteCentavos: number;
};
export const statusPedido: Record<string, string> = {
  analysis: "Aguardando confirmação",
  production: "Em preparo",
  ready: "Pronto para retirada",
  completed: "Finalizado",
  cancelled: "Cancelado",
};
export function usePedidos(admin = false, page = 1) {
  const { isAuthenticated } = useAuth();
  return useQuery<{ items: PedidoAPI[]; total: number }>({
    queryKey: ["pedidos", admin, page],
    queryFn: async () =>
      (
        await api.get(admin ? "/admin/pedidos" : "/pedido", {
          params: { page, limit: 50 },
        })
      ).data,
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });
}
export function useOperacao() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      payment,
    }: {
      id: string;
      status?: string;
      payment?: boolean;
    }) =>
      (
        await api.patch(
          `/admin/pedidos/${id}/${payment ? "pagamento" : "status"}`,
          payment ? { paymentStatus: "paid" } : { status },
        )
      ).data,
    onSuccess: async () => {
      await Promise.all(
        [
          "pedidos",
          "operacao",
          "beneficios",
          "relatorios",
          "admin-catalogo",
        ].map((key) => c.invalidateQueries({ queryKey: [key] })),
      );
    },
    onError: mostrarErro,
  });
}
