"use client";
import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, mostrarErro } from "@/service/api";
import { dataDaLoja } from "@/hook/useAgendamento";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import EditarCliente from "./EditarCliente";
import { ClienteCadastro } from "@/hook/useClientesAdmin";
const money = (v: number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function AdminReports({ type }: { type: string }) {
  const hoje = dataDaLoja();
  const [inicio, setInicio] = React.useState(hoje.slice(0, 7) + "-01");
  const [fim, setFim] = React.useState(hoje);
  const [periodo, setPeriodo] = React.useState({
    inicio: hoje.slice(0, 7) + "-01",
    fim: hoje,
  });
  const [periodoErro, setPeriodoErro] = React.useState("");
  const [page, setPage] = React.useState(1),
    [search, setSearch] = React.useState(""),
    [edit, setEdit] = React.useState<ClienteCadastro | null>(null),
    [benefits, setBenefits] = React.useState<any>(null);
  const customerView = ["customers", "loyalty", "cashback"].includes(type);
  const [term, setTerm] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const report = useQuery<any>({
    queryKey: ["relatorios", periodo, page],
    queryFn: async ({ signal }) =>
      (
        await api.get("/admin/relatorios", {
          signal,
          params: { ...periodo, page, limit: 50 },
        })
      ).data,
    retry: false,
  });
  const customers = useQuery<{ items: ClienteCadastro[]; total: number }>({
    queryKey: ["clientes", page, term],
    queryFn: async ({ signal }) =>
      (
        await api.get("/admin/clientes", {
          params: { page, limit: 50, search: term },
          signal,
        })
      ).data,
    enabled: customerView,
    retry: false,
  });
  React.useEffect(() => {
    setPage(1);
  }, [type]);
  const orders = {
    data: report.data?.pedidosDetalhes,
    isPending: report.isPending,
    isError: report.isError,
    isFetching: report.isFetching,
    refetch: report.refetch,
  };
  const redeem = useMutation({
    mutationFn: async (id: number) =>
      api.post(`/admin/clientes/${benefits.id}/premios/${id}/resgatar`),
    onSuccess: () => {
      setBenefits(null);
      toast.success("Entrega do prêmio registrada.");
    },
    onError: mostrarErro,
  });
  const showBenefits = async (id: number) => {
    try {
      setBenefits({
        ...(await api.get(`/admin/clientes/${id}/beneficios`)).data,
        id,
      });
    } catch (e) {
      mostrarErro(e);
    }
  };
  const data = report.data;
  const rows: any[] = customerView
    ? (customers.data?.items ?? [])
    : type === "orders"
      ? (orders.data?.items ?? [])
      : type === "items"
        ? (data?.itens ?? [])
        : type === "coupons"
          ? (data?.cupons ?? [])
          : (data?.meses ?? []);
  const headers = customerView
    ? ["Cliente", "Telefone", "Cashback", "Pedidos de fidelidade"]
    : type === "orders"
      ? ["Pedido", "Cliente", "Finalização", "Total", "Desconto", "Cashback"]
      : type === "items"
        ? ["Produto", "Quantidade", "Total bruto"]
        : type === "coupons"
          ? ["Cupom", "Usos concluídos", "Desconto"]
          : ["Mês", "Pedidos", "Faturamento"];
  const values = (row: any): (string | number)[] =>
    customerView
      ? [
          row.nome || "Sem nome",
          row.tel || "",
          money(row.cashbackCentavos / 100),
          row.pontos,
        ]
      : type === "orders"
        ? [
            `#${row.id}`,
            row.cliente,
            row.finalizadoEm
              ? new Date(row.finalizadoEm).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })
              : "Sem data",
            money(row.total),
            money(row.desconto),
            money(row.cashback),
          ]
        : type === "items"
          ? [row.titulo, row.quantidade, money(row.total)]
          : type === "coupons"
            ? [row.nome, row.usos, money(row.desconto)]
            : [row.mes || "Sem data", row.pedidos, money(row.total)];
  function exportar() {
    // Prefixo protege textos interpretados como fórmulas por planilhas.
    const cell = (v: string | number) =>
      '"' +
      String(v)
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replace(/"/g, '""') +
      '"';
    const csv =
      "\uFEFF" +
      [headers, ...rows.map(values)]
        .map((row) => row.map(cell).join(";"))
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${type}-${periodo.inicio}-${periodo.fim}-pagina-${page}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="min-h-screen bg-[#f7f7f7] p-4 md:p-6">
      <h1 className="text-2xl font-extrabold">Relatórios e clientes</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Faturamento considera pedidos finalizados e pagos no período, pela data
        de finalização no fuso de São Paulo. Os valores dos itens são anteriores
        aos descontos. Clientes e seus saldos representam o cadastro atual.
      </p>
      <form
        className="my-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!inicio || !fim || inicio > fim) {
            setPeriodoErro(
              "Informe um período válido, com início anterior ou igual ao fim.",
            );
            return;
          }
          setPeriodoErro("");
          setPage(1);
          setPeriodo({ inicio, fim });
        }}
      >
        <label className="text-sm">
          Data inicial
          <input
            aria-label="Data inicial"
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="mt-1 block rounded border p-2"
            required
          />
        </label>
        <label className="text-sm">
          Data final
          <input
            aria-label="Data final"
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="mt-1 block rounded border p-2"
            required
          />
        </label>
        <Button type="submit" disabled={report.isFetching}>
          Aplicar período
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={
            !rows.length ||
            (customerView
              ? customers.isFetching || customers.isError
              : report.isFetching || report.isError)
          }
          onClick={exportar}
        >
          {customerView || type === "orders"
            ? "Exportar página CSV"
            : "Exportar CSV"}
        </Button>
      </form>
      {periodoErro && (
        <p role="alert" className="text-red-600">
          {periodoErro}
        </p>
      )}
      {report.isPending && <p role="status">Carregando indicadores…</p>}
      {report.isError && (
        <div role="alert" className="my-4">
          <p>Não foi possível carregar os indicadores.</p>
          <Button
            disabled={report.isFetching}
            onClick={() => void report.refetch()}
          >
            Atualizar indicadores
          </Button>
        </div>
      )}
      {data && (
        <section className="my-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Faturamento", money(data.faturamento)],
            ["Pedidos finalizados", data.pedidos],
            ["Clientes cadastrados", data.clientes],
            ["Cashback creditado", money(data.cashback)],
          ].map(([title, value]) => (
            <article key={title} className="rounded-md bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-neutral-500">{title}</p>
              <strong className="mt-2 block text-xl">{value}</strong>
            </article>
          ))}
        </section>
      )}
      {customerView && (
        <input
          aria-label="Buscar cliente"
          maxLength={100}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          placeholder="Buscar por nome, telefone ou e-mail"
          className="mb-4 w-full rounded border p-3"
        />
      )}
      {((customerView && customers.isPending) ||
        (type === "orders" && orders.isPending)) && <p>Carregando…</p>}
      {((customerView && customers.isError) ||
        (type === "orders" && orders.isError)) && (
        <Button
          disabled={customerView ? customers.isFetching : orders.isFetching}
          onClick={() => {
            if (customerView) void customers.refetch();
            else void orders.refetch();
          }}
        >
          {customerView
            ? "Falha ao carregar clientes. Tentar novamente"
            : "Falha ao carregar. Tentar novamente"}
        </Button>
      )}
      <section className="overflow-x-auto rounded-md bg-white p-4 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              {(customerView ? [...headers, "Ações"] : headers).map((t) => (
                <th key={t} className="p-3">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, index: number) => (
              <tr key={row.id ?? index} className="border-b last:border-0">
                {(customerView
                  ? [
                      row.nome || "Sem nome",
                      row.tel || "—",
                      money(row.cashbackCentavos / 100),
                      row.pontos,
                      <span key="actions" className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setEdit({ ...row })}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => showBenefits(row.id)}
                        >
                          Prêmios
                        </Button>
                      </span>,
                    ]
                  : values(row)
                ).map((value: any, i: number) => (
                  <td key={i} className="p-3">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 &&
          !(customerView && (customers.isPending || customers.isError)) &&
          !(!customerView && (report.isPending || report.isError)) && (
            <p className="p-5 text-neutral-500">
              Nenhum registro para este relatório.
            </p>
          )}
      </section>
      {(customerView || type === "orders") && (
        <div className="my-4 flex items-center justify-between">
          <Button
            disabled={
              page === 1 ||
              (customerView ? customers.isFetching : orders.isFetching)
            }
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span>Página {page}</span>
          <Button
            disabled={
              (customerView
                ? customers.isFetching || customers.isError
                : orders.isFetching || orders.isError) ||
              page * 50 >=
                (customerView
                  ? (customers.data?.total ?? 0)
                  : (orders.data?.total ?? 0))
            }
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
      {edit && (
        <EditarCliente
          key={edit.id}
          cliente={edit}
          onClose={() => setEdit(null)}
        />
      )}
      {benefits && (
        <div
          role="dialog"
          aria-label="Prêmios do cliente"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <section className="w-full max-w-md space-y-3 rounded-md bg-white p-5">
            <h2 className="font-bold">Prêmios de fidelidade</h2>
            <p>Confirme o resgate somente ao entregar a maionese ao cliente.</p>
            {benefits.premios.length === 0 && <p>Nenhum prêmio conquistado.</p>}
            {benefits.premios.map((p: any) => (
              <div key={p.id} className="flex justify-between gap-2">
                <span>Prêmio #{p.id}</span>
                <Button
                  disabled={Boolean(p.resgatadoEm) || redeem.isPending}
                  onClick={() => redeem.mutate(p.id)}
                >
                  {p.resgatadoEm ? "Resgatado" : "Confirmar entrega"}
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={() => setBenefits(null)}>
              Fechar
            </Button>
          </section>
        </div>
      )}
    </main>
  );
}
