"use client";
import { useEffect, useRef, useState, SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mostrarErro } from "@/service/api";
import { AdminMenuCategory } from "@/lib/menu-stock";
import { CupomDTO } from "@/dto/cupomDTO";
import { toast } from "sonner";
export function useCatalogoAdmin() {
  const client = useQueryClient(),
    [categories, setLocal] = useState<AdminMenuCategory[]>([]),
    state = useRef(categories),
    version = useRef(0),
    queue = useRef<Promise<unknown>>(Promise.resolve());
  const query = useQuery<{ version: number; categories: AdminMenuCategory[] }>({
    queryKey: ["admin-catalogo"],
    queryFn: async () => (await api.get("/admin/catalogo")).data,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (query.data) {
      setLocal(query.data.categories);
      state.current = query.data.categories;
      version.current = query.data.version;
    }
  }, [query.data]);
  const mutation = useMutation({
    mutationFn: async (next: AdminMenuCategory[]) =>
      (
        await api.put("/admin/catalogo", {
          version: version.current,
          categories: next,
        })
      ).data,
  });
  async function saveCategories(next: AdminMenuCategory[]) {
    try {
      const data = await mutation.mutateAsync(next);
      version.current = data.version;
      state.current = data.categories;
      setLocal(data.categories);
      client.setQueryData(["admin-catalogo"], data);
      void client.invalidateQueries({ queryKey: ["cardapio"] });
      toast.success("Cardápio salvo.");
      return true;
    } catch (e) {
      mostrarErro(e);
      await query.refetch();
      return false;
    }
  }
  function setCategories(update: SetStateAction<AdminMenuCategory[]>) {
    const next = typeof update === "function" ? update(state.current) : update;
    state.current = next;
    setLocal(next);
    queue.current = queue.current
      .catch(() => {})
      .then(() => saveCategories(next));
  }
  return {
    categories,
    setCategories,
    saveCategories,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    isPending: mutation.isPending,
  };
}
export function useCuponsAdmin() {
  const [coupons, setLocal] = useState<CupomDTO[]>([]),
    state = useRef(coupons),
    queue = useRef<Promise<unknown>>(Promise.resolve()),
    client = useQueryClient();
  const query = useQuery<CupomDTO[]>({
    queryKey: ["admin-cupons"],
    queryFn: async () => (await api.get("/cupom")).data,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (query.data) {
      state.current = query.data;
      setLocal(query.data);
    }
  }, [query.data]);
  const mutation = useMutation({
    mutationFn: async ({
      before,
      next,
    }: {
      before: CupomDTO[];
      next: CupomDTO[];
    }) => {
      for (const c of next) {
        const old = before.find((o) => o.id === c.id);
        if (JSON.stringify(c) !== JSON.stringify(old)) {
          const data = {
            id: c.id,
            nome: c.nome,
            descricao: c.descricao,
            tipo: c.tipo,
            valor: c.valor,
            valorMinimoGasto: c.valorMinimoGasto,
            quantidade: c.quantidade,
            validade: c.validade.slice(0, 10),
            status: c.status,
            listaPublica: c.listaPublica,
            unicoUso: c.unicoUso,
          };
          await api.request({
            method: old ? "put" : "post",
            url: "/cupom",
            data,
          });
        }
      }
      for (const c of before)
        if (!next.some((n) => n.id === c.id))
          await api.delete(`/cupom/${c.id}`);
    },
  });
  function setCoupons(update: SetStateAction<CupomDTO[]>) {
    const before = state.current,
      next = typeof update === "function" ? update(before) : update;
    state.current = next;
    setLocal(next);
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          await mutation.mutateAsync({ before, next });
          void client.invalidateQueries({ queryKey: ["cupons-publicos"] });
          toast.success("Cupons atualizados.");
        } catch (e) {
          mostrarErro(e);
          await query.refetch();
        }
      });
  }
  return {
    coupons,
    setCoupons,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
