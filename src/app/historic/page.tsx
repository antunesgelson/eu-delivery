"use client";

import { observacaoDoItem } from "@/lib/item-observacao";
import { Button } from "@/components/ui/button";
import MobileBottomNav from "@/components/MobileBottomNav";
import { usePedidos, statusPedido } from "@/hook/usePedidos";
import { ProdutosDTO } from "@/dto/productDTO";
import { useBeneficios } from "@/hook/useLoja";
import useCart from "@/hook/useCart";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import {
  FaCalendarCheck,
  FaClock,
  FaReceipt,
  FaStore,
  FaTruckFast,
} from "react-icons/fa6";
import { IoChevronDown, IoRepeat } from "react-icons/io5";
import { MdOutlinePayments } from "react-icons/md";

type HistoricOrderItem = {
  id: number;
  productId: string;
  quantity: number;
  note?: string;
  product: ProdutosDTO;
  total: number;
};
type HistoricOrder = {
  id: string;
  date: string;
  time: string;
  status: string;
  pickupWindow: string;
  paymentMethod: string;
  items: HistoricOrderItem[];
  total: number;
  delivery: boolean;
  address: string;
};
function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getOrderTotal(order?: HistoricOrder) {
  return order?.total ?? 0;
}
function getOrderProducts(order: HistoricOrder) {
  return order.items;
}
export default function Historic() {
  const router = useRouter();
  const { promoNotificationCount } = useBeneficios();
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const query = usePedidos(false, page, pageSize);
  const summary = usePedidos(false, 1, 1);
  const latest = summary.data?.items[0];
  const dateOptions = { timeZone: "America/Sao_Paulo" };
  const historicOrders: HistoricOrder[] = (query.data?.items ?? []).map(
    (p) => ({
      id: String(p.id),
      date: new Date(p.created_at).toLocaleDateString("pt-BR", dateOptions),
      time: new Date(p.created_at).toLocaleTimeString("pt-BR", {
        ...dateOptions,
        hour: "2-digit",
        minute: "2-digit",
      }),
      status:
        p.cancelamentoMotivo === "pagamento_expirado"
          ? "Prazo de pagamento encerrado"
          : p.status === "ready" && p.canal === "entrega"
            ? "Pronto para entrega"
            : (statusPedido[p.status] ?? p.status),
      pickupWindow: p.dataEntrega
        ? new Date(p.dataEntrega).toLocaleString("pt-BR", dateOptions)
        : "Não agendado",
      paymentMethod: p.formaPagamento ?? "",
      total: p.valorFinal,
      delivery: p.canal === "entrega",
      address: [p.endereco?.rua, p.endereco?.numero, p.endereco?.bairro]
        .filter(Boolean)
        .join(", "),
      items: p.itens.map((i) => ({
        id: i.id,
        productId: String(i.produto.id),
        quantity: i.quantidade,
        note: observacaoDoItem(i),
        product: i.produto,
        total: i.valor,
      })),
    }),
  );
  const { repeatOrder: repeatInCart, cart, isPending: cartPending } = useCart();
  const [repeating, setRepeating] = React.useState<string | null>(null);
  const repeatingRef = React.useRef(false);
  const repeatKeys = React.useRef(new Map<string, string>());
  const [expandedOrderId, setExpandedOrderId] = React.useState(
    historicOrders[0]?.id ?? "",
  );
  const cartItemCount =
    cart?.itens.reduce((total, item) => total + item.quantidade, 0) ?? 0;

  const repeatOrder = async (order: HistoricOrder) => {
    if (repeatingRef.current || cartPending) return;
    repeatingRef.current = true;
    setRepeating(order.id);
    const key = repeatKeys.current.get(order.id) ?? crypto.randomUUID();
    repeatKeys.current.set(order.id, key);
    try {
      await repeatInCart(Number(order.id), key);
      repeatKeys.current.delete(order.id);
      toast.success(
        "Itens adicionados com os preços atuais. Confira o carrinho e escolha o agendamento.",
      );
      router.push("/cart");
    } catch {
      // O contexto exibe o erro; a mesma chave permite repetir uma resposta perdida sem duplicar itens.
    } finally {
      repeatingRef.current = false;
      setRepeating(null);
    }
  };

  return (
    <main className="mt-14 min-h-screen bg-[#f7f7f7] pb-20">
      <section className="bg-[#111111] px-4 pb-6 pt-5 text-white">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mx-auto max-w-[430px]"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase text-[#f97316]">
            <FaReceipt size={12} />
            Histórico
          </span>
          <h1 className="mt-3 text-[24px] font-extrabold leading-7">
            Seus pedidos
          </h1>
          <p className="mt-2 max-w-[310px] text-[13px] leading-5 text-white/75">
            Veja rapidamente o que você pediu e repita seus favoritos em poucos
            toques.
          </p>
        </motion.div>
      </section>

      <section
        aria-label="Resumo do histórico"
        className="mx-auto -mt-3 max-w-[430px] px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="grid grid-cols-3 gap-2 rounded-md bg-white p-3 shadow-sm"
        >
          <div className="rounded-md bg-[#fff7f1] p-2">
            <span className="block text-[18px] font-extrabold leading-6 text-[#f97316]">
              {summary.isSuccess ? summary.data.total : "—"}
            </span>
            <span className="text-[10px] font-bold uppercase leading-3 text-dark-500">
              Pedidos
            </span>
          </div>
          <div className="rounded-md bg-[#f7f7f7] p-2">
            <span className="block text-[18px] font-extrabold leading-6 text-dark-900">
              {summary.isSuccess
                ? formatCurrency(latest?.valorFinal ?? 0)
                : "—"}
            </span>
            <span className="text-[10px] font-bold uppercase leading-3 text-dark-500">
              Último
            </span>
          </div>
          <div className="rounded-md bg-[#f7f7f7] p-2">
            <span className="block text-[18px] font-extrabold leading-6 text-dark-900">
              {summary.isSuccess
                ? (latest?.itens.reduce(
                    (sum, item) => sum + item.quantidade,
                    0,
                  ) ?? 0)
                : "—"}
            </span>
            <span className="text-[10px] font-bold uppercase leading-3 text-dark-500">
              Itens último
            </span>
          </div>
        </motion.div>
      </section>

      {summary.isError && (
        <div role="alert" className="mx-auto mt-3 max-w-[430px] px-4 text-sm">
          Não foi possível carregar o resumo.{" "}
          <button className="underline" onClick={() => summary.refetch()}>
            Atualizar resumo
          </button>
        </div>
      )}
      <section
        aria-label="Pedidos do histórico"
        className="mx-auto mt-4 max-w-[430px] space-y-3 px-4"
      >
        {query.isLoading && <p role="status">Carregando pedidos…</p>}
        {query.isError && (
          <button onClick={() => query.refetch()}>
            Não foi possível carregar. Tentar novamente
          </button>
        )}
        {query.isSuccess && !historicOrders.length && (
          <p>Você ainda não tem pedidos.</p>
        )}
        {historicOrders.map((order, index) => {
          const products = getOrderProducts(order);
          const isExpanded = expandedOrderId === order.id;
          const totalItems = order.items.reduce(
            (total, item) => total + item.quantity,
            0,
          );
          const orderTotal = getOrderTotal(order);
          const featuredProduct = products[0]?.product.titulo ?? "Pedido";

          return (
            <motion.article
              key={order.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.28 }}
              className="overflow-hidden rounded-md bg-white shadow-sm"
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-label={`Detalhes do pedido #${order.id}`}
                onClick={() => setExpandedOrderId(isExpanded ? "" : order.id)}
                className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#111111] px-2.5 py-1 text-[11px] font-extrabold text-white">
                      #{order.id}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
                      {order.status}
                    </span>
                  </div>

                  <h2 className="mt-3 line-clamp-2 text-[16px] font-extrabold leading-5 text-dark-900">
                    {featuredProduct}
                  </h2>
                  <p className="mt-1 line-clamp-1 text-[12px] leading-4 text-dark-500">
                    {totalItems} {totalItems === 1 ? "item" : "itens"} •{" "}
                    {order.pickupWindow}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end">
                  <strong className="text-[15px] text-dark-900">
                    {formatCurrency(orderTotal)}
                  </strong>
                  <IoChevronDown
                    className={`mt-2 text-dark-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    size={20}
                  />
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2 border-t border-neutral-100 px-4 py-3 text-[12px] text-dark-500">
                <div className="flex items-center gap-2">
                  <FaCalendarCheck className="text-[#f97316]" size={14} />
                  <span>{order.date}</span>
                </div>
                <div className="flex items-center justify-end gap-2 text-right">
                  <FaClock className="text-[#f97316]" size={14} />
                  <span>{order.time}</span>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24 }}
                    className="overflow-hidden border-t border-neutral-100"
                  >
                    <div className="space-y-3 px-4 py-4">
                      <div className="space-y-2">
                        {products.map(
                          (item) =>
                            item && (
                              <div
                                key={item.id}
                                className="flex justify-between gap-3 rounded-md bg-[#f7f7f7] p-3"
                              >
                                <div className="min-w-0">
                                  <strong className="line-clamp-2 text-[13px] uppercase leading-4 text-dark-900">
                                    {item.quantity}x {item.product.titulo}
                                  </strong>
                                  {item.note && (
                                    <span className="mt-1 block text-[11px] italic leading-4 text-dark-500">
                                      {item.note}
                                    </span>
                                  )}
                                </div>
                                <strong className="whitespace-nowrap text-[13px] text-dark-900">
                                  {formatCurrency(item.total)}
                                </strong>
                              </div>
                            ),
                        )}
                      </div>

                      <div className="grid gap-2 rounded-md border border-neutral-200 p-3 text-[12px] text-dark-600">
                        <div className="flex items-center gap-2">
                          {order.delivery ? (
                            <FaTruckFast className="text-[#f97316]" size={14} />
                          ) : (
                            <FaStore className="text-[#f97316]" size={14} />
                          )}
                          <span>
                            {order.delivery
                              ? "Entrega no endereço"
                              : "Retirada no local"}
                          </span>
                        </div>
                        {order.address && <p>{order.address}</p>}
                        <div className="flex items-center gap-2">
                          <MdOutlinePayments
                            className="text-[#f97316]"
                            size={16}
                          />
                          <span>{order.paymentMethod}</span>
                        </div>
                      </div>

                      <p className="text-xs text-dark-500">
                        Os itens serão adicionados ao carrinho atual, com preços
                        e disponibilidade conferidos novamente.
                      </p>
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Button
                          type="button"
                          variant="success"
                          disabled={cartPending || repeating !== null}
                          onClick={() => repeatOrder(order)}
                          className="h-11 justify-start gap-2 bg-[#16bf75] text-[14px] font-extrabold hover:bg-[#13a866]"
                        >
                          <IoRepeat size={19} />
                          {repeating === order.id
                            ? "Adicionando…"
                            : "Pedir novamente"}
                        </Button>
                        <Button
                          asChild
                          type="button"
                          variant="outline"
                          className="h-11 px-4 text-[13px] font-extrabold"
                        >
                          <Link href={`/orderstatus?id=${order.id}`}>
                            Acompanhar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </section>

      <div className="mx-auto flex max-w-[430px] justify-between p-4">
        <Button
          disabled={page === 1 || query.isFetching || repeating !== null}
          onClick={() => setPage((p) => p - 1)}
        >
          Anterior
        </Button>
        <span aria-live="polite">Página {page}</span>
        <Button
          disabled={
            query.isFetching ||
            repeating !== null ||
            !query.data ||
            page * pageSize >= query.data.total
          }
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </Button>
      </div>
      <MobileBottomNav
        activeItem="orders"
        cartItemCount={cartItemCount}
        promoNotificationCount={promoNotificationCount}
      />
    </main>
  );
}
