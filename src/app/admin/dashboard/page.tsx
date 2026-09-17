'use client'
import EstornosPendentes from '@/components/admin/EstornosPendentes';
import ConciliacoesPendentes from '@/components/admin/ConciliacoesPendentes';

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { Tooltip } from "react-tooltip";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import EditarAgendamento from "@/components/admin/EditarAgendamento";
import AdminReports from "@/components/admin/AdminReports";
import { api,mostrarErro } from "@/service/api";
import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { PedidoAPI,useOperacao } from "@/hook/usePedidos";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import {
    FaAnglesLeft,
    FaAnglesRight,
    FaBoxOpen,
    FaCalendarDays,
    FaCashRegister,
    FaChartLine,
    FaChevronLeft,
    FaChevronRight,
    FaClock,
    FaCoins,
    FaCreditCard,
    FaDownload,
    FaEye,
    FaFileExport,
    FaFilter,
    FaGift,
    FaIdCard,
    FaMagnifyingGlass,
    FaLocationDot,
    FaMoneyBillWave,
    FaMotorcycle,
    FaPenToSquare,
    FaPhone,
    FaPiggyBank,
    FaPlus,
    FaRankingStar,
    FaReceipt,
    FaRotateRight,
    FaSort,
    FaStar,
    FaStore,
    FaTrashCan,
    FaUser,
    FaUserCheck,
    FaUserPlus,
    FaUserXmark,
    FaUsers,
    FaWhatsapp,
    FaXmark,
} from "react-icons/fa6";
import { HiTicket } from "react-icons/hi2";
import { IoCheckmarkCircle, IoSearch, IoSettingsSharp } from "react-icons/io5";

type OrderStatus = 'analysis' | 'production' | 'ready';
type OrderChannel = 'retirada' | 'delivery' | 'balcao';
type PaymentStatus = 'paid' | 'pending';
type ProductFilter = 'all' | 'frango-recheado' | 'frango-sem-recheio' | 'costelinha-bbq';
type ScheduledDay = 'saturday' | 'sunday';
type ReportType = 'general' | 'customers' | 'orders' | 'items' | 'coupons' | 'loyalty' | 'cashback';
type CustomerReportStatus = 'potential' | 'active' | 'inactive';

type AdminOrder = {
    id: string;
    customer: string;
    phone: string;
    status: OrderStatus;
    channel: OrderChannel;
    pickupWindow: string;
    createdAt: string;
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    total: number;
    subtotal:number;
    deliveryFee:number;
    address:string;
    items: Array<{
        quantity: number;
        name: string;
        note?: string;
    }>;
}

type ScheduledOrder = AdminOrder & {
    scheduledDay: ScheduledDay;
    scheduledDate: string;
    scheduledDateLabel: string;
    scheduledWindow: string;
    scheduledNote: string;
    placedAt: string;
}

type KanbanColumn = {
    id: OrderStatus;
    title: string;
    description: string;
    headerClass: string;
    bodyClass: string;
    emptyText: string;
}

const columns: KanbanColumn[] = [
    {
        id: 'analysis',
        title: 'Em análise',
        description: 'Pedidos novos aguardando aceite.',
        headerClass: 'bg-[#6f7173]',
        bodyClass: 'bg-[#d7d7d7]',
        emptyText: 'Nenhum pedido aguardando análise.',
    },
    {
        id: 'production',
        title: 'Em produção',
        description: 'Pedidos aceitos e em preparo.',
        headerClass: 'bg-[#dc9b29]',
        bodyClass: 'bg-[#f5b13d]',
        emptyText: 'Nenhum pedido em produção.',
    },
    {
        id: 'ready',
        title: 'Prontos para retirada',
        description: 'Pedidos prontos para entregar ao cliente.',
        headerClass: 'bg-[#57894b]',
        bodyClass: 'bg-[#67aa75]',
        emptyText: 'Nenhum pedido pronto no momento.',
    },
];

const reportOptions: Array<{
    value: ReportType;
    title: string;
    shortTitle: string;
    description: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
    {
        value: 'general',
        title: 'Relatório geral',
        shortTitle: 'Geral',
        description: 'Resumo executivo de vendas, pedidos e operação.',
        Icon: FaChartLine,
    },
    {
        value: 'customers',
        title: 'Relatório de clientes',
        shortTitle: 'Clientes',
        description: 'Clientes ativos, recorrência e melhores compradores.',
        Icon: FaUsers,
    },
    {
        value: 'orders',
        title: 'Relatório de pedidos',
        shortTitle: 'Pedidos',
        description: 'Status, canais e formas de pagamento dos pedidos.',
        Icon: FaReceipt,
    },
    {
        value: 'items',
        title: 'Relatório de itens',
        shortTitle: 'Itens',
        description: 'Produtos mais vendidos e giro por categoria.',
        Icon: FaBoxOpen,
    },
    {
        value: 'coupons',
        title: 'Relatório de cupons',
        shortTitle: 'Cupons',
        description: 'Cupons ativos, uso previsto e impacto em desconto.',
        Icon: HiTicket,
    },
    {
        value: 'loyalty',
        title: 'Relatório de fidelidade',
        shortTitle: 'Fidelidade',
        description: 'Progresso de clientes no programa de fidelidade.',
        Icon: FaGift,
    },
    {
        value: 'cashback',
        title: 'Relatório de cashback',
        shortTitle: 'Cashback',
        description: 'Saldo concedido, usado e próximo de expirar.',
        Icon: FaPiggyBank,
    },
];

const productFilters: Array<{
    value: ProductFilter;
    label: string;
    match: string;
}> = [
    { value: 'frango-recheado', label: 'Frango com recheio', match: 'frango assado recheado' },
    { value: 'frango-sem-recheio', label: 'Frango sem recheio', match: 'frango assado sem recheio' },
    { value: 'costelinha-bbq', label: 'Costelinha BBQ', match: 'costelinha bbq defumada' },
];

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function parseLocalDate(value: string) {
    if (!value) {
        return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
}

function formatDateToISO(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
    const date = parseLocalDate(value);

    if (!date) {
        return 'Filtrar data';
    }

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function countProductQuantity(orders: AdminOrder[], match: string) {
    return orders.reduce((total, order) => {
        const orderQuantity = order.items.reduce((itemTotal, item) => {
            return item.name.toLowerCase().includes(match) ? itemTotal + item.quantity : itemTotal;
        }, 0);

        return total + orderQuantity;
    }, 0);
}

function getChannelLabel(channel: OrderChannel) {
    if (channel === 'delivery') {
        return 'Delivery';
    }

    if (channel === 'balcao') {
        return 'Balcão';
    }

    return 'Retirada';
}

function getChannelIcon(channel: OrderChannel) {
    if (channel === 'delivery') {
        return FaMotorcycle;
    }

    if (channel === 'balcao') {
        return FaCashRegister;
    }

    return FaStore;
}

function getNextStatus(status: OrderStatus): OrderStatus | null {
    if (status === 'analysis') {
        return 'production';
    }

    if (status === 'production') {
        return 'ready';
    }

    return null;
}

function getActionLabel(status: OrderStatus) {
    if (status === 'analysis') {
        return 'Aceitar pedido';
    }

    if (status === 'production') {
        return 'Marcar pronto';
    }

    return 'Finalizar';
}

function getScheduledDayLabel(day: ScheduledDay) {
    if (day === 'saturday') {
        return 'Sábado';
    }

    return 'Domingo';
}

function getPickupWindowParts(pickupWindow: string) {
    const [day, window] = pickupWindow.split(',').map((part) => part.trim());

    if (!window) {
        return {
            day: '',
            window: day,
        };
    }

    return {
        day,
        window,
    };
}

function getCompactPaymentMethodLabel(paymentMethod: string) {
    return paymentMethod
        .replace(/\s+na retirada$/i, '')
        .replace(/\s+online$/i, '')
        .replace(/\s+enviado pelo WhatsApp$/i, '')
        .trim() || paymentMethod;
}

function AutoAcceptSwitch({
    checked,
    onCheckedChange,
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "relative h-6 w-11 shrink-0 rounded-full border border-transparent p-0.5 shadow-inner transition-colors",
                checked ? "bg-emerald-500" : "bg-neutral-300"
            )}
        >
            <span
                className={cn(
                    "block h-5 w-5 rounded-full bg-white shadow transition-transform",
                    checked ? "translate-x-5" : "translate-x-0"
                )}
            />
        </button>
    );
}

