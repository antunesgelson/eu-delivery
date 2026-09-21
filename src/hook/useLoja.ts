"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/service/api";
import { CardapioDTO } from "@/dto/cardapioDTO";
import { CupomDTO } from "@/dto/cupomDTO";
import { BeneficiosDTO } from "@/dto/beneficiosDTO";
import useAuth from "./useAuth";
export function useCardapio() {
  return useQuery<CardapioDTO[]>({
    queryKey: ["cardapio"],
    queryFn: async ({ signal }) =>
      (await api.get("/categoria/lista/detalhes", { signal })).data,
    staleTime: 10000,
    refetchInterval: 10000,
    retry: false,
  });
}
export function useBeneficios() {
  const { isAuthenticated } = useAuth();
  const q = useQuery<BeneficiosDTO>({
    queryKey: ["beneficios"],
    queryFn: async ({ signal }) =>
      (await api.get("/usuario/beneficios", { signal })).data,
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
    isFetching: q.isFetching,
    hasData: !!q.data,
    premios: q.data?.premios ?? [],
    movimentos: q.data?.movimentos ?? [],
    refetch: q.refetch,
    cashbackExpiration: q.data?.cashbackExpiration ?? "Sem expiração",
  };
}
export function useCuponsPublicos() {
  return useQuery<CupomDTO[]>({
    queryKey: ["cupons-publicos"],
    queryFn: async ({ signal }) =>
      (await api.get("/cupom/publicos", { signal })).data,
    retry: false,
  });
}
