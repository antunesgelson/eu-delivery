"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/service/api";
import { CardapioDTO } from "@/dto/cardapioDTO";
import { CupomDTO } from "@/dto/cupomDTO";
import useAuth from "./useAuth";
export function useCardapio() {
  return useQuery<CardapioDTO[]>({
    queryKey: ["cardapio"],
    queryFn: async () => (await api.get("/categoria/lista/detalhes")).data,
    staleTime: 15000,
  });
}
export function useBeneficios() {
  const { isAuthenticated } = useAuth();
  const q = useQuery({
    queryKey: ["beneficios"],
    queryFn: async () => (await api.get("/usuario/beneficios")).data,
    enabled: isAuthenticated,
    retry: false,
  });
  return {
    cashbackBalance: 0,
    loyaltyCurrentOrders: 0,
    loyaltyGoalOrders: 6,
    loyaltyRemainingOrders: 6,
    loyaltyProgress: 0,
    promoNotificationCount: 0,
    ...q.data,
    isLoading: q.isPending,
    isError: q.isError,
    refetch: q.refetch,
    cashbackExpiration: q.data?.cashbackExpiration ?? "Sem expiração",
  };
}
export function useCuponsPublicos() {
  return useQuery<CupomDTO[]>({
    queryKey: ["cupons-publicos"],
    queryFn: async () => (await api.get("/cupom/publicos")).data,
  });
}
