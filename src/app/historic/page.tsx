'use client'

import { Button } from "@/components/ui/button";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getLocalProduct } from "@/data/menu";
import { promoNotificationCount } from "@/data/promos";
import useCart from "@/hook/useCart";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { FaCalendarCheck, FaClock, FaReceipt, FaStore } from "react-icons/fa6";
import { IoChevronDown, IoRepeat } from "react-icons/io5";
import { MdOutlinePayments } from "react-icons/md";

type HistoricOrderItem = {
    productId: string;
    quantity: number;
    note?: string;
}

type HistoricOrder = {
    id: string;
    date: string;
    time: string;
    status: string;
    pickupWindow: string;
    paymentMethod: string;
    items: HistoricOrderItem[];
}

const historicOrders: HistoricOrder[] = [
    {
        id: '1042',
        date: 'Domingo, 16/06',
        time: '11:30',
        status: 'Finalizado',
        pickupWindow: 'Retirada entre 11:30 e 12:00',
        paymentMethod: 'Pix online',
        items: [
            { productId: '101', quantity: 1, note: 'com recheio especial' },
            { productId: '301', quantity: 1 },
            { productId: '401', quantity: 1 },
        ],
    },
    {
        id: '1038',
        date: 'Sábado, 15/06',
        time: '12:30',
        status: 'Finalizado',
        pickupWindow: 'Retirada entre 12:30 e 13:00',
        paymentMethod: 'Cartão na retirada',
        items: [
            { productId: '201', quantity: 1 },
            { productId: '302', quantity: 1 },
            { productId: '402', quantity: 1 },
        ],
    },
    {
        id: '1027',
        date: 'Domingo, 09/06',
        time: '13:00',
        status: 'Finalizado',
        pickupWindow: 'Retirada entre 13:00 e 13:30',
        paymentMethod: 'Dinheiro na retirada',
        items: [
            { productId: '102', quantity: 1 },
            { productId: '301', quantity: 1 },
            { productId: '302', quantity: 1 },
        ],
    },
    {
        id: '1018',
        date: 'Sábado, 08/06',
        time: '11:30',
        status: 'Finalizado',
        pickupWindow: 'Retirada entre 11:30 e 12:00',
        paymentMethod: 'Pix online',
        items: [
            { productId: '103', quantity: 1 },
            { productId: '401', quantity: 1 },
        ],
    },
];

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function getProductPrice(productId: string) {
    const product = getLocalProduct(productId);
    if (!product) {
        return 0;
    }

    return Number(product.valorPromocional > 0 ? product.valorPromocional : product.valor);
}

function getOrderTotal(order: HistoricOrder) {
    return order.items.reduce((total, item) => total + getProductPrice(item.productId) * item.quantity, 0);
}

function getOrderProducts(order: HistoricOrder) {
    return order.items
        .map((item) => {
            const product = getLocalProduct(item.productId);

            if (!product) {
                return null;
            }

            return {
                ...item,
                product,
                total: getProductPrice(item.productId) * item.quantity,
            };
        })
        .filter(Boolean);
}

function getOrderItemCount(order: HistoricOrder) {
    return order.items.reduce((total, item) => total + item.quantity, 0);
}

