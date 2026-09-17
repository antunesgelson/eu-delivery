"use client";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, mostrarErro } from "@/service/api";
import { usePedidos, statusPedido } from "@/hook/usePedidos";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
const money = (v: number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function AdminReports({ type }: { type: string }) {
  const [page, setPage] = React.useState(1),
    [search, setSearch] = React.useState(""),
    [edit, setEdit] = React.useState<any>(null),
    [benefits, setBenefits] = React.useState<any>(null);
  const client = useQueryClient();
  const report = useQuery<any>({
    queryKey: ["relatorios"],
    queryFn: async () => (await api.get("/admin/relatorios")).data,
  });
  const customers = useQuery<any>({
    queryKey: ["clientes", page, search],
    queryFn: async () =>
      (
        await api.get("/admin/clientes", {
          params: { page, limit: 50, search },
        })
      ).data,
    enabled: ["customers", "loyalty", "cashback"].includes(type),
  });
  const orders = usePedidos(true, page);
  const save = useMutation({
    mutationFn: async (d: any) =>
      api.put(`/admin/clientes/${d.id}`, {
        nome: d.nome,
        email: d.email || undefined,
        tel: d.tel || undefined,
        cpf: d.cpf || undefined,
        dataDeNascimento: d.dataDeNascimento || undefined,
      }),
    onSuccess: () => {
      setEdit(null);
      void client.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente atualizado.");
    },
    onError: mostrarErro,
  });
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
  if (report.isPending)
    return <main className="p-6">Carregando relatório…</main>;
  if (report.isError)
    return (
      <main className="p-6">
        <Button onClick={() => report.refetch()}>
          Falha ao carregar. Tentar novamente
        </Button>
      </main>
    );
  const customerView = ["customers", "loyalty", "cashback"].includes(type);
  const rows: any[] = customerView
    ? (customers.data?.items ?? [])
    : type === "orders"
      ? (orders.data?.items ?? [])
      : type === "items"
        ? data.itens
        : type === "coupons"
          ? data.cupons
          : data.meses;
  return (
    <main className="min-h-screen bg-[#f7f7f7] p-4 md:p-6">
      <h1 className="text-2xl font-extrabold">Relatórios e clientes</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Faturamento considera pedidos finalizados e pagos. Os valores dos itens
        são anteriores aos descontos do pedido.
      </p>
      <section className="my-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Faturamento", money(data.faturamento)],
          ["Pedidos finalizados", data.pedidos],
          ["Clientes", data.clientes],
          ["Cashback creditado", money(data.cashback)],
        ].map(([title, value]) => (
          <article key={title} className="rounded-md bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-neutral-500">{title}</p>
            <strong className="mt-2 block text-xl">{value}</strong>
          </article>
        ))}
      </section>
      {customerView && (
        <input
          aria-label="Buscar cliente"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
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
          onClick={() => {
            void customers.refetch();
            void orders.refetch();
          }}
        >
          Falha ao carregar. Tentar novamente
        </Button>
      )}
      <section className="overflow-x-auto rounded-md bg-white p-4 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              {(customerView
                ? [
                    "Cliente",
                    "Telefone",
                    "Cashback",
                    "Pedidos de fidelidade",
                    "Ações",
                  ]
                : type === "orders"
                  ? ["Pedido", "Cliente", "Agendamento", "Status", "Pagamento", "Total"]
                  : type === "items"
                    ? ["Produto", "Quantidade", "Total bruto"]
                    : type === "coupons"
                      ? ["Cupom", "Usos concluídos", "Desconto"]
                      : ["Mês", "Pedidos", "Faturamento"]
              ).map((t) => (
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
                  : type === "orders"
                    ? [
                        `#${row.id}`,
                        row.cliente?.nome || "Cliente",
                        new Date(row.dataEntrega).toLocaleString("pt-BR"),
                        row.cancelamentoMotivo === 'pagamento_expirado' ? 'Prazo de pagamento encerrado' : statusPedido[row.status] ?? row.status,
                        row.pagamentoStatus === 'refund_pending' ? 'Estorno pendente' : row.pagamentoStatus === 'refunded' ? 'Estornado' : row.pagamentoStatus === 'paid' ? 'Pago' : 'Pendente',
                        money(row.valorFinal),
                      ]
                    : type === "items"
                      ? [row.titulo, row.quantidade, money(row.total)]
                      : type === "coupons"
                        ? [row.nome, row.usos, money(row.desconto)]
                        : [row.mes, row.pedidos, money(row.total)]
                ).map((value: any, i: number) => (
                  <td key={i} className="p-3">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-5 text-neutral-500">
            Nenhum registro para este relatório.
          </p>
        )}
      </section>
      {(customerView || type === "orders") && (
        <div className="my-4 flex items-center justify-between">
          <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span>Página {page}</span>
          <Button
            disabled={
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
        <div
          role="dialog"
          aria-label="Editar cliente"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <form
            className="w-full max-w-md space-y-3 rounded-md bg-white p-5"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(edit);
            }}
          >
            <h2 className="text-lg font-bold">Editar cliente</h2>
            {[
              ["nome", "Nome"],
              ["email", "E-mail"],
              ["tel", "Telefone com 55"],
              ["cpf", "CPF sem pontuação"],
              ["dataDeNascimento", "Nascimento"],
            ].map(([key, label]) => (
              <label key={key} className="block text-sm">
                {label}
                <input
                  className="mt-1 w-full rounded border p-2"
                  type={
                    key === "dataDeNascimento"
                      ? "date"
                      : key === "email"
                        ? "email"
                        : "text"
                  }
                  value={edit[key] ?? ""}
                  onChange={(e) => setEdit({ ...edit, [key]: e.target.value })}
                />
              </label>
            ))}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEdit(null)}
              >
                Cancelar
              </Button>
              <Button disabled={save.isPending}>Salvar</Button>
            </div>
          </form>
        </div>
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
