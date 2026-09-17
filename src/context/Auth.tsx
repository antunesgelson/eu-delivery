"use client";
import React, { createContext, useContext, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/service/api";
type Usuario = {
  id: number;
  nome: string;
  email: string;
  tel: string;
  isAdmin: boolean;
};
const AuthContext = createContext<{
  user?: Usuario;
  isAuthenticated: boolean;
  isLoading: boolean;
  atualizar: () => Promise<unknown>;
  sair: () => Promise<void>;
}>({
  isAuthenticated: false,
  isLoading: true,
  atualizar: async () => {},
  sair: async () => {},
});
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const query = useQuery<Usuario | null>({
    queryKey: ["sessao"],
    queryFn: async () => {
      return (await api.get("/auth/me")).data;
    },
    retry: false,
    staleTime: 60000,
  });
  const logout = useMutation({ mutationFn: () => api.post("/auth/logout") });
  useEffect(() => {
    const clear = () => {
      client.removeQueries({
        predicate: (q) =>
          !["sessao", "cardapio", "configuracao", "cupons-publicos"].includes(
            String(q.queryKey[0]),
          ),
      });
      client.setQueryData(["sessao"], null);
    };
    window.addEventListener("zanini:signout", clear);
    return () => window.removeEventListener("zanini:signout", clear);
  }, [client]);
  const sair = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      client.clear();
      window.location.href = "/";
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user: query.data ?? undefined,
        isAuthenticated: !!query.data,
        isLoading: query.isPending,
        atualizar: () => query.refetch(),
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
