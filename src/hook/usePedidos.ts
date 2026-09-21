"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mostrarErro } from "@/service/api";
import { CartDTO } from "@/dto/cartDTO";
import useAuth from "./useAuth";
import { toast } from "sonner";
export type PedidoAPI = CartDTO & {
  valorFinal: number;
  descontoCupom: number;
  taxaEntrega: number;
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
export function usePedidos(admin = false, page = 1, limit = 50) {
  const { isAuthenticated } = useAuth();
  return useQuery<{ items: PedidoAPI[]; total: number }>({
    queryKey: ["pedidos", admin, page, limit],
    queryFn: async ({ signal }) =>
      (
        await api.get(admin ? "/admin/pedidos" : "/pedido", {
          params: { page, limit },
          signal,
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
    onSuccess: (_data, variables) => {
      toast.success(
        variables.payment ? "Pagamento confirmado." : "Pedido atualizado.",
      );
    },
    // Mesmo sem resposta, a API pode ter persistido a operação.
    onSettled: async () => {
      await Promise.all(
        [
          "pedidos",
          "pedido",
          "operacao",
          "beneficios",
          "relatorios",
          "admin-catalogo",
          "cardapio",
          "produto",
          "admin-cliente",
          "admin-cliente-beneficios",
        ].map((key) => c.invalidateQueries({ queryKey: [key] })),
      );
    },
    onError: mostrarErro,
  });
}
