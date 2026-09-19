"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PedidoAPI } from "@/hook/usePedidos";
import { api, mostrarErro } from "@/service/api";

type Props = {
  order: PedidoAPI;
  unavailable: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<unknown>;
};

export function OrderPayment({
  order,
  unavailable,
  refreshing,
  onRefresh,
}: Props) {
  const [now, setNow] = useState(Date.now);
  const sending = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const online = order.formaPagamento?.startsWith("Pagamento online");
  const cancelled = order.status === "cancelled";
  const deadline = order.pagamentoExpiraEm
    ? new Date(order.pagamentoExpiraEm)
    : null;
  const expired = !!deadline && deadline.getTime() <= now;
  const pending = order.pagamentoStatus === "pending";
  const labels: Record<string, string> = {
    pending: cancelled ? "Pagamento não confirmado" : "Aguardando pagamento",
    paid: "Pagamento confirmado",
    refund_pending: "Estorno pendente",
    refunded: "Estorno confirmado",
  };
  const payment = useMutation({
    mutationFn: async () =>
      (await api.post(`/pagamento/${order.id}/checkout`)).data,
    onSuccess: async (data) => {
      if (data.checkoutUrl) window.location.assign(data.checkoutUrl);
      else await onRefresh();
    },
    onError: async (error) => {
      mostrarErro(error);
      // Uma confirmação ou expiração pode ter chegado enquanto o cliente clicava.
      await onRefresh();
    },
    onSettled: () => {
      sending.current = false;
    },
  });

  return (
    <section
      aria-label="Pagamento do pedido"
      className="mt-4 space-y-3 border-t pt-4"
    >
      <h2 className="font-bold">
        {labels[order.pagamentoStatus] ?? "Pagamento em verificação"}
      </h2>
      {order.pagamentoStatus === "refund_pending" && (
        <p
          role="alert"
          className="rounded border border-amber-300 bg-amber-50 p-3 text-sm"
        >
          O pagamento foi confirmado após o cancelamento. O pedido continua
          cancelado; entre em contato com a loja para acompanhar o estorno.
        </p>
      )}
      {order.pagamentoStatus === "refunded" && (
        <p className="text-sm">
          O provedor confirmou o estorno. O prazo para o valor aparecer depende
          da forma de pagamento e da instituição financeira.
        </p>
      )}
      {pending && online && !cancelled && (
        <p role="status" className="text-sm">
          {expired
            ? "Prazo encerrado. Estamos conferindo o pagamento antes de liberar a reserva. Não faça outro pagamento para este pedido."
            : deadline
              ? `Pague até ${deadline.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })} (horário de Brasília). O estoque fica reservado por 15 minutos.`
              : "Aguardando confirmação do pagamento online."}
        </p>
      )}
      {pending && !online && !cancelled && (
        <p className="text-sm">
          Pague no recebimento do pedido pela forma escolhida.
        </p>
      )}
      {unavailable && (
        <p
          role="alert"
          className="rounded border border-amber-300 bg-amber-50 p-3 text-sm"
        >
          Não foi possível atualizar o pedido. Os dados abaixo são da última
          consulta. Atualize antes de pagar.
        </p>
      )}
      {pending && online && !cancelled && (
        <Button
          className="w-full"
          disabled={payment.isPending || expired || unavailable}
          onClick={() => {
            if (sending.current || expired || unavailable) return;
            sending.current = true;
            payment.mutate();
          }}
        >
          {payment.isPending ? "Abrindo pagamento…" : "Pagar com Mercado Pago"}
        </Button>
      )}
      <Button
        variant="outline"
        className="w-full"
        disabled={refreshing || payment.isPending}
        onClick={() => void onRefresh()}
      >
        {refreshing ? "Atualizando pagamento…" : "Atualizar pagamento"}
      </Button>
    </section>
  );
}
