'use client'

import { Button } from "@/components/ui/button";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Progress } from "@/components/ui/progress";
import {
    cashbackBalance,
    cashbackExpiration,
    loyaltyCurrentOrders,
    loyaltyGoalOrders,
    loyaltyProgress,
    loyaltyRemainingOrders,
    promoNotificationCount,
} from "@/data/promos";
import useCart from "@/hook/useCart";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import React from "react";
import { FaPiggyBank } from "react-icons/fa";
import { FaCalendarCheck, FaCircleInfo, FaCoins, FaTrophy } from "react-icons/fa6";
import { IoSparkles } from "react-icons/io5";
import { MdOutlineRule } from "react-icons/md";

type PromoTab = 'cashback' | 'fidelidade';

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function getConfigValue(configData: any, key: string) {
    return configData?.find((item: any) => item.chave?.toUpperCase() === key)?.valor ?? '';
}

export default function CashbackPage() {
    const [activeTab, setActiveTab] = React.useState<PromoTab>('cashback');
    const { cart, configData } = useCart();
    const cartItemCount = cart?.itens.reduce((total, item) => total + item.quantidade, 0) ?? 0;
    const cashbackPercent = getConfigValue(configData, 'CASHBACK') || '3';

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
                        <IoSparkles size={13} />
                        Promos
                    </span>
                    <h1 className="mt-3 text-[24px] font-extrabold leading-7">Benefícios</h1>
                    <p className="mt-2 max-w-[320px] text-[13px] leading-5 text-white/75">
                        Acompanhe seu cashback e veja quantos pedidos faltam para liberar sua fidelidade.
                    </p>
                </motion.div>
            </section>

            <section className="mx-auto -mt-3 max-w-[430px] px-4">
                <div className="grid grid-cols-2 rounded-md bg-white p-1 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setActiveTab('cashback')}
                        className={`h-11 rounded-md text-[13px] font-extrabold transition-colors ${activeTab === 'cashback' ? 'bg-[#f97316] text-white' : 'text-dark-500'}`}
                    >
                        Cashback
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('fidelidade')}
                        className={`h-11 rounded-md text-[13px] font-extrabold transition-colors ${activeTab === 'fidelidade' ? 'bg-[#f97316] text-white' : 'text-dark-500'}`}
                    >
                        Fidelidade
                    </button>
                </div>
            </section>

            <section className="mx-auto mt-4 max-w-[430px] px-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'cashback' && (
                        <motion.div
                            key="cashback"
                            initial={{ opacity: 0, x: -18 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 18 }}
                            transition={{ duration: 0.22 }}
                            className="space-y-3"
                        >
                            <section className="overflow-hidden rounded-md bg-white shadow-sm">
                                <div className="bg-[#111111] p-4 text-white">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <span className="text-[11px] font-extrabold uppercase text-white/60">Saldo disponível</span>
                                            <strong className="mt-1 block text-[30px] font-extrabold leading-9">
                                                {formatCurrency(cashbackBalance)}
                                            </strong>
                                            <p className="mt-1 text-[12px] leading-5 text-white/70">
                                                Use esse saldo em pedidos elegíveis no Assados Zanini.
                                            </p>
                                        </div>
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f97316] text-white">
                                            <FaCoins size={24} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 p-4">
                                    <div className="flex items-center gap-3 rounded-md bg-[#fff7f1] p-3">
                                        <FaPiggyBank className="shrink-0 text-[#f97316]" size={20} />
                                        <div>
                                            <strong className="block text-[13px] text-dark-900">Você recebe {cashbackPercent}% de volta</strong>
                                            <span className="text-[12px] leading-4 text-dark-500">O valor entra após a confirmação do pedido.</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-md bg-[#f7f7f7] p-3">
                                        <FaCalendarCheck className="shrink-0 text-[#f97316]" size={18} />
                                        <div>
                                            <strong className="block text-[13px] text-dark-900">Expira em {cashbackExpiration}</strong>
                                            <span className="text-[12px] leading-4 text-dark-500">Use antes do vencimento para não perder o benefício.</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-md bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <MdOutlineRule className="text-[#f97316]" size={20} />
                                    <h2 className="text-[17px] font-extrabold text-dark-900">Regras do cashback</h2>
                                </div>
                                <ul className="mt-3 space-y-2 text-[12px] leading-5 text-dark-600">
                                    <li className="rounded-md bg-[#f7f7f7] p-3">O cashback é liberado após o pedido ser confirmado e finalizado.</li>
                                    <li className="rounded-md bg-[#f7f7f7] p-3">O saldo pode ser usado em novos pedidos, respeitando o valor mínimo do estabelecimento.</li>
                                    <li className="rounded-md bg-[#f7f7f7] p-3">Cashback não acumula com cupons de desconto no mesmo pedido.</li>
                                </ul>
                            </section>

                            <Button asChild variant="success" className="h-12 w-full justify-start gap-2 bg-[#16bf75] text-[15px] font-extrabold hover:bg-[#13a866]">
                                <Link href="/">
                                    <FaCoins size={18} />
                                    Utilizar cashback
                                </Link>
                            </Button>
                        </motion.div>
                    )}

                    {activeTab === 'fidelidade' && (
                        <motion.div
                            key="fidelidade"
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -18 }}
                            transition={{ duration: 0.22 }}
                            className="space-y-3"
                        >
                            <section className="rounded-md bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <span className="text-[11px] font-extrabold uppercase text-[#f97316]">Fidelidade</span>
                                        <h2 className="mt-1 text-[20px] font-extrabold leading-6 text-dark-900">
                                            Faltam {loyaltyRemainingOrders} pedidos
                                        </h2>
                                        <p className="mt-1 text-[12px] leading-5 text-dark-500">
                                            Complete {loyaltyGoalOrders} pedidos para liberar seu prêmio.
                                        </p>
                                    </div>
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff7f1] text-[#f97316]">
                                        <FaTrophy size={24} />
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <div className="mb-2 flex justify-between text-[12px] font-extrabold text-dark-700">
                                        <span>{loyaltyCurrentOrders} pedidos feitos</span>
                                        <span>{loyaltyGoalOrders} pedidos</span>
                                    </div>
                                    <Progress value={loyaltyProgress} className="h-3 bg-[#ffe6d6]" />
                                    <div className="mt-3 grid grid-cols-6 gap-1">
                                        {Array.from({ length: loyaltyGoalOrders }).map((_, index) => {
                                            const completed = index < loyaltyCurrentOrders;

                                            return (
                                                <div
                                                    key={index}
                                                    className={`h-2 rounded-full ${completed ? 'bg-[#f97316]' : 'bg-neutral-200'}`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-md bg-white p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff7f1] text-[#f97316]">
                                        <FaTrophy size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-extrabold leading-5 text-dark-900">Prêmio</h3>
                                        <p className="mt-1 text-[12px] leading-5 text-dark-600">
                                            Ao completar a fidelidade, você ganha uma maionese da casa para acompanhar seu próximo pedido.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-md bg-white p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f7f7f7] text-[#f97316]">
                                        <FaCircleInfo size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-extrabold leading-5 text-dark-900">Regras</h3>
                                        <p className="mt-1 text-[12px] leading-5 text-dark-600">
                                            Conta 1 ponto por pedido finalizado. Pedidos cancelados não entram na fidelidade. O prêmio é liberado automaticamente após completar a meta.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            <MobileBottomNav
                activeItem="promos"
                cartItemCount={cartItemCount}
                promoNotificationCount={promoNotificationCount}
            />
        </main>
    )
}
