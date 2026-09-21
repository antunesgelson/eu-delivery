"use client";
import { useEffect, useRef, useState, SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mostrarErro } from "@/service/api";
import { AdminMenuCategory } from "@/lib/menu-stock";
import { CupomDTO } from "@/dto/cupomDTO";
import { toast } from "sonner";
type CatalogoAdmin = { version: number; categories: AdminMenuCategory[] };
export function useCatalogoAdmin() {
  const client = useQueryClient();
  const [categories, setLocal] = useState<AdminMenuCategory[]>([]);
  const [pending, setPending] = useState(0);
  const state = useRef<AdminMenuCategory[]>([]);
  const confirmed = useRef<CatalogoAdmin>({ version: 0, categories: [] });
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const count = useRef(0),
    generation = useRef(0);
  const query = useQuery<CatalogoAdmin>({
    queryKey: ["admin-catalogo"],
    queryFn: async ({ signal }) =>
      (await api.get("/admin/catalogo", { signal })).data,
    refetchOnWindowFocus: false,
    retry: false,
  });
  useEffect(() => {
    if (query.data && count.current === 0) {
      confirmed.current = query.data;
      state.current = query.data.categories;
      setLocal(query.data.categories);
    }
  }, [query.data]);
  const mutation = useMutation({
    mutationFn: async (data: CatalogoAdmin) =>
      (await api.put<CatalogoAdmin>("/admin/catalogo", data)).data,
  });
  function setCategories(
    update: SetStateAction<AdminMenuCategory[]>,
  ): Promise<boolean> {
    const currentGeneration = generation.current;
    state.current =
      typeof update === "function" ? update(state.current) : update;
    setLocal(state.current);
    count.current++;
    setPending(count.current);
    const task = queue.current
      .then(async () => {
        if (currentGeneration !== generation.current) return false;
        try {
          await client.cancelQueries({ queryKey: ["admin-catalogo"] });
          const next =
            typeof update === "function"
              ? update(confirmed.current.categories)
              : update;
          const data = await mutation.mutateAsync({
            version: confirmed.current.version,
            categories: next,
          });
          confirmed.current = data;
          client.setQueryData(["admin-catalogo"], data);
          await Promise.all(
            ["cardapio", "produto"].map((key) =>
              client.invalidateQueries({ queryKey: [key] }),
            ),
          );
          toast.success("Cardápio salvo.");
          return true;
        } catch (error) {
          generation.current++;
          mostrarErro(error);
          const fresh = await query.refetch();
          if (fresh.data) confirmed.current = fresh.data;
          return false;
        }
      })
      .finally(() => {
        count.current--;
        setPending(count.current);
        if (count.current === 0) {
          state.current = confirmed.current.categories;
          setLocal(state.current);
        }
      });
    queue.current = task.catch(() => {});
    return task;
  }
  return {
    categories,
    setCategories,
    saveCategories: setCategories,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
    isPending: pending > 0,
  };
}
export function useCuponsAdmin() {
  const client = useQueryClient();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const query = useQuery<CupomDTO[]>({
    queryKey: ["admin-cupons"],
    queryFn: async ({ signal }) => (await api.get("/cupom", { signal })).data,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const payload = (c: CupomDTO) => ({
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
  });
  const equal = (a: CupomDTO, b: CupomDTO) =>
    JSON.stringify(payload(a)) === JSON.stringify(payload(b));
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
        if (!old || !equal(c, old))
          await api.request({
            method: old ? "put" : "post",
            url: "/cupom",
            data: payload(c),
          });
      }
      for (const c of before)
        if (!next.some((n) => n.id === c.id))
          await api.delete(`/cupom/${c.id}`);
    },
  });
  async function setCoupons(update: SetStateAction<CupomDTO[]>) {
    if (busy.current || query.isError || !query.data) return false;
    busy.current = true;
    setPending(true);
    const before = query.data;
    const next = typeof update === "function" ? update(before) : update;
    try {
      await client.cancelQueries({ queryKey: ["admin-cupons"] });
      try {
        await mutation.mutateAsync({ before, next });
      } catch (error) {
        // Uma resposta perdida pode esconder uma gravação já concluída.
        const fresh = await query.refetch();
        const changed = next.filter(
          (c) => !before.some((old) => old.id === c.id && equal(old, c)),
        );
        const removed = before.filter((c) => !next.some((n) => n.id === c.id));
        const confirmed =
          !fresh.isError &&
          fresh.data &&
          changed.every((c) =>
            fresh.data!.some((row) => row.id === c.id && equal(row, c)),
          ) &&
          removed.every((c) => !fresh.data!.some((row) => row.id === c.id));
        if (!confirmed) {
          mostrarErro(error);
          return false;
        }
      }
      const fresh = await query.refetch();
      if (fresh.isError) {
        toast.error(
          "Alteração enviada. Atualize a lista para conferir o resultado.",
        );
        return false;
      }
      await Promise.all(
        ["cupons-publicos", "carrinho", "relatorios"].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      toast.success("Cupons atualizados.");
      return true;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return {
    coupons: query.data ?? [],
    setCoupons,
    isLoading: query.isPending,
    error: query.error,
    hasData: query.data !== undefined,
    refetch: query.refetch,
    isPending: pending,
  };
}