function PaymentStatusSwitch({
    checked,
    onCheckedChange,
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "relative flex h-8 w-[92px] shrink-0 items-center rounded-full border p-1 transition-colors",
                checked
                    ? "justify-end border-emerald-200 bg-emerald-500"
                    : "justify-start border-amber-200 bg-amber-100"
            )}
        >
            <span className={cn(
                "absolute text-[9px] font-extrabold uppercase transition-colors",
                checked ? "left-3 text-white" : "right-2.5 text-amber-700"
            )}>
                {checked ? 'Pago' : 'Aberto'}
            </span>
            <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                {checked && <IoCheckmarkCircle className="text-emerald-600" size={16} />}
            </span>
        </button>
    );
}

function OrderDetailsModal({
    order,
    open,
    onOpenChange,
    onRemove,
    onPaymentStatusChange,
    onStatusChange,
}: {
    order: AdminOrder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange:(id:string,status:string)=>void;
    onRemove: (orderId: string) => void;
    onPaymentStatusChange: (orderId: string, paymentStatus: PaymentStatus) => void;
}) {
    React.useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onOpenChange(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onOpenChange]);

    if (!open || !order) {
        return null;
    }

    const statusLabel = columns.find((column) => column.id === order.status)?.title ?? 'Pedido';
    const totalItems = order.items.reduce((total, item) => total + item.quantity, 0);
    const nextStatus = getNextStatus(order.status);
    const paymentIsPaid = order.paymentStatus === 'paid';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/35 p-6 backdrop-blur-xl backdrop-saturate-150"
            onClick={() => onOpenChange(false)}
        >
            <section
                className="flex max-h-[calc(100dvh-48px)] w-full max-w-[920px] flex-col overflow-hidden rounded-xl bg-white text-dark-900 shadow-2xl ring-1 ring-black/10"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="shrink-0 border-b border-neutral-200 bg-white px-6 py-5">
                    <div className="flex items-start justify-between gap-5">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-full bg-[#fff3ea] px-3 py-1 text-[11px] font-extrabold uppercase text-[#f97316]">
                                    Pedido #{order.id}
                                </span>
                                <span className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-extrabold uppercase text-[#2f6fb7]">
                                    {statusLabel}
                                </span>
                                <span className={cn(
                                    "inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase",
                                    order.paymentStatus === 'paid'
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                                )}>
                                    {order.paymentStatus === 'paid' ? 'Pagamento confirmado' : 'Pagamento pendente'}
                                </span>
                            </div>

                            <h2 id="order-details-title" className="mt-3 truncate text-[24px] font-extrabold leading-7 text-dark-950">
                                {order.customer}
                            </h2>
                            <p className="mt-1 max-w-[620px] text-[13px] font-semibold leading-5 text-dark-500">
                                Confira o pedido, valide os dados operacionais e escolha a próxima ação.
                            </p>
                        </div>

                        <div className="flex shrink-0 items-start gap-4">
                            <div className="text-right">
                                <span className="block text-[10px] font-extrabold uppercase text-dark-400">Total do pedido</span>
                                <strong className="block text-[25px] font-extrabold leading-8 text-dark-950">
                                    {formatCurrency(order.total)}
                                </strong>
                            </div>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-dark-400 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-dark-900"
                                aria-label="Fechar detalhes do pedido"
                            >
                                <FaXmark size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6f7f9] px-6 py-5">
                    <section className="grid gap-3 xl:grid-cols-4">
                        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-dark-400">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff3ea] text-[#f97316]">
                                    <FaUser size={12} />
                                </span>
                                Cliente
                            </span>
                            <strong className="mt-3 block truncate text-[14px] text-dark-950">{order.customer}</strong>
                            <span className="text-[12px] font-semibold text-dark-500">{order.phone}</span>
                        </div>
                        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-dark-400">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff3ea] text-[#f97316]">
                                    <FaStore size={12} />
                                </span>
                                Recebimento
                            </span>
                            <strong className="mt-3 block text-[14px] text-dark-950">{getChannelLabel(order.channel)}</strong>
                            <span className="text-[12px] font-semibold text-dark-500">{order.pickupWindow}</span>
                        </div>
                        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-dark-400">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff3ea] text-[#f97316]">
                                    <FaCreditCard size={12} />
                                </span>
                                Pagamento
                            </span>
                            <strong className="mt-3 block text-[14px] text-dark-950">{order.paymentMethod}</strong>
                            <span className={cn(
                                "text-[12px] font-extrabold",
                                order.paymentStatus === 'paid' ? "text-emerald-600" : "text-amber-600"
                            )}>
                                {order.paymentStatus === 'paid' ? 'Pago' : 'A receber'}
                            </span>
                        </div>
                        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                            <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-dark-400">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff3ea] text-[#f97316]">
                                    <FaClock size={12} />
                                </span>
                                Entrada
                            </span>
                            <strong className="mt-3 block text-[14px] text-dark-950">{order.createdAt}</strong>
                            <span className="text-[12px] font-semibold text-dark-500">Status operacional</span>
                        </div>
                    </section>

                    <section className={cn(
                        "mt-4 rounded-lg border p-4 shadow-sm transition-colors",
                        paymentIsPaid
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-amber-200 bg-white"
                    )}>
                        <div className="flex items-center justify-between gap-5">
                            <div className="flex min-w-0 items-start gap-3">
                                <span className={cn(
                                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                    paymentIsPaid ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700"
                                )}>
                                    {paymentIsPaid ? <IoCheckmarkCircle size={22} /> : <FaCreditCard size={16} />}
                                </span>
                                <div className="min-w-0">
                                    <span className={cn(
                                        "text-[10px] font-extrabold uppercase",
                                        paymentIsPaid ? "text-emerald-700" : "text-amber-700"
                                    )}>
                                        Controle financeiro
                                    </span>
                                    <h3 className="text-[16px] font-extrabold text-dark-950">
                                        {paymentIsPaid ? 'Pagamento confirmado' : 'Marcar pedido como pago'}
                                    </h3>
                                    <p className="mt-1 max-w-[620px] text-[12px] font-semibold leading-5 text-dark-600">
                                        Use este campo quando o cliente escolheu pagar na entrega, mas enviou Pix pelo WhatsApp ou deixou pago no estabelecimento.
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-dark-600 shadow-sm">
                                            Forma informada: {order.paymentMethod}
                                        </span>
                                        <span className={cn(
                                            "rounded-full px-3 py-1 text-[11px] font-extrabold shadow-sm",
                                            paymentIsPaid ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-700"
                                        )}>
                                            {paymentIsPaid ? 'Não cobrar na retirada' : 'Ainda precisa cobrar'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                                <PaymentStatusSwitch
                                    checked={paymentIsPaid}
                                    onCheckedChange={(checked) => (
                                        onPaymentStatusChange(order.id, checked ? 'paid' : 'pending')
                                    )}
                                />
                                <span className="text-right text-[10px] font-bold text-dark-400">
                                    Atualiza o card no kanban
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
                        <header className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-5 py-4">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-[#f97316]">Conferência</span>
                                <h3 className="text-[16px] font-extrabold text-dark-950">Itens do pedido</h3>
                                <span className="text-[12px] font-semibold text-dark-500">
                                    {order.items.length} linhas, {totalItems} itens no total
                                </span>
                            </div>
                            <span className="shrink-0 rounded-full bg-[#fff3ea] px-4 py-2 text-[12px] font-extrabold text-[#f97316]">
                                Total {formatCurrency(order.total)}
                            </span>
                        </header>

                        <div className="divide-y divide-neutral-100 bg-white">
                            {order.items.map((item) => (
                                <div key={`${order.id}-${item.name}`} className="grid grid-cols-[44px_1fr_auto] items-start gap-3 px-5 py-3.5">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff3ea] text-[12px] font-extrabold text-[#f97316]">
                                        {item.quantity}x
                                    </span>
                                    <div className="min-w-0 pt-0.5">
                                        <strong className="block truncate text-[14px] font-extrabold text-dark-950">{item.name}</strong>
                                        <span className="mt-1 block text-[12px] font-semibold text-dark-500">
                                            {item.note || 'Sem observação para este item'}
                                        </span>
                                    </div>
                                    <span className="mt-1 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-extrabold text-dark-500">
                                        Conferir
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mt-4 grid gap-3 xl:grid-cols-[1fr_260px]">
                        <div className="rounded-lg border border-[#ffd6b5] bg-[#fff8f2] p-4">
                            <h3 className="text-[14px] font-extrabold text-dark-950">Observações da operação</h3>
                            <p className="mt-1 text-[12px] leading-5 text-dark-600">
                                Pedido agendado para retirada. Confirme disponibilidade, horário e forma de pagamento antes de avançar o status.
                            </p>
                        </div>
                        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                            <span className="text-[10px] font-extrabold uppercase text-dark-400">Próxima ação sugerida</span>
                            <strong className="mt-2 block text-[14px] font-extrabold text-dark-950">
                                {nextStatus ? getActionLabel(order.status) : 'Pedido pronto para finalizar'}
                            </strong>
                            <p className="mt-1 text-[12px] font-semibold leading-5 text-dark-500">
                                Use o kanban para avançar o status ou edite o pedido quando precisar corrigir algum dado.
                            </p>
                        </div>
                    </section>
                </div>

                <footer className="shrink-0 border-t border-neutral-200 bg-white px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <span className="block text-[10px] font-extrabold uppercase text-dark-400">Ações do pedido</span>
                            <span className="block truncate text-[12px] font-semibold text-dark-500">
                                Remova, edite ou entre em contato com o cliente sem sair da operação.
                            </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onRemove(order.id)}
                                className="h-10 gap-2 border-red-200 bg-red-50 px-4 text-[13px] font-extrabold text-red-600 hover:bg-red-100"
                            >
                                <FaTrashCan size={13} />
                                Cancelar pedido
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 gap-2 border-neutral-200 bg-white px-4 text-[13px] font-extrabold text-dark-700 hover:bg-neutral-50"
                            >
                                <FaPhone size={13} />
                                <a href={`https://wa.me/${order.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer">Contatar cliente</a>
                            </Button>
                            <Button
                                type="button"
                                disabled={order.status!=='ready'}
                                onClick={()=>onStatusChange(order.id,'completed' as OrderStatus)}
                                className="h-10 gap-2 bg-[#f97316] px-4 text-[13px] font-extrabold text-white shadow-sm hover:bg-[#ea6409]"
                            >
                                <FaPenToSquare size={13} />
                                Finalizar pedido
                            </Button>
                        </div>
                    </div>
                </footer>
            </section>
        </div>
    );
}

function ScheduledOrderCard({
    order,
    isActive,
    onOpenDetails,
}: {
    order: ScheduledOrder;
    isActive: boolean;
    onOpenDetails: (order: ScheduledOrder) => void;
}) {
    const visibleItems = order.items.slice(0, 3);
    const remainingItems = order.items.length - visibleItems.length;

    return (
        <button
            type="button"
            onClick={() => onOpenDetails(order)}
            className={cn(
                "group w-full rounded-lg border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#f97316]/45 hover:shadow-md",
                isActive ? "border-[#f97316] bg-[#fff8f2] ring-2 ring-[#f97316]/15" : "border-neutral-200"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-[#111111] px-2 py-0.5 text-[10px] font-extrabold text-white">
                            #{order.id}
                        </span>
                        <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                            order.paymentStatus === 'paid'
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                        )}>
                            {order.paymentStatus === 'paid' ? 'Pago' : 'A receber'}
                        </span>
                    </div>
                    <h3 className="mt-2 truncate text-[15px] font-extrabold leading-5 text-dark-950">
                        {order.customer}
                    </h3>
                    <span className="block text-[12px] font-semibold text-dark-500">{order.phone}</span>
                </div>
                <strong className="shrink-0 text-[15px] font-extrabold text-dark-950">
                    {formatCurrency(order.total)}
                </strong>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-dark-600">
                <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-[#fff3ea] px-2 py-1.5 text-[#f97316]">
                    <FaCalendarDays size={12} />
                    <span className="truncate">{order.scheduledDateLabel}</span>
                </div>
                <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-[#f4f6f8] px-2 py-1.5">
                    <FaClock size={12} className="text-[#f97316]" />
                    <span className="truncate">{order.scheduledWindow}</span>
                </div>
            </div>

            <div className="mt-3 rounded-md border border-neutral-200 bg-[#fbfbfb] px-3 py-2">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-4">
                    {visibleItems.map((item) => (
                        <div key={`${order.id}-${item.name}`} className="flex min-w-0 max-w-full gap-1">
                            <strong className="shrink-0 text-[#f97316]">{item.quantity}x</strong>
                            <span className="truncate font-bold text-dark-800">{item.name}</span>
                        </div>
                    ))}
                    {remainingItems > 0 && (
                        <span className="rounded-full bg-white px-2 text-[10px] font-extrabold text-[#f97316]">
                            +{remainingItems}
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[11px] font-semibold text-dark-500">
                    Agendado em {order.placedAt}
                </span>
                <span className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold",
                    isActive
                        ? "bg-[#f97316] text-white"
                        : "bg-[#f3f5f8] text-dark-600 group-hover:bg-[#fff3ea] group-hover:text-[#f97316]"
                )}>
                    {isActive ? 'Selecionado' : 'Ver detalhes'}
                </span>
            </div>
        </button>
    );
}

function ScheduledOrderDetailsPanel({
    order,
    onSendToProduction,
    onCancelOrder,
}: {
    order: ScheduledOrder | null;
    onSendToProduction: (orderId: string) => void;
    onCancelOrder: (orderId: string) => void;
}) {
    if (!order) {
        return (
            <aside className="sticky top-[78px] h-[calc(100vh-92px)] overflow-hidden rounded-md bg-white shadow-sm">
                <div className="flex h-full items-center justify-center p-8 text-center">
                    <div className="max-w-[360px]">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff3ea] text-[#f97316]">
                            <FaCalendarDays size={22} />
                        </span>
                        <h3 className="mt-4 text-[20px] font-extrabold text-dark-950">Selecione um pedido</h3>
                        <p className="mt-2 text-[13px] font-semibold leading-5 text-dark-500">
                            Clique em um card da coluna para revisar o agendamento e enviar para produção no momento certo.
                        </p>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className="sticky top-[78px] flex h-[calc(100vh-92px)] min-w-0 flex-col overflow-hidden rounded-md bg-white text-dark-900 shadow-sm">
            <header className="shrink-0 border-b border-neutral-200 bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#fff3ea] px-3 py-1 text-[11px] font-extrabold uppercase text-[#f97316]">
                                Pedido #{order.id}
                            </span>
                            <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-extrabold uppercase text-[#2f6fb7]">
                                Pedido agendado
                            </span>
                        </div>
                        <h2 className="mt-3 truncate text-[24px] font-extrabold leading-7 text-dark-950">
                            {order.customer}
                        </h2>
                        <span className="mt-1 block text-[13px] font-semibold text-dark-500">{order.phone}</span>
                    </div>
                    <div className="shrink-0 text-right">
                        <span className="block text-[10px] font-extrabold uppercase text-dark-400">Total</span>
                        <strong className="block text-[25px] font-extrabold leading-8 text-dark-950">
                            {formatCurrency(order.total)}
                        </strong>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        onClick={() => onSendToProduction(order.id)}
                        className="h-9 gap-2 bg-[#2f8df6] px-4 text-[13px] font-extrabold text-white shadow-sm hover:bg-[#1f7ce0]"
                    >
                        Enviar para produção
                        <IoCheckmarkCircle size={16} />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 gap-2 border-neutral-200 bg-white px-3 text-[12px] font-extrabold text-dark-700 hover:bg-neutral-50"
                    >
                        <FaPhone size={12} />
                        <a href={`https://wa.me/${order.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer">Contatar</a>
                    </Button>
                    <EditarAgendamento id={order.id}/>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onCancelOrder(order.id)}
                        className="h-9 gap-2 border-red-200 bg-white px-3 text-[12px] font-extrabold text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                        <FaTrashCan size={12} />
                        Cancelar pedido
                    </Button>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4">
                <section className="rounded-md border border-neutral-200 bg-[#fafafa]">
                    <div className="flex items-start justify-between gap-5">
                        <div className="flex min-w-0 flex-1 items-center gap-3 border-r border-neutral-200 px-4 py-3">
                            <FaCalendarDays className="shrink-0 text-dark-500" size={22} />
                            <div className="min-w-0">
                                <strong className="block truncate text-[14px] text-dark-800">
                                    {order.scheduledDateLabel}, retirada entre {order.scheduledWindow}
                                </strong>
                                <span className="text-[12px] font-semibold text-dark-500">Agendado em {order.placedAt}</span>
                            </div>
                        </div>
                        <div className="shrink-0 px-4 py-3 text-right">
                            <span className="block text-[11px] font-bold text-dark-400">Status</span>
                            <strong className="text-[13px] font-extrabold text-[#2f8df6]">Aceito</strong>
                        </div>
                    </div>
                </section>

                <section className="mt-5">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[15px] font-extrabold text-dark-500">Itens do pedido</h3>
                        <div className="h-px flex-1 bg-neutral-200" />
                    </div>

                    <div className="mt-3 divide-y divide-neutral-200">
                        {order.items.map((item) => (
                            <div key={`${order.id}-${item.name}`} className="flex items-start justify-between gap-4 py-3">
                                <div className="min-w-0">
                                    <strong className="block text-[14px] font-extrabold text-dark-800">
                                        {item.quantity}x {item.name}
                                    </strong>
                                    {item.note && (
                                        <span className="mt-1 block text-[12px] italic text-dark-500">{item.note}</span>
                                    )}
                                </div>
                                <span className="shrink-0 text-[13px] font-extrabold text-dark-700">
                                    {item.quantity > 1 ? `${item.quantity} un.` : ''}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
                        <div className="flex items-center justify-between text-[13px] font-semibold text-dark-700">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[13px] font-semibold text-dark-700">
                            <span>{order.channel==='delivery'?'Taxa de entrega':'Taxa de retirada'}</span>
                            <span>{formatCurrency(order.deliveryFee)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-neutral-200 bg-[#fafafa] px-3 py-2 text-[18px] font-extrabold text-dark-900">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid gap-2 xl:grid-cols-3">
                    <div className="rounded-md border border-neutral-200 bg-white p-4">
                        <span className="flex items-center gap-2 text-[12px] font-bold text-dark-500">
                            <FaUser size={14} />
                            Cliente
                        </span>
                        <strong className="mt-2 block text-[14px] text-dark-800">{order.customer}</strong>
                    </div>
                    <div className="rounded-md border border-neutral-200 bg-white p-4">
                        <span className="flex items-center gap-2 text-[12px] font-bold text-dark-500">
                            <FaStore size={14} />
                            {getChannelLabel(order.channel)}
                        </span>
                        <strong className="mt-2 block text-[14px] text-dark-800">{order.address}</strong>
                    </div>
                    <div className="rounded-md border border-neutral-200 bg-white p-4">
                        <span className="flex items-center gap-2 text-[12px] font-bold text-dark-500">
                            <FaCreditCard size={14} />
                            {order.paymentMethod}
                        </span>
                        <strong className={cn(
                            "mt-2 block text-[14px]",
                            order.paymentStatus === 'paid' ? "text-emerald-600" : "text-amber-600"
                        )}>
                            {order.paymentStatus === 'paid' ? 'Pago' : 'A receber'}
                        </strong>
                    </div>
                </section>

                <section className="mt-3 rounded-md border border-[#ffd6b5] bg-[#fff8f2] p-4">
                    <span className="text-[10px] font-extrabold uppercase text-[#f97316]">Observação do agendamento</span>
                    <p className="mt-1 text-[13px] font-semibold leading-5 text-dark-700">{order.scheduledNote}</p>
                </section>
            </div>
        </aside>
    );
}

function ScheduledOrdersView({
    scheduledOrders,
    searchTerm,
    selectedDay,
    selectedDate,
    selectedOrder,
    onSearchChange,
    onDayChange,
    onDateChange,
    onOpenDetails,
    onSendToProduction,
    onSendDayToProduction,
    onCancelOrder,
}: {
    scheduledOrders: ScheduledOrder[];
    searchTerm: string;
    selectedDay: ScheduledDay;
    selectedDate: string;
    selectedOrder: ScheduledOrder | null;
    onSearchChange: (value: string) => void;
    onDayChange: (day: ScheduledDay) => void;
    onDateChange: (date: string) => void;
    onOpenDetails: (order: ScheduledOrder) => void;
    onSendToProduction: (orderId: string) => void;
    onSendDayToProduction: (day: ScheduledOrder['scheduledDay'], date?: string) => void;
    onCancelOrder: (orderId: string) => void;
}) {
    const [dateFilterOpen, setDateFilterOpen] = React.useState(false);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const selectedCalendarDate = React.useMemo(() => parseLocalDate(selectedDate), [selectedDate]);
    const filteredOrders = scheduledOrders.filter((order) => {
        const matchesDay = order.scheduledDay === selectedDay;
        const matchesDate = !selectedDate || order.scheduledDate === selectedDate;
        const matchesSearch = !normalizedSearch
            || order.customer.toLowerCase().includes(normalizedSearch)
            || order.id.includes(normalizedSearch)
            || order.phone.includes(normalizedSearch)
            || order.items.some((item) => item.name.toLowerCase().includes(normalizedSearch));

        return matchesDay && matchesDate && matchesSearch;
    });
    const saturdayOrders = filteredOrders.filter((order) => order.scheduledDay === 'saturday');
    const sundayOrders = filteredOrders.filter((order) => order.scheduledDay === 'sunday');
    const saturdayTotal = scheduledOrders.filter((order) => (
        order.scheduledDay === 'saturday' && (!selectedDate || order.scheduledDate === selectedDate)
    )).length;
    const sundayTotal = scheduledOrders.filter((order) => (
        order.scheduledDay === 'sunday' && (!selectedDate || order.scheduledDate === selectedDate)
    )).length;
    const dayGroups = [
        {
            day: 'saturday' as const,
            title: 'Sábado',
            subtitle: 'Pedidos para o primeiro dia de atendimento',
            orders: saturdayOrders,
            totalDayOrders: saturdayTotal,
        },
        {
            day: 'sunday' as const,
            title: 'Domingo',
            subtitle: 'Pedidos para o segundo dia de atendimento',
            orders: sundayOrders,
            totalDayOrders: sundayTotal,
        },
    ].filter((group) => group.day === selectedDay);
    const selectedOrderIsVisible = selectedOrder
        ? filteredOrders.some((order) => order.id === selectedOrder.id)
        : false;
    const activeOrder = selectedOrderIsVisible ? selectedOrder : filteredOrders[0] ?? null;

    return (
        <main className="min-h-[calc(100vh-61px)] p-3">
            <section className="rounded-md bg-white p-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="flex shrink-0 items-center gap-1.5">
                        {[
                            { value: 'saturday' as const, label: 'Sábado' },
                            { value: 'sunday' as const, label: 'Domingo' },
                        ].map((day) => (
                            <button
                                key={day.value}
                                type="button"
                                onClick={() => onDayChange(day.value)}
                                className={cn(
                                    "h-8 rounded-md px-3 text-[12px] font-extrabold transition-colors",
                                    selectedDay === day.value
                                        ? "bg-[#f97316] text-white"
                                        : "bg-[#f3f5f8] text-dark-600 hover:bg-[#e9edf3]"
                                )}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-[172px] shrink-0">
                        {dateFilterOpen && (
                            <button
                                type="button"
                                className="fixed inset-0 z-20 cursor-default"
                                aria-label="Fechar calendário"
                                onClick={() => setDateFilterOpen(false)}
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => setDateFilterOpen((open) => !open)}
                            className={cn(
                                "flex h-8 w-full items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 pr-8 text-left text-[12px] font-bold shadow-none transition hover:bg-neutral-50",
                                selectedDate ? "text-dark-900" : "text-dark-500",
                                dateFilterOpen && "border-[#f97316] ring-2 ring-[#f97316]/15"
                            )}
                        >
                            <FaCalendarDays className="shrink-0 text-dark-400" size={14} />
                            <span className="truncate">{formatDisplayDate(selectedDate)}</span>
                        </button>
                        {selectedDate && (
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onDateChange('');
                                    setDateFilterOpen(false);
                                }}
                                className="absolute right-1.5 top-1/2 z-30 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#f3f5f8] text-dark-500 transition hover:bg-[#fff3ea] hover:text-[#f97316]"
                                aria-label="Limpar filtro de data"
                            >
                                <FaXmark size={10} />
                            </button>
                        )}
                        {dateFilterOpen && (
                            <div className="absolute left-0 top-[calc(100%+8px)] z-30 rounded-md border border-neutral-200 bg-white p-2 shadow-xl">
                                <Calendar
                                    mode="single"
                                    selected={selectedCalendarDate}
                                    onSelect={(date) => {
                                        if (!date) {
                                            return;
                                        }

                                        onDateChange(formatDateToISO(date));
                                        setDateFilterOpen(false);
                                    }}
                                    locale={ptBR}
                                    initialFocus
                                    className="p-0"
                                    classNames={{
                                        caption_label: "text-[13px] font-extrabold text-dark-900",
                                        head_cell: "w-9 rounded-md text-[11px] font-bold text-dark-400",
                                        day: "h-9 w-9 p-0 text-[12px] font-semibold",
                                        day_selected: "bg-[#f97316] text-white hover:bg-[#ea6409] hover:text-white focus:bg-[#ea6409] focus:text-white",
                                        day_today: "bg-[#fff3ea] text-[#f97316]",
                                    }}
                                />
                                <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2">
                                    <span className="text-[11px] font-semibold text-dark-500">
                                        {selectedDate ? formatDisplayDate(selectedDate) : 'Nenhuma data'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onDateChange('');
                                            setDateFilterOpen(false);
                                        }}
                                        className="h-7 rounded-md px-2 text-[11px] font-extrabold text-[#f97316] transition hover:bg-[#fff3ea]"
                                    >
                                        Limpar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative min-w-[320px] flex-1">
                        <IoSearch className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-dark-400" size={16} />
                        <Input
                            value={searchTerm}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Busque por cliente, item ou pedido agendado"
                            className="h-8 !rounded-md !border-neutral-200 !bg-white pl-9 text-[12px] font-semibold !text-dark-900 shadow-none outline-none placeholder:!text-dark-400 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900 dark:placeholder:!text-dark-400"
                        />
                    </div>
                </div>
            </section>

            <section className="mt-2.5 grid gap-3 xl:grid-cols-[minmax(380px,470px)_minmax(0,1fr)]">
                <div className="space-y-3">
                    {dayGroups.map((group) => (
                        <div key={group.day} className="overflow-hidden rounded-md bg-white shadow-sm">
                            <header className={cn(
                                "flex items-center justify-between gap-3 px-4 py-3 text-white",
                                group.day === 'saturday' ? "bg-[#143d60]" : "bg-[#57894b]"
                            )}>
                                <div className="min-w-0">
                                    <h3 className="text-[18px] font-extrabold leading-6">{group.title}</h3>
                                    <span className="text-[11px] font-semibold text-white/75">{group.subtitle}</span>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-extrabold">
                                        {group.totalDayOrders}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={group.totalDayOrders === 0}
                                        onClick={() => onSendDayToProduction(group.day, selectedDate || undefined)}
                                        className="h-8 rounded-md bg-white px-3 text-[11px] font-extrabold text-dark-900 shadow-sm transition hover:bg-[#fff3ea] hover:text-[#f97316] disabled:cursor-not-allowed disabled:opacity-45"
                                    >
                                        Enviar todos
                                    </button>
                                </div>
                            </header>

                            <div className={cn(
                                "overflow-y-auto bg-[#f3f5f8] p-3 [scrollbar-color:rgba(17,17,17,0.28)_transparent] [scrollbar-width:thin]",
                                dayGroups.length === 1 ? "h-[680px]" : "max-h-[380px]"
                            )}>
                                {group.orders.length > 0 ? (
                                    <div className="grid gap-2">
                                        {group.orders.map((order) => (
                                            <ScheduledOrderCard
                                                key={order.id}
                                                order={order}
                                                isActive={activeOrder?.id === order.id}
                                                onOpenDetails={onOpenDetails}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white/70 p-6 text-center">
                                        <p className="max-w-[320px] text-[13px] font-bold text-dark-500">
                                            Nenhum pedido agendado encontrado para este filtro.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <ScheduledOrderDetailsPanel
                    order={activeOrder}
                    onSendToProduction={onSendToProduction}
                    onCancelOrder={onCancelOrder}
                />
            </section>
        </main>
    );
}

function OrderCard({
    order,
    onMove,
    onOpenDetails,
    isDragging,
    onDragStart,
    onDragEnd,
}: {
    order: AdminOrder;
    onMove: (orderId: string, status: OrderStatus) => void;
    onOpenDetails: (order: AdminOrder) => void;
    isDragging: boolean;
    onDragStart: (event: React.DragEvent<HTMLElement>, orderId: string) => void;
    onDragEnd: () => void;
}) {
    const ChannelIcon = getChannelIcon(order.channel);
    const nextStatus = getNextStatus(order.status);
    const visibleItems = order.items.slice(0, 2);
    const remainingItems = order.items.length - visibleItems.length;
    const pickupWindow = getPickupWindowParts(order.pickupWindow);
    const paymentMethodLabel = getCompactPaymentMethodLabel(order.paymentMethod);

    return (
        <article
            draggable
            onDragStart={(event) => onDragStart(event, order.id)}
            onDragEnd={onDragEnd}
            className={cn(
                "cursor-grab rounded-md border border-black/5 bg-white p-2 shadow-sm transition active:cursor-grabbing",
                isDragging && "scale-[0.99] opacity-55 ring-2 ring-[#f97316]/45"
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                    <span className="shrink-0 rounded-full bg-[#111111] px-2 py-0.5 text-[9px] font-extrabold text-white">
                        #{order.id}
                    </span>
                    <span className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold",
                        order.paymentStatus === 'paid'
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                    )}>
                        {order.paymentStatus === 'paid' ? 'Pago' : 'A receber'}
                    </span>
                </div>
                <strong className="shrink-0 text-[12px] text-dark-900">{formatCurrency(order.total)}</strong>
            </div>

            <div className="mt-1.5 flex items-end justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="line-clamp-1 text-[12px] font-extrabold leading-4 text-dark-900">
                        {order.customer}
                    </h3>
                    <span className="block truncate text-[10px] font-semibold leading-3 text-dark-500">{order.phone}</span>
                </div>
                <span className="shrink-0 rounded-md bg-[#f7f7f7] px-2 py-1 text-[10px] font-extrabold text-dark-700">
                    {pickupWindow.window}
                </span>
            </div>

            <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px] font-semibold text-dark-500">
                <div className="flex items-center gap-1 rounded-md bg-[#f7f7f7] px-1.5 py-1">
                    <ChannelIcon className="text-[#f97316]" size={11} />
                    {getChannelLabel(order.channel)}
                </div>
                <div className="flex items-center gap-1 rounded-md bg-[#f7f7f7] px-1.5 py-1">
                    <FaClock className="text-[#f97316]" size={11} />
                    {order.createdAt}
                </div>
            </div>

            <div className="mt-1.5 rounded-md border border-neutral-200 bg-[#fbfbfb] px-2 py-1.5">
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] leading-[14px]">
                    {visibleItems.map((item) => (
                        <div key={`${order.id}-${item.name}`} className="flex min-w-0 max-w-full gap-1">
                            <strong className="shrink-0 text-[#f97316]">{item.quantity}x</strong>
                            <span className="truncate font-bold text-dark-800">{item.name}</span>
                        </div>
                    ))}
                    {remainingItems > 0 && (
                        <span className="shrink-0 rounded-full bg-white px-1.5 text-[9px] font-extrabold text-[#f97316]">
                            +{remainingItems}
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-semibold text-dark-600">
                {pickupWindow.day && (
                    <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-[#fff7ed] px-1.5 py-1 text-[#9a3412]">
                        <FaCalendarDays className="shrink-0 text-[#f97316]" size={11} />
                        <span className="truncate">{pickupWindow.day}</span>
                    </div>
                )}
                <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-[#f7f7f7] px-1.5 py-1">
                    <FaReceipt className="shrink-0 text-[#f97316]" size={11} />
                    <span className="truncate">{paymentMethodLabel}</span>
                </div>
            </div>

            <div className="mt-2 grid grid-cols-[1fr_auto] gap-1.5">
                <Button
                    type="button"
                    disabled={!nextStatus}
                    onClick={() => nextStatus && onMove(order.id, nextStatus)}
                    className={cn(
                        "h-7 justify-start gap-1.5 px-2 text-[10px] font-extrabold",
                        order.status === 'ready'
                            ? "bg-[#57894b] text-white hover:bg-[#4d7c43]"
                            : "bg-[#f97316] text-white hover:bg-[#ea6409]"
                    )}
                >
                    <IoCheckmarkCircle size={14} />
                    {getActionLabel(order.status)}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenDetails(order)}
                    className="h-7 px-2 text-[10px] font-extrabold"
                >
                    Detalhes
                </Button>
            </div>
        </article>
    );
}

function KanbanColumn({
    column,
    orders,
    onMove,
    onOpenDetails,
    autoAcceptOrders,
    onAutoAcceptChange,
    draggedOrderId,
    dragOverColumn,
    onCardDragStart,
    onCardDragEnd,
    onDragOverColumn,
    onDropOrder,
}: {
    column: KanbanColumn;
    orders: AdminOrder[];
    onMove: (orderId: string, status: OrderStatus) => void;
    onOpenDetails: (order: AdminOrder) => void;
    autoAcceptOrders: boolean;
    onAutoAcceptChange: (checked: boolean) => void;
    draggedOrderId: string | null;
    dragOverColumn: OrderStatus | null;
    onCardDragStart: (event: React.DragEvent<HTMLElement>, orderId: string) => void;
    onCardDragEnd: () => void;
    onDragOverColumn: (status: OrderStatus) => void;
    onDropOrder: (orderId: string | null, status: OrderStatus) => void;
}) {
    return (
        <section
            onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                onDragOverColumn(column.id);
            }}
            onDrop={(event) => {
                event.preventDefault();
                const droppedOrderId = event.dataTransfer.getData('text/plain') || draggedOrderId;
                onDropOrder(droppedOrderId, column.id);
            }}
            className={cn(
                "flex h-[860px] min-w-[290px] flex-1 overflow-hidden shadow-sm transition",
                dragOverColumn === column.id && "ring-2 ring-[#f97316]/45 ring-offset-2"
            )}
        >
            <div className="flex min-w-0 flex-1 flex-col">
                <header className={cn("flex min-h-12 items-center justify-between px-3 py-2 text-white", column.headerClass)}>
                    <div className="min-w-0">
                        <h2 className="truncate text-[15px] font-extrabold leading-5">{column.title}</h2>
                        <span className="block text-[10px] font-semibold leading-4 text-white/75">{column.description}</span>
                    </div>
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-extrabold">{orders.length}</span>
                </header>

                {column.id === 'analysis' && (
                    <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-white px-3 py-2">
                        <div className="min-w-0">
                            <strong className="block truncate text-[11px] font-extrabold text-dark-900">
                                Aceitar pedidos automaticamente
                            </strong>
                            <span className="block truncate text-[10px] font-semibold text-dark-500">
                                Novos pedidos entram direto em produção
                            </span>
                        </div>
                        <AutoAcceptSwitch
                            checked={autoAcceptOrders}
                            onCheckedChange={onAutoAcceptChange}
                        />
                    </div>
                )}

                <div className={cn("min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-color:rgba(17,17,17,0.28)_transparent] [scrollbar-width:thin]", column.bodyClass)}>
                    {orders.length > 0 ? (
                        <div className="space-y-2">
                            {orders.map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onMove={onMove}
                                    onOpenDetails={onOpenDetails}
                                    isDragging={draggedOrderId === order.id}
                                    onDragStart={onCardDragStart}
                                    onDragEnd={onCardDragEnd}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[260px] items-center justify-center px-6 text-center">
                            <p className="max-w-[220px] text-[12px] font-extrabold leading-4 text-white/85">
                                {column.emptyText}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function normalizeReportType(value: string | null): ReportType {
    return reportOptions.some((option) => option.value === value) ? value as ReportType : 'general';
}

function AdminOrdersDashboardContent() {
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const isScheduledView = currentView === 'scheduled';
    const isReportsView = currentView === 'reports';
    const reportType = normalizeReportType(searchParams.get('report'));
    const queryClient=useQueryClient();
    const operation=useOperacao();
    const live=useQuery<PedidoAPI[]>({queryKey:['operacao'],queryFn:async()=>{let page=1,items:PedidoAPI[]=[];for(;;){const {data}=await api.get('/admin/pedidos',{params:{page,limit:100,status:'active'}});items.push(...data.items);if(items.length>=data.total)return items;page++;}},refetchInterval:10000});
    const mapped=(live.data??[]).map(p=>{const dt=new Date(p.dataEntrega??p.created_at);return {id:String(p.id),customer:p.cliente?.nome||'Cliente',phone:p.cliente?.tel||'',status:p.status as OrderStatus,channel:(p.canal==='entrega'?'delivery':p.canal) as OrderChannel,pickupWindow:dt.toLocaleString('pt-BR'),createdAt:new Date(p.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),paymentMethod:p.formaPagamento??'',paymentStatus:p.pagamentoStatus as PaymentStatus,total:p.valorFinal,subtotal:p.valorTotalPedido,deliveryFee:(p as any).taxaEntrega??0,address:`${p.endereco?.rua??''}, ${p.endereco?.numero??''} — ${p.endereco?.bairro??''}`,items:p.itens.map(i=>({quantity:i.quantidade,name:i.produto.titulo,note:i.obs})),scheduledDay:(dt.getDay()===6?'saturday':'sunday') as ScheduledOrder['scheduledDay'],scheduledDate:dt.toLocaleDateString('en-CA'),scheduledDateLabel:dt.toLocaleDateString('pt-BR'),scheduledWindow:dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),scheduledNote:p.obs,placedAt:new Date(p.created_at).toLocaleString('pt-BR')};});
    const today=new Date().toLocaleDateString('en-CA');
    const scheduledOrders:ScheduledOrder[]=mapped.filter(p=>p.status==='analysis'&&p.scheduledDate>today);
    const orders:AdminOrder[]=mapped.filter(p=>!scheduledOrders.some(s=>s.id===p.id));
    const change=(id:string,status:string)=>operation.mutate({id,status});
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedChannel, setSelectedChannel] = React.useState<'all' | OrderChannel>('all');
    const [selectedProductFilter, setSelectedProductFilter] = React.useState<ProductFilter>('all');
    const [scheduledSearchTerm, setScheduledSearchTerm] = React.useState('');
    const [selectedScheduledDay, setSelectedScheduledDay] = React.useState<ScheduledDay>('saturday');
    const [selectedScheduledDate, setSelectedScheduledDate] = React.useState('');
    const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);
    const settings=useQuery<any[]>({queryKey:['configuracao'],queryFn:async()=>(await api.get('/configuracao')).data});
    const autoAcceptOrders=settings.data?.find(c=>c.chave==='AUTOACEITAR')?.valor==='true';
    const autoMutation=useMutation({mutationFn:async(value:boolean)=>api.put('/configuracao',{chave:'AUTOACEITAR',valor:String(value)}),onSuccess:()=>queryClient.invalidateQueries({queryKey:['configuracao']}),onError:mostrarErro});
    const setAutoAcceptOrders=(value:boolean)=>autoMutation.mutate(value);
    const [draggedOrderId, setDraggedOrderId] = React.useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = React.useState<OrderStatus | null>(null);
    const [selectedOrder, setSelectedOrder] = React.useState<AdminOrder | null>(null);
    const [selectedScheduledOrder, setSelectedScheduledOrder] = React.useState<ScheduledOrder | null>(null);

    const filteredOrders = React.useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const productFilter = productFilters.find((filter) => filter.value === selectedProductFilter);

        return orders.filter((order) => {
            const matchesSearch = !normalizedSearch
                || order.customer.toLowerCase().includes(normalizedSearch)
                || order.id.includes(normalizedSearch)
                || order.phone.includes(normalizedSearch)
                || order.items.some((item) => item.name.toLowerCase().includes(normalizedSearch));
            const matchesChannel = selectedChannel === 'all' || order.channel === selectedChannel;
            const matchesProduct = !productFilter || order.items.some((item) => (
                item.name.toLowerCase().includes(productFilter.match)
            ));

            return matchesSearch && matchesChannel && matchesProduct;
        });
    }, [orders, searchTerm, selectedChannel, selectedProductFilter]);

    const productHighlights = React.useMemo(() => {
        return productFilters.map((filter) => ({
            ...filter,
            quantity: countProductQuantity(orders, filter.match),
        }));
    }, [orders]);

    const moveOrder=(id:string,status:OrderStatus)=>change(id,status);
    const resetOrders=()=>{void live.refetch();setSelectedProductFilter('all');setSearchTerm('');setSelectedChannel('all');};
    const handleCardDragStart = (event: React.DragEvent<HTMLElement>, orderId: string) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', orderId);
        setDraggedOrderId(orderId);
    };

    const handleCardDragEnd = () => {
        setDraggedOrderId(null);
        setDragOverColumn(null);
    };

    const handleDropOrder=(id:string|null,status:OrderStatus)=>{if(id)change(id,status);handleCardDragEnd();};
    const handleRemoveOrder=(id:string)=>{change(id,'cancelled');setSelectedOrder(null);};
    const handlePaymentStatusChange=(id:string,paymentStatus:PaymentStatus)=>{if(paymentStatus==='paid')operation.mutate({id,payment:true});};
    const handleSendScheduledToProduction=(id:string)=>{change(id,'production');setSelectedScheduledOrder(null);};
    const handleSendScheduledDayToProduction=(day:ScheduledOrder['scheduledDay'],date?:string)=>{for(const p of scheduledOrders.filter(p=>p.scheduledDay===day&&(!date||p.scheduledDate===date)))change(p.id,'production');};
    const handleCancelScheduledOrder=(id:string)=>{change(id,'cancelled');setSelectedScheduledOrder(null);};

    const handleScheduledDayChange = (day: ScheduledDay) => {
        setSelectedScheduledDay(day);
        setSelectedScheduledDate('');
        setSelectedScheduledOrder(null);
    };

    const handleScheduledDateChange = (date: string) => {
        setSelectedScheduledDate(date);
        setSelectedScheduledOrder(null);

        const matchingOrder = scheduledOrders.find((order) => order.scheduledDate === date);

        if (matchingOrder) {
            setSelectedScheduledDay(matchingOrder.scheduledDay);
        }
    };

    if (isScheduledView) {
        return (
            <>
                <ScheduledOrdersView
                    scheduledOrders={scheduledOrders}
                    searchTerm={scheduledSearchTerm}
                    selectedDay={selectedScheduledDay}
                    selectedDate={selectedScheduledDate}
                    selectedOrder={selectedScheduledOrder}
                    onSearchChange={setScheduledSearchTerm}
                    onDayChange={handleScheduledDayChange}
                    onDateChange={handleScheduledDateChange}
                    onOpenDetails={setSelectedScheduledOrder}
                    onSendToProduction={handleSendScheduledToProduction}
                    onSendDayToProduction={handleSendScheduledDayToProduction}
                    onCancelOrder={handleCancelScheduledOrder}
                />
            </>
        );
    }

    if (isReportsView) return <AdminReports type={reportType}/>;
    if(live.isPending)return <main className="p-6">Carregando pedidos…</main>;
    if(live.isError)return <main className="p-6"><button onClick={()=>live.refetch()}>Falha ao carregar pedidos. Tentar novamente</button></main>;

    return (
        <main className="min-h-[calc(100vh-61px)] p-3">
            <EstornosPendentes />
            <ConciliacoesPendentes />
            <section className="shrink-0 rounded-md bg-white p-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase text-[#f97316]">Itens de maior giro</span>
                        <h2 className="truncate text-[15px] font-extrabold leading-5 text-dark-900">
                            Controle rápido dos produtos principais
                        </h2>
                    </div>
                    {selectedProductFilter !== 'all' && (
                        <button
                            type="button"
                            onClick={() => setSelectedProductFilter('all')}
                            className="h-8 rounded-md border px-3 text-[11px] font-extrabold text-dark-600 hover:bg-[#f7f7f7]"
                        >
                            Limpar item
                        </button>
                    )}
                </div>

                <div className="mt-2 grid gap-2 md:grid-cols-3">
                    {productHighlights.map((product) => {
                        const active = selectedProductFilter === product.value;

                        return (
                            <button
                                key={product.value}
                                type="button"
                                onClick={() => setSelectedProductFilter(active ? 'all' : product.value)}
                                className={cn(
                                    "flex items-center justify-between rounded-md border px-3 py-2 text-left transition",
                                    active
                                        ? "border-[#f97316] bg-[#fff3ea] shadow-sm"
                                        : "border-neutral-200 bg-[#fafafa] hover:border-[#f97316]/50 hover:bg-white"
                                )}
                            >
                                <div className="min-w-0">
                                    <strong className="block truncate text-[12px] font-extrabold text-dark-900">{product.label}</strong>
                                    <span className="mt-0.5 block text-[10px] font-semibold text-dark-500">
                                        Clique para filtrar os pedidos
                                    </span>
                                </div>
                                <span className={cn(
                                    "ml-3 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                                    active ? "bg-[#f97316] text-white" : "bg-white text-[#f97316]"
                                )}>
                                    {product.quantity}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="mt-2.5 shrink-0 rounded-md bg-white p-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        {[
                            { value: 'all', label: 'Todos' },
                            { value: 'retirada', label: 'Retirada' },
                            { value: 'balcao', label: 'Balcão' },
                            { value: 'delivery', label: 'Delivery' },
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => setSelectedChannel(filter.value as 'all' | OrderChannel)}
                                className={cn(
                                    "h-8 rounded-md px-3 text-[12px] font-extrabold transition-colors",
                                    selectedChannel === filter.value
                                        ? "bg-[#2f8df6] text-white"
                                        : "bg-[#f3f5f8] text-dark-600 hover:bg-[#e9edf3]"
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative min-w-[320px] flex-1">
                        <IoSearch className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-dark-400" size={16} />
                        <Input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Busque por cliente, item ou pedido"
                            className="h-8 !rounded-md !border-neutral-200 !bg-white pl-9 text-[12px] font-semibold !text-dark-900 shadow-none outline-none placeholder:!text-dark-400 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900 dark:placeholder:!text-dark-400"
                        />
                    </div>

                    <div className="flex shrink-0 gap-1.5">
                        <div className="relative">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFilterMenuOpen((open) => !open)}
                                className={cn(
                                    "h-8 gap-1.5 border-neutral-200 px-3 text-[12px] font-extrabold shadow-none",
                                    selectedProductFilter !== 'all' && "border-[#f97316] bg-[#fff3ea] text-[#f97316] hover:bg-[#ffe8d6]"
                                )}
                            >
                                <FaFilter size={12} />
                                {selectedProductFilter === 'all'
                                    ? 'Filtros'
                                    : productFilters.find((filter) => filter.value === selectedProductFilter)?.label}
                            </Button>

                            {filterMenuOpen && (
                                <div className="absolute right-0 z-20 mt-2 w-[240px] rounded-md border bg-white p-2 shadow-xl">
                                    <div className="px-2 pb-2">
                                        <span className="text-[10px] font-extrabold uppercase text-dark-400">Filtrar por item</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedProductFilter('all');
                                            setFilterMenuOpen(false);
                                        }}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[12px] font-bold hover:bg-[#f7f7f7]",
                                            selectedProductFilter === 'all' && "bg-[#fff3ea] text-[#f97316]"
                                        )}
                                    >
                                        Todos os itens
                                    </button>
                                    {productFilters.map((filter) => (
                                        <button
                                            key={filter.value}
                                            type="button"
                                            onClick={() => {
                                                setSelectedProductFilter(filter.value);
                                                setFilterMenuOpen(false);
                                            }}
                                            className={cn(
                                                "mt-1 flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-[12px] font-bold hover:bg-[#f7f7f7]",
                                                selectedProductFilter === filter.value && "bg-[#fff3ea] text-[#f97316]"
                                            )}
                                        >
                                            <span>{filter.label}</span>
                                            <span className="rounded-full bg-[#f3f5f8] px-2 py-0.5 text-[10px] font-extrabold text-dark-500">
                                                {countProductQuantity(orders, filter.match)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button type="button" className="h-8 gap-1.5 bg-[#2f8df6] px-3 text-[12px] font-extrabold text-white hover:bg-[#1f7ce0]">
                            <FaPlus size={12} />
                            Novo pedido
                        </Button>
                        <Button type="button" variant="outline" onClick={resetOrders} className="h-8 w-8 border-neutral-200 px-0 shadow-none">
                            <FaRotateRight size={12} />
                        </Button>
                        <Button type="button" variant="outline" className="h-8 w-8 border-neutral-200 px-0 shadow-none">
                            <IoSettingsSharp size={14} />
                        </Button>
                    </div>
                </div>
            </section>

            <section className="mt-2.5 overflow-x-auto pb-4">
                <div className="flex min-w-[960px] items-start gap-0 overflow-hidden rounded-md">
                    {columns.map((column) => {
                        const columnOrders = filteredOrders.filter((order) => order.status === column.id);

                        return (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                orders={columnOrders}
                                onMove={moveOrder}
                                onOpenDetails={setSelectedOrder}
                                autoAcceptOrders={autoAcceptOrders}
                                onAutoAcceptChange={setAutoAcceptOrders}
                                draggedOrderId={draggedOrderId}
                                dragOverColumn={dragOverColumn}
                                onCardDragStart={handleCardDragStart}
                                onCardDragEnd={handleCardDragEnd}
                                onDragOverColumn={setDragOverColumn}
                                onDropOrder={handleDropOrder}
                            />
                        );
                    })}
                </div>
            </section>

            <OrderDetailsModal
                order={mapped.find(p=>p.id===selectedOrder?.id)??null}
                open={Boolean(selectedOrder)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedOrder(null);
                    }
                }}
                onStatusChange={change}
                onRemove={handleRemoveOrder}
                onPaymentStatusChange={handlePaymentStatusChange}
            />
        </main>
    );
}

export default function AdminOrdersDashboard() {
    return (
        <React.Suspense fallback={<main className="min-h-[calc(100vh-61px)] p-3" />}>
            <AdminOrdersDashboardContent />
        </React.Suspense>
    );
}
