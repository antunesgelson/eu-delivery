"use client";
import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCuponsPublicos } from "@/hook/useLoja";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import useCart from "@/hook/useCart";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FaCheck, FaPercent, FaRegClock, FaTag } from "react-icons/fa6";
import { HiTicket } from "react-icons/hi2";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { toast } from "sonner";

const couponSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, "Informe o código do cupom.")
    .max(60, "Use até 60 caracteres.")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Use apenas letras, números, hífen ou sublinhado.",
    )
    .transform((value) => value.toUpperCase()),
});
export type CouponForm = z.infer<typeof couponSchema>;

export default function Cupom() {
  const router = useRouter();
  const sending = React.useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues: { codigo: "" },
  });
  const {
    cart,
    cupom: activeCoupon,
    applyCoupon,
    removeCoupon,
    isPending,
    isLoading,
    isError,
    handleUpdateCart,
  } = useCart();
  const publicCoupons = useCuponsPublicos();
  const subtotal = cart?.valorTotalPedido ?? 0;
  const coupons = publicCoupons.data ?? [];
  const blocked = isPending || !cart?.itens.length;

  function formatDate(dateString: string) {
    // A validade é um dia civil, sem horário ou conversão de fuso.
    return dateString.slice(0, 10).split("-").reverse().join("/");
  }

  function getCouponLabel(
    couponValue: number,
    type: "porcentagem" | "valor_fixo",
  ) {
    if (type === "porcentagem") {
      return `${couponValue}% OFF`;
    }

    return `${couponValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })} OFF`;
  }

  function isExpired(validity: string) {
    return (
      validity.slice(0, 10) <
      new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
    );
  }

  function getCouponAvailability(
    couponName: string,
    minimumValue: number,
    validity: string,
    status: boolean,
  ) {
    if (!status || isExpired(validity)) {
      return {
        available: false,
        message: "Cupom indisponível",
      };
    }

    if (subtotal < minimumValue) {
      return {
        available: false,
        message: `Faltam ${(minimumValue - subtotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      };
    }

    if (activeCoupon?.nome === couponName) {
      return {
        available: true,
        message: "Em uso",
      };
    }

    return {
      available: true,
      message: "Usar cupom",
    };
  }

  async function handleApplyCoupon(couponName: string) {
    if (sending.current || blocked) return;
    sending.current = true;
    try {
      // A API troca cashback por cupom na mesma transação e só se o cupom for válido.
      await applyCoupon({ nome: couponName.trim().toUpperCase() });
      toast.success("Cupom aplicado.");
      router.replace("/cart");
    } catch {
      /* O contexto apresenta o erro retornado pela API. */
    } finally {
      sending.current = false;
    }
  }

  if (isLoading)
    return (
      <main className="mt-16 p-4" role="status">
        Carregando carrinho…
      </main>
    );
  if (isError)
    return (
      <main className="mt-16 p-4" role="alert">
        Não foi possível carregar o carrinho.{" "}
        <Button onClick={handleUpdateCart}>Tentar novamente</Button>
      </main>
    );

  return (
    <motion.main
      className="mt-14 min-h-screen bg-[#f7f7f7] pb-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mx-auto max-w-[430px]">
        <section className="bg-[#111111] px-4 pb-5 pt-6 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase text-[#f97316]">
            <HiTicket size={15} />
            Cupons
          </span>
          <h1 className="mt-3 text-[24px] font-extrabold leading-7">
            Escolha seu desconto
          </h1>
          <p className="mt-2 text-[13px] leading-5 text-white/75">
            Aplique um cupom disponível ou informe um código recebido.
          </p>
        </section>

        <section className="-mt-2 rounded-t-[18px] bg-white px-4 pb-4 pt-5 shadow-sm">
          <h2 className="text-[17px] font-extrabold text-dark-900">
            Código promocional
          </h2>
          {!cart?.itens.length && (
            <p className="mt-3 text-sm">
              Adicione produtos ao carrinho para usar um cupom.{" "}
              <Link className="underline" href="/">
                Ver cardápio
              </Link>
            </p>
          )}
          {!!cart?.cashBack && (
            <p className="mt-3 text-sm">
              O cashback será substituído somente ao aplicar um cupom válido.
            </p>
          )}
          <form
            noValidate
            onSubmit={handleSubmit(({ codigo }) => handleApplyCoupon(codigo))}
            className="mt-3 grid grid-cols-[1fr_auto] gap-2"
          >
            <Input
              {...register("codigo")}
              aria-label="Código do cupom"
              error={errors.codigo?.message}
              disabled={blocked}
              placeholder="Digite o código"
              className="h-11 bg-[#f7f7f7] text-[14px] font-extrabold uppercase"
            />
            <Button
              type="submit"
              disabled={blocked}
              variant="success"
              className="h-11 px-4 text-[13px] font-extrabold"
            >
              {isPending ? "Aplicando…" : "Aplicar"}
            </Button>
          </form>
        </section>

        {activeCoupon && (
          <section className="mt-3 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <div className="min-w-0">
                <span className="text-[11px] font-extrabold uppercase text-emerald-700">
                  Cupom ativo
                </span>
                <strong className="mt-1 block text-[15px] text-dark-900">
                  {activeCoupon.nome}
                </strong>
                <p className="mt-1 text-[12px] leading-4 text-dark-600">
                  Desconto de{" "}
                  {(cart?.descontoCupom ?? 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
                  no pedido.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (sending.current || isPending) return;
                  sending.current = true;
                  try {
                    await removeCoupon();
                    toast.success("Cupom removido.");
                  } catch {
                    /* O contexto apresenta o erro da API. */
                  } finally {
                    sending.current = false;
                  }
                }}
                disabled={isPending}
                aria-label="Remover cupom"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-dark-700"
              >
                <IoClose size={22} />
              </button>
            </div>
          </section>
        )}

        <section className="mt-3 px-4">
          <h2 className="mb-3 text-[18px] font-extrabold text-dark-900">
            Cupons disponíveis
          </h2>
          {publicCoupons.isPending && <p role="status">Carregando cupons…</p>}
          {publicCoupons.isError && (
            <div role="alert" className="space-y-2">
              <p>Não foi possível carregar os cupons disponíveis.</p>
              <Button
                disabled={publicCoupons.isFetching}
                onClick={() => void publicCoupons.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          )}
          {publicCoupons.isSuccess && !coupons.length && (
            <p>
              Nenhum cupom público disponível no momento. Você ainda pode
              informar um código recebido.
            </p>
          )}
          <div className="space-y-3">
            {publicCoupons.isSuccess &&
              coupons.map((coupon, index) => {
                const availability = getCouponAvailability(
                  coupon.nome,
                  coupon.valorMinimoGasto,
                  coupon.validade,
                  coupon.status,
                );
                const isSelected = activeCoupon?.id === coupon.id;

                return (
                  <motion.article
                    key={coupon.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.22 }}
                    className={`overflow-hidden rounded-md bg-white shadow-sm ring-1 ${isSelected ? "ring-emerald-400" : "ring-transparent"}`}
                  >
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7f1] px-2.5 py-1 text-[11px] font-extrabold text-[#f97316]">
                            <FaPercent size={11} />
                            {getCouponLabel(coupon.valor, coupon.tipo)}
                          </span>
                          {coupon.unicoUso && (
                            <span className="rounded-full bg-[#f7f7f7] px-2.5 py-1 text-[11px] font-extrabold text-dark-500">
                              Uso único
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 text-[17px] font-extrabold leading-5 text-dark-900">
                          {coupon.nome}
                        </h3>
                        <p className="mt-1 text-[12px] leading-5 text-dark-600">
                          {coupon.descricao}
                        </p>
                      </div>

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isSelected ? "bg-emerald-500 text-white" : "bg-[#f7f7f7] text-[#f97316]"}`}
                      >
                        {isSelected ? (
                          <FaCheck size={16} />
                        ) : (
                          <HiTicket size={20} />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t px-4 py-3 text-[11px] font-semibold text-dark-500">
                      <div className="flex items-center gap-1.5">
                        <FaTag className="text-[#f97316]" size={12} />
                        Mín.{" "}
                        {coupon.valorMinimoGasto.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-right">
                        <FaRegClock className="text-[#f97316]" size={12} />
                        {formatDate(coupon.validade)}
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <Button
                        type="button"
                        variant={isSelected ? "outline" : "success"}
                        disabled={
                          blocked ||
                          !availability.available ||
                          isSelected ||
                          coupon.quantidade <= 0
                        }
                        onClick={() => handleApplyCoupon(coupon.nome)}
                        className="h-10 w-full justify-start gap-2 text-[13px] font-extrabold"
                      >
                        <IoMdCheckmarkCircleOutline size={19} />
                        {availability.message}
                      </Button>
                    </div>
                  </motion.article>
                );
              })}
          </div>
        </section>
      </div>
    </motion.main>
  );
}
