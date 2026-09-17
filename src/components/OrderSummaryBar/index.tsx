'use client'

import { Button } from "@/components/ui/button";
import { getCouponDiscount } from "@/data/coupons";
import useCart from "@/hook/useCart";
import useAuth from '@/hook/useAuth';
import {useQuery} from '@tanstack/react-query';
import {api} from '@/service/api';
import {PedidoAPI,statusPedido} from '@/hook/usePedidos';

import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaClock, FaReceipt } from "react-icons/fa6";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function formatSchedule(value?: string | null) {
    if (!value) {
        return 'Horário a confirmar';
    }

    try {
        return format(parseISO(value), "dd/MM 'às' HH:mm");
    } catch {
        return value;
    }
}

export default function OrderSummaryBar() {
    const {cart:draft,cupom}=useCart();const {isAuthenticated}=useAuth();
    const active=useQuery<PedidoAPI|undefined>({queryKey:['pedido-ativo'],queryFn:async()=>(await api.get('/pedido',{params:{status:'active',limit:1}})).data.items[0],enabled:isAuthenticated,refetchInterval:15000});
    const cart=draft?.itens.length?draft:active.data;
    const items = cart?.itens ?? [];
    const itemCount = items.reduce((total, item) => total + item.quantidade, 0);
    const hasActiveOrder = !!cart?.status && cart.status !== 'carrinho';
    const subtotal = cart?.valorTotalPedido ?? 0;
    const couponDiscount = getCouponDiscount(cupom, subtotal);
    const selectedCashback = Math.min(cart?.cashBack ?? 0, Math.max(subtotal - couponDiscount, 0));
    const finalTotal=cart?.valorFinal??0;

    if (hasActiveOrder) {
        return (
            <motion.div
                className="fixed bottom-14 left-0 right-0 z-40 px-3 pb-2 lg:bottom-0"
                initial={{ y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35 }}
            >
                <div className="mx-auto max-w-[430px] rounded-md border border-[#ffe1cc] bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5 shrink-0 rounded-full bg-[#f97316]">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f97316] opacity-45 motion-reduce:animate-none" />
                                </span>
                                <span className="text-[11px] font-extrabold uppercase text-[#f97316]">Pedido em andamento</span>
                            </div>
                            <strong className="mt-1 block text-[14px] leading-5 text-dark-900">
                                Pedido #{cart?.id ?? 1}
                            </strong>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-dark-500">
                                <span className="inline-flex items-center gap-1">
                                    <FaReceipt className="text-[#f97316]" size={12} />
                                    {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <FaClock className="text-[#f97316]" size={12} />
                                    {formatSchedule(cart?.dataEntrega)}
                                </span>
                            </div>
                        </div>

                        <strong className="shrink-0 text-[13px] text-dark-900">
                            {formatCurrency(finalTotal)}
                        </strong>
                    </div>

                    <Button
                        asChild
                        className="mt-3 h-11 w-full justify-between bg-[#f97316] px-3 text-[14px] font-extrabold text-white hover:bg-[#ea6409]"
                    >
                        <Link href={`/orderstatus?id=${cart?.id}`}>
                            <span>Acompanhar pedido</span>
                            <span className="rounded-md bg-white px-2 py-1 text-[12px] text-[#f97316]">
                                {statusPedido[cart?.status??'']}
                            </span>
                        </Link>
                    </Button>
                </div>
            </motion.div>
        );
    }

    if(!cart?.itens.length)return null;
    return (
        <motion.div
            className='fixed bottom-14 left-0 right-0 z-40 flex items-center justify-between border bg-white p-2 lg:bottom-0'
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.35 }}>
            <Button asChild className='w-full flex justify-between p-2 text-lg h-12' variant={'success'}>
                <Link href={'/cart'}>
                    <span className='ml-3 flex items-center gap-2'>
                        <IoMdCheckmarkCircleOutline size={25} />
                        Finalizar pedido
                    </span>
                    <div className='bg-white text-primary p-1 rounded-lg text-base font-bold'>
                        {formatCurrency(finalTotal)}
                    </div>
                </Link>
            </Button>
        </motion.div>
    )
}
