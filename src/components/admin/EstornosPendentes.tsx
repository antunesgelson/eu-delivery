"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/service/api";
import { PedidoAPI } from "@/hook/usePedidos";
export default function EstornosPendentes() {
  const query = useQuery<{items: PedidoAPI[]; total: number}>({
    queryKey: ["estornos-pendentes"],
    queryFn: async () => (await api.get("/admin/pedidos", {params: {status: "refund_pending", limit: 10}})).data,
    refetchInterval: 10000,
  });
  if (query.isError) return <p role="alert" className="mb-3 rounded border border-amber-300 p-3 text-sm">Não foi possível consultar estornos pendentes. <button className="underline" onClick={() => query.refetch()}>Tentar novamente</button></p>;
  if (!query.data?.total) return null;
  return <section role="alert" className="mb-3 rounded border border-amber-300 bg-amber-50 p-4">
    <h2 className="font-bold">{query.data.total} pagamento(s) após cancelamento</h2>
    <p className="text-sm">Confira e estorne esses pagamentos no Mercado Pago. A confirmação do provedor atualizará o pedido.</p>
    <ul className="mt-2 space-y-1 text-sm">{query.data.items.map(p => <li key={p.id}><Link className="underline" href={`/orderstatus?id=${p.id}`}>Pedido #{p.id}</Link> — {p.cliente?.nome || "Cliente"} — {p.valorFinal.toLocaleString("pt-BR", {style: "currency", currency: "BRL"})}</li>)}</ul>
    <Link className="mt-2 inline-block text-sm underline" href="/admin/dashboard?view=reports&report=orders">Consultar relatório de pedidos</Link>
  </section>;
}
