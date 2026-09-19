"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/service/api";
import { AddressDTO } from "@/dto/addressDTO";

export type ClienteAdmin = {
  id: number;
  nome: string;
  tel: string | null;
  email: string | null;
};

export type ClienteCadastro = ClienteAdmin & {
  cpf: string | null;
  dataDeNascimento: string | null;
  cashbackCentavos: number;
  pontos: number;
};

export type BeneficiosCliente = {
  cashbackBalance: number;
  loyaltyCurrentOrders: number;
  loyaltyGoalOrders: number;
  premios: { id: number; resgatadoEm: string | null }[];
};

export function useClienteAdmin(id: number | null) {
  return useQuery<ClienteAdmin>({
    queryKey: ["admin-cliente", id],
    queryFn: async ({ signal }) =>
      (await api.get(`/admin/clientes/${id}`, { signal })).data,
    enabled: id !== null,
    retry: false,
  });
}

export function useBeneficiosCliente(id: number | null) {
  return useQuery<BeneficiosCliente>({
    queryKey: ["admin-cliente-beneficios", id],
    queryFn: async ({ signal }) =>
      (await api.get(`/admin/clientes/${id}/beneficios`, { signal })).data,
    enabled: id !== null,
    retry: false,
  });
}

export function useEnderecosCliente(id: number | null, enabled: boolean) {
  return useQuery<AddressDTO[]>({
    queryKey: ["admin-cliente-enderecos", id],
    queryFn: async ({ signal }) =>
      (await api.get(`/admin/clientes/${id}/enderecos`, { signal })).data,
    enabled: id !== null && enabled,
    retry: false,
  });
}