export default function Historic() {
    const router = useRouter();
    const { addItemToCart, cart } = useCart();
    const [expandedOrderId, setExpandedOrderId] = React.useState(historicOrders[0]?.id ?? '');
    const cartItemCount = cart?.itens.reduce((total, item) => total + item.quantidade, 0) ?? 0;

    const repeatOrder = (order: HistoricOrder) => {
        const products = getOrderProducts(order);

        products.forEach((item) => {
            if (!item) {
                return;
            }

            addItemToCart(item.product, item.quantity, item.note ?? '');
        });

        toast.success('Pedido adicionado ao carrinho.', {
            description: 'Confira quantidades, observação e horário antes de avançar.',
        });
        router.push('/cart');
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
                    <h1 className="mt-3 text-[24px] font-extrabold leading-7">Seus pedidos</h1>
                    <p className="mt-2 max-w-[310px] text-[13px] leading-5 text-white/75">
                        Veja rapidamente o que você pediu e repita seus favoritos em poucos toques.
                    </p>
                </motion.div>
            </section>

            <section className="mx-auto -mt-3 max-w-[430px] px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.3 }}
                    className="grid grid-cols-3 gap-2 rounded-md bg-white p-3 shadow-sm"
                >
                    <div className="rounded-md bg-[#fff7f1] p-2">
                        <span className="block text-[18px] font-extrabold leading-6 text-[#f97316]">{historicOrders.length}</span>
                        <span className="text-[10px] font-bold uppercase leading-3 text-dark-500">Pedidos</span>
                    </div>
                    <div className="rounded-md bg-[#f7f7f7] p-2">
                        <span className="block text-[18px] font-extrabold leading-6 text-dark-900">
                            {formatCurrency(getOrderTotal(historicOrders[0]))}
                        </span>
                        <span className="text-[10px] font-bold uppercase leading-3 text-dark-500">Último</span>
                    </div>
                    <div className="rounded-md bg-[#f7f7f7] p-2">
                        <span className="block text-[18px] font-extrabold leading-6 text-dark-900">
                            {getOrderItemCount(historicOrders[0])}
                        </span>
                        <span className="text-[10px] font-bold uppercase leading-3 text-dark-500">Itens último</span>
                    </div>
                </motion.div>
            </section>

            <section className="mx-auto mt-4 max-w-[430px] space-y-3 px-4">
                {historicOrders.map((order, index) => {
                    const products = getOrderProducts(order);
                    const isExpanded = expandedOrderId === order.id;
                    const totalItems = order.items.reduce((total, item) => total + item.quantity, 0);
                    const orderTotal = getOrderTotal(order);
                    const featuredProduct = products[0]?.product.titulo ?? 'Pedido';

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
                                onClick={() => setExpandedOrderId(isExpanded ? '' : order.id)}
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
                                        {totalItems} {totalItems === 1 ? 'item' : 'itens'} • {order.pickupWindow}
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-col items-end">
                                    <strong className="text-[15px] text-dark-900">{formatCurrency(orderTotal)}</strong>
                                    <IoChevronDown className={`mt-2 text-dark-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={20} />
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
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.24 }}
                                        className="overflow-hidden border-t border-neutral-100"
                                    >
                                        <div className="space-y-3 px-4 py-4">
                                            <div className="space-y-2">
                                                {products.map((item) => item && (
                                                    <div key={item.productId} className="flex justify-between gap-3 rounded-md bg-[#f7f7f7] p-3">
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
                                                ))}
                                            </div>

                                            <div className="grid gap-2 rounded-md border border-neutral-200 p-3 text-[12px] text-dark-600">
                                                <div className="flex items-center gap-2">
                                                    <FaStore className="text-[#f97316]" size={14} />
                                                    <span>Retirada no local</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MdOutlinePayments className="text-[#f97316]" size={16} />
                                                    <span>{order.paymentMethod}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-[1fr_auto] gap-2">
                                                <Button
                                                    type="button"
                                                    variant="success"
                                                    onClick={() => repeatOrder(order)}
                                                    className="h-11 justify-start gap-2 bg-[#16bf75] text-[14px] font-extrabold hover:bg-[#13a866]"
                                                >
                                                    <IoRepeat size={19} />
                                                    Pedir novamente
                                                </Button>
                                                <Button
                                                    asChild
                                                    type="button"
                                                    variant="outline"
                                                    className="h-11 px-4 text-[13px] font-extrabold"
                                                >
                                                    <Link href="/">Cardápio</Link>
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

            <MobileBottomNav
                activeItem="orders"
                cartItemCount={cartItemCount}
                promoNotificationCount={promoNotificationCount}
            />
        </main>
    )
}
