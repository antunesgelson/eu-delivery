"use client";

import React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, mostrarErro } from "@/service/api";
import { Button } from "@/components/ui/button";

type Pendencia = {
  pedidoId: number;
  valor: number;
  tentativas: number;
  mensagem: string;
  pendenteHaSegundos: number;
  ultimaTentativaEm: string | null;
  proximaTentativaEm: string;
  podeSolicitarEm: string | null;
  emExecucao: boolean;
  podeTentar: boolean;
};
type Resposta = { items: Pendencia[]; total: number; page: number; limit: number };
const dataHora = (data: string | null) => data
  ? new Date(data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
  : "Ainda não consultado";

export default function ConciliacoesPendentes() {
  const [page, setPage] = React.useState(1);
  const client = useQueryClient();
  const query = useQuery<Resposta>({
    queryKey: ["conciliacoes", page],
    queryFn: async () => (await api.get("/admin/conciliacoes", { params: { page, limit: 10 } })).data,
    refetchInterval: 10000,
  });
  const tentar = useMutation({
    mutationFn: async (id: number) => api.post(`/admin/conciliacoes/${id}/tentar`),
    onSuccess: async () => {
      toast.success("Nova verificação agendada.");
      await client.invalidateQueries({ queryKey: ["conciliacoes"] });
    },
    onError: mostrarErro,
  });
  React.useEffect(() => {
    if (query.data && page > Math.max(1, Math.ceil(query.data.total / 10)))
      setPage(Math.max(1, Math.ceil(query.data.total / 10)));
  }, [query.data, page]);

  if (query.isError) return (
    <section role="alert" className="mb-3 rounded border border-amber-300 bg-amber-50 p-4 text-sm">
      <p>Não foi possível consultar as verificações de pagamento pendentes.</p>
      <Button variant="outline" className="mt-2" onClick={() => query.refetch()}>Tentar carregar novamente</Button>
    </section>
  );
  if (query.isPending) return <p className="mb-3 p-3 text-sm text-neutral-600">Verificando pendências de pagamento…</p>;
  if (!query.data.total) return null;

  return (
    <section aria-labelledby="conciliacoes-titulo" className="mb-3 rounded border border-amber-300 bg-amber-50 p-4">
      <h2 id="conciliacoes-titulo" className="font-bold">Pagamentos aguardando verificação ({query.data.total})</h2>
      <p className="mt-1 text-sm">O prazo de pagamento terminou. As reservas serão mantidas até concluirmos a consulta ao provedor.</p>
      <div className="mt-3 max-h-[360px] overflow-auto rounded border border-amber-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <caption className="sr-only">Pedidos vencidos com pagamento aguardando verificação</caption>
          <thead className="sticky top-0 bg-amber-50"><tr className="border-b">
            {["Pedido", "Pendente há", "Verificação", "Última tentativa", "Próxima consulta", "Ação"].map(t => <th scope="col" key={t} className="p-3">{t}</th>)}
          </tr></thead>
          <tbody>{query.data.items.map(p => (
            <tr key={p.pedidoId} className="border-b last:border-0">
              <td className="p-3"><Link href={`/orderstatus?id=${p.pedidoId}`} className="font-semibold underline">#{p.pedidoId}</Link><span className="block text-xs text-neutral-600">{p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></td>
              <td className="p-3">{p.pendenteHaSegundos < 60 ? "Menos de 1 min" : `${Math.floor(p.pendenteHaSegundos / 60)} min`}</td>
              <td className="max-w-[260px] p-3"><span>{p.emExecucao ? "Consultando o provedor…" : p.mensagem}</span><span className="mt-1 block text-xs text-neutral-600">Tentativas: {p.tentativas}</span></td>
              <td className="whitespace-nowrap p-3">{dataHora(p.ultimaTentativaEm)}</td>
              <td className="whitespace-nowrap p-3">{p.emExecucao ? "Em andamento" : dataHora(p.proximaTentativaEm)}</td>
              <td className="p-3"><Button variant="outline" aria-label={`Verificar pedido ${p.pedidoId} novamente`} disabled={!p.podeTentar || tentar.isPending} onClick={() => tentar.mutate(p.pedidoId)}>{tentar.isPending && tentar.variables === p.pedidoId ? "Agendando…" : "Verificar novamente"}</Button>
                {!p.podeTentar && !p.emExecucao && p.podeSolicitarEm && <span className="mt-1 block text-xs text-neutral-600">Disponível após {dataHora(p.podeSolicitarEm)}</span>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {query.data.total > 10 && <nav aria-label="Paginação das verificações" className="mt-3 flex items-center gap-3">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anteriores</Button>
        <span className="text-sm">Página {page} de {Math.ceil(query.data.total / 10)}</span>
        <Button variant="outline" disabled={page * 10 >= query.data.total} onClick={() => setPage(p => p + 1)}>Próximas</Button>
      </nav>}
    </section>
  );
}
