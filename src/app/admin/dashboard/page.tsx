'use client'

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
import { localCoupons } from "@/data/coupons";
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

const reportChartConfig = {
    pedidos: {
        label: 'Pedidos',
        color: '#2f8df6',
    },
    faturamento: {
        label: 'Faturamento',
        color: '#f97316',
    },
    clientes: {
        label: 'Clientes',
        color: '#16a34a',
    },
    usos: {
        label: 'Usos',
        color: '#7c3aed',
    },
    valor: {
        label: 'Valor',
        color: '#f97316',
    },
} satisfies ChartConfig;

const customerNames = [
    'Mariana Souza',
    'Rafael Martins',
    'Carla Antunes',
    'João Pereira',
    'Fernanda Lima',
    'Bruno Henrique',
    'Patrícia Duarte',
    'Marcelo Zanatta',
    'Aline Rocha',
    'Eduardo Silva',
    'Camila Nunes',
    'Gustavo Meyer',
    'Larissa Campos',
    'Thiago Moreira',
    'Renata Alves',
    'Felipe Cardoso',
    'Débora Freitas',
    'André Bittencourt',
    'Sabrina Vieira',
    'Lucas Ferreira',
    'Natália Gomes',
    'Paulo César',
    'Bianca Costa',
    'Rodrigo Machado',
    'Vanessa Ribeiro',
    'Matheus Oliveira',
    'Juliana Farias',
    'Henrique Dias',
    'Priscila Teixeira',
    'Diego Amaral',
    'Tatiane Lopes',
    'Vinícius Barros',
    'Mônica Assis',
    'Alexandre Pires',
    'Helena Duarte',
    'Fábio Ramos',
    'Simone Batista',
    'Roberto Cruz',
    'Cláudia Neves',
    'Leandro Melo',
    'Isabela Prado',
    'Murilo Castro',
    'Eliane Martins',
    'César Almeida',
    'Kelly Santos',
    'Wagner Reis',
    'Luciana Araújo',
    'Otávio Mendes',
    'Cristiane Paiva',
    'Sérgio Lima',
    'Amanda Tavares',
    'Daniel Souza',
    'Marta Corrêa',
];

const orderTemplates: Array<Pick<AdminOrder, 'items' | 'total'>> = [
    {
        total: 98,
        items: [
            { quantity: 1, name: 'Frango assado recheado', note: 'cortar ao meio' },
            { quantity: 1, name: 'Maionese' },
            { quantity: 1, name: 'Coca-Cola 2L' },
        ],
    },
    {
        total: 75,
        items: [
            { quantity: 1, name: 'Frango assado sem recheio' },
            { quantity: 1, name: 'Arroz' },
        ],
    },
    {
        total: 124.9,
        items: [
            { quantity: 1, name: 'Costelinha BBQ Defumada' },
            { quantity: 1, name: 'Maionese' },
            { quantity: 1, name: 'Pureza 2L' },
        ],
    },
    {
        total: 115,
        items: [
            { quantity: 2, name: 'Meio frango assado' },
            { quantity: 1, name: 'Arroz' },
            { quantity: 2, name: 'Coca-Cola 2L' },
        ],
    },
    {
        total: 83,
        items: [
            { quantity: 1, name: 'Frango assado recheado' },
            { quantity: 1, name: 'Arroz' },
        ],
    },
    {
        total: 133.9,
        items: [
            { quantity: 1, name: 'Costelinha BBQ Defumada' },
            { quantity: 1, name: 'Arroz' },
            { quantity: 1, name: 'Coca-Cola 2L' },
        ],
    },
    {
        total: 93,
        items: [
            { quantity: 1, name: 'Frango assado sem recheio' },
            { quantity: 1, name: 'Maionese' },
            { quantity: 1, name: 'Pureza 2L' },
        ],
    },
    {
        total: 160,
        items: [
            { quantity: 2, name: 'Frango assado recheado' },
            { quantity: 2, name: 'Arroz' },
        ],
    },
    {
        total: 107.9,
        items: [
            { quantity: 1, name: 'Costelinha BBQ Defumada' },
            { quantity: 1, name: 'Maionese' },
        ],
    },
    {
        total: 50,
        items: [
            { quantity: 1, name: 'Meio frango assado' },
            { quantity: 1, name: 'Coca-Cola 2L' },
        ],
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

const pickupWindows = [
    'Hoje, 11:30 - 12:00',
    'Hoje, 12:00 - 12:30',
    'Hoje, 12:30 - 13:00',
    'Hoje, 13:00 - 13:30',
    'Sábado, 11:30 - 12:00',
    'Sábado, 12:00 - 12:30',
    'Domingo, 11:30 - 12:00',
    'Domingo, 12:30 - 13:00',
];

const paymentMethods = [
    'Pix online',
    'Cartão na retirada',
    'Dinheiro na retirada',
    'Cartão de crédito online',
];

const statusDistribution: OrderStatus[] = [
    ...Array.from({ length: 21 }, () => 'analysis' as const),
    ...Array.from({ length: 18 }, () => 'production' as const),
    ...Array.from({ length: 14 }, () => 'ready' as const),
];

const initialOrders: AdminOrder[] = Array.from({ length: 53 }, (_, index) => {
    const template = orderTemplates[index % orderTemplates.length];
    const paymentMethod = paymentMethods[index % paymentMethods.length];
    const channel: OrderChannel = index % 11 === 0 ? 'delivery' : index % 5 === 0 ? 'balcao' : 'retirada';

    return {
        id: String(1100 - index),
        customer: customerNames[index],
        phone: `(48) 99${String(1200 + index * 37).padStart(4, '0')}-${String(2200 + index * 29).padStart(4, '0')}`,
        status: statusDistribution[index],
        channel,
        pickupWindow: pickupWindows[index % pickupWindows.length],
        createdAt: `há ${4 + index * 3} min`,
        paymentMethod,
        paymentStatus: paymentMethod.includes('online') ? 'paid' : 'pending',
        total: template.total,
        items: template.items,
    };
});

const scheduledWindows = [
    '11:30 - 12:00',
    '12:00 - 12:30',
    '12:30 - 13:00',
    '13:00 - 13:30',
];

const scheduledNotes = [
    'Cliente pediu para deixar separado e avisar quando iniciar o preparo.',
    'Confirmar retirada 30 minutos antes pelo WhatsApp.',
    'Pedido recorrente de fim de semana. Manter padrão da casa.',
    'Cliente informou que pode chegar alguns minutos antes do horário.',
];

const initialScheduledOrders: ScheduledOrder[] = Array.from({ length: 16 }, (_, index) => {
    const template = orderTemplates[(index + 2) % orderTemplates.length];
    const paymentMethod = index % 3 === 0 ? 'Pix enviado pelo WhatsApp' : paymentMethods[(index + 1) % paymentMethods.length];
    const scheduledDay: ScheduledOrder['scheduledDay'] = index % 2 === 0 ? 'saturday' : 'sunday';
    const scheduledDate = scheduledDay === 'saturday' ? '2026-06-20' : '2026-06-21';
    const scheduledDateLabel = scheduledDay === 'saturday' ? 'Sábado, 20/06' : 'Domingo, 21/06';
    const scheduledWindow = scheduledWindows[index % scheduledWindows.length];

    return {
        id: String(2050 - index),
        customer: customerNames[(index + 11) % customerNames.length],
        phone: `(48) 99${String(3300 + index * 41).padStart(4, '0')}-${String(4800 + index * 23).padStart(4, '0')}`,
        status: 'analysis',
        channel: 'retirada',
        pickupWindow: `${scheduledDateLabel}, ${scheduledWindow}`,
        createdAt: `agendado há ${2 + index} dias`,
        paymentMethod,
        paymentStatus: paymentMethod.toLowerCase().includes('pix enviado') || paymentMethod.includes('online') ? 'paid' : 'pending',
        total: template.total,
        items: template.items,
        scheduledDay,
        scheduledDate,
        scheduledDateLabel,
        scheduledWindow,
        scheduledNote: scheduledNotes[index % scheduledNotes.length],
        placedAt: `${index % 2 === 0 ? 'Segunda' : 'Terça'}, ${String(9 + (index % 8)).padStart(2, '0')}:15`,
    };
});

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
}: {
    order: AdminOrder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
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
                                Remover pedido
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 gap-2 border-neutral-200 bg-white px-4 text-[13px] font-extrabold text-dark-700 hover:bg-neutral-50"
                            >
                                <FaPhone size={13} />
                                Contatar cliente
                            </Button>
                            <Button
                                type="button"
                                className="h-10 gap-2 bg-[#f97316] px-4 text-[13px] font-extrabold text-white shadow-sm hover:bg-[#ea6409]"
                            >
                                <FaPenToSquare size={13} />
                                Editar pedido
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
                        Contatar
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 gap-2 border-neutral-200 bg-white px-3 text-[12px] font-extrabold text-dark-700 hover:bg-neutral-50"
                    >
                        <FaPenToSquare size={12} />
                        Editar
                    </Button>
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
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[13px] font-semibold text-dark-700">
                            <span>Taxa de retirada</span>
                            <span>R$ 0,00</span>
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
                            Retirada no local
                        </span>
                        <strong className="mt-2 block text-[14px] text-dark-800">Balcão</strong>
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

function getOrderReportDate(order: AdminOrder) {
    if ('scheduledDate' in order && typeof order.scheduledDate === 'string') {
        return order.scheduledDate;
    }

    if (order.pickupWindow.startsWith('Sábado')) {
        return '2026-06-20';
    }

    if (order.pickupWindow.startsWith('Domingo')) {
        return '2026-06-21';
    }

    return '2026-06-19';
}

function buildWeeklyReportData(orders: AdminOrder[]) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return days.map((day, dayIndex) => {
        const dayOrders = orders.filter((order) => parseLocalDate(getOrderReportDate(order))?.getDay() === dayIndex);
        const faturamento = dayOrders.reduce((total, order) => total + order.total, 0);
        const clientes = new Set(dayOrders.map((order) => order.phone)).size;

        return {
            label: day,
            pedidos: dayOrders.length,
            faturamento,
            clientes,
        };
    });
}

function buildCustomerStats(orders: AdminOrder[]) {
    const customers = new Map<string, {
        customer: string;
        phone: string;
        orders: number;
        total: number;
    }>();

    orders.forEach((order) => {
        const currentCustomer = customers.get(order.phone) ?? {
            customer: order.customer,
            phone: order.phone,
            orders: 0,
            total: 0,
        };

        customers.set(order.phone, {
            ...currentCustomer,
            orders: currentCustomer.orders + 1,
            total: currentCustomer.total + order.total,
        });
    });

    return Array.from(customers.values()).sort((a, b) => b.total - a.total);
}

type CustomerReportRow = {
    id: string;
    name: string;
    phone: string;
    status: CustomerReportStatus;
    statusLabel: string;
    orders: number;
    total: number;
    lastOrder: string;
    birthDate: string;
    origin: string;
    cpf?: string;
    email?: string;
    address?: string;
    note?: string;
}

type CustomerEditableData = Pick<CustomerReportRow, 'name' | 'phone' | 'birthDate' | 'origin' | 'cpf' | 'email' | 'address' | 'note'>;

const potentialCustomerRows: CustomerReportRow[] = [
    { id: 'lead-01', name: 'Sandra Oliveira', phone: '(49) 9 9956-4370', status: 'potential', statusLabel: 'Em potencial', orders: 0, total: 0, lastOrder: 'Carrinho abandonado', birthDate: '-', origin: 'Checkout' },
    { id: 'lead-02', name: 'Dyeni Martins', phone: '(49) 9 9117-5516', status: 'potential', statusLabel: 'Em potencial', orders: 0, total: 0, lastOrder: 'Selecionou horário', birthDate: '-', origin: 'Agendamento' },
    { id: 'lead-03', name: 'Ana Beatriz', phone: '(49) 9 9156-7076', status: 'potential', statusLabel: 'Em potencial', orders: 0, total: 0, lastOrder: 'Cupom consultado', birthDate: '-', origin: 'Cupom' },
    { id: 'lead-04', name: 'Julia de Oliveira', phone: '(49) 9 8897-3418', status: 'potential', statusLabel: 'Em potencial', orders: 0, total: 0, lastOrder: 'Adicionou item', birthDate: '-', origin: 'Cardápio' },
    { id: 'lead-05', name: 'Pauline Lopes', phone: '(48) 9 9100-8448', status: 'potential', statusLabel: 'Em potencial', orders: 0, total: 0, lastOrder: 'Abriu checkout', birthDate: '-', origin: 'WhatsApp' },
    { id: 'lead-06', name: 'Fernanda Moraes', phone: '(49) 9 9152-8406', status: 'potential', statusLabel: 'Em potencial', orders: 0, total: 0, lastOrder: 'Visualizou combo', birthDate: '-', origin: 'Promoção' },
    { id: 'lead-07', name: 'Nita Dircksen', phone: '(49) 9 9122-5534', status: 'potential', statusLabel: 'Em potencial', orders: 0, total: 0, lastOrder: 'Iniciou pedido', birthDate: '-', origin: 'Cardápio' },
    { id: 'lead-08', name: 'Geli Simone Mota', phone: '(49) 9 9142-3435', status: 'potential', statusLabel: 'Em potencial', orders: 0, total: 0, lastOrder: 'Consultou retirada', birthDate: '-', origin: 'Agenda' },
];

const inactiveCustomerRows: CustomerReportRow[] = [
    { id: 'inactive-01', name: 'Rosana Ferreira', phone: '(48) 9 9011-3321', status: 'inactive', statusLabel: 'Inativo', orders: 2, total: 151, lastOrder: 'há 94 dias', birthDate: '-', origin: 'Histórico' },
    { id: 'inactive-02', name: 'Alon Machado', phone: '(48) 9 8854-2198', status: 'inactive', statusLabel: 'Inativo', orders: 1, total: 65, lastOrder: 'há 112 dias', birthDate: '-', origin: 'Histórico' },
    { id: 'inactive-03', name: 'Keila Lazzaris', phone: '(48) 9 7765-1420', status: 'inactive', statusLabel: 'Inativo', orders: 3, total: 279.9, lastOrder: 'há 126 dias', birthDate: '-', origin: 'Histórico' },
    { id: 'inactive-04', name: 'Paulo Roberto Warmling', phone: '(48) 9 9211-8097', status: 'inactive', statusLabel: 'Inativo', orders: 1, total: 89.9, lastOrder: 'há 148 dias', birthDate: '-', origin: 'Histórico' },
    { id: 'inactive-05', name: 'Codo Pereira', phone: '(48) 9 8800-7712', status: 'inactive', statusLabel: 'Inativo', orders: 2, total: 130, lastOrder: 'há 175 dias', birthDate: '-', origin: 'Histórico' },
];

function buildCustomerReportRows(customers: ReturnType<typeof buildCustomerStats>): CustomerReportRow[] {
    const activeRows = customers.map((customer, index) => ({
        id: `active-${customer.phone}`,
        name: customer.customer,
        phone: customer.phone,
        status: 'active' as const,
        statusLabel: customer.orders > 1 ? 'Ativo recorrente' : 'Ativo',
        orders: customer.orders,
        total: customer.total,
        lastOrder: index % 3 === 0 ? 'Hoje' : index % 3 === 1 ? 'há 2 dias' : 'há 7 dias',
        birthDate: '-',
        origin: customer.orders > 1 ? 'Recorrente' : 'Pedido único',
    }));

    return [...potentialCustomerRows, ...activeRows, ...inactiveCustomerRows];
}

function buildItemStats(orders: AdminOrder[]) {
    const items = new Map<string, {
        name: string;
        quantity: number;
        revenue: number;
    }>();

    orders.forEach((order) => {
        const orderQuantity = order.items.reduce((total, item) => total + item.quantity, 0) || 1;
        const unitShare = order.total / orderQuantity;

        order.items.forEach((item) => {
            const currentItem = items.get(item.name) ?? {
                name: item.name,
                quantity: 0,
                revenue: 0,
            };

            items.set(item.name, {
                ...currentItem,
                quantity: currentItem.quantity + item.quantity,
                revenue: currentItem.revenue + unitShare * item.quantity,
            });
        });
    });

    return Array.from(items.values()).sort((a, b) => b.quantity - a.quantity);
}

function buildChannelStats(orders: AdminOrder[]) {
    return [
        { label: 'Retirada', pedidos: orders.filter((order) => order.channel === 'retirada').length },
        { label: 'Balcão', pedidos: orders.filter((order) => order.channel === 'balcao').length },
        { label: 'Delivery', pedidos: orders.filter((order) => order.channel === 'delivery').length },
    ];
}

function buildStatusStats(orders: AdminOrder[]) {
    return [
        { label: 'Análise', pedidos: orders.filter((order) => order.status === 'analysis').length },
        { label: 'Produção', pedidos: orders.filter((order) => order.status === 'production').length },
        { label: 'Retirada', pedidos: orders.filter((order) => order.status === 'ready').length },
    ];
}

function buildPaymentStats(orders: AdminOrder[]) {
    const paid = orders.filter((order) => order.paymentStatus === 'paid').length;
    const pending = orders.length - paid;

    return [
        { label: 'Pago', pedidos: paid },
        { label: 'A receber', pedidos: pending },
    ];
}

function ReportMetricCard({
    Icon,
    label,
    value,
    description,
}: {
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase text-dark-400">{label}</span>
                    <strong className="mt-1 block truncate text-[22px] font-extrabold leading-7 text-dark-950">
                        {value}
                    </strong>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#eef6ff] text-[#2f8df6]">
                    <Icon size={16} />
                </span>
            </div>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-dark-500">{description}</p>
        </div>
    );
}

function ReportNavigation({ reportType }: { reportType: ReportType }) {
    return (
        <section className="rounded-md border border-neutral-200 bg-white p-2 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
                {reportOptions.map((option) => {
                    const Icon = option.Icon;
                    const active = reportType === option.value;

                    return (
                        <Link
                            key={option.value}
                            href={`/admin/dashboard?view=reports&report=${option.value}`}
                            className={cn(
                                "flex h-9 items-center gap-2 rounded-md px-3 text-[12px] font-extrabold transition",
                                active
                                    ? "bg-[#f97316] text-white shadow-sm"
                                    : "bg-[#f3f5f8] text-dark-600 hover:bg-[#e9edf3] hover:text-dark-900"
                            )}
                        >
                            <Icon size={13} />
                            {option.shortTitle}
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

function ReportBarChart({
    data,
    dataKey,
    label,
    color = 'var(--color-pedidos)',
}: {
    data: Array<Record<string, string | number>>;
    dataKey: string;
    label: string;
    color?: string;
}) {
    return (
        <ChartContainer config={reportChartConfig} className="h-[300px] w-full aspect-auto">
            <BarChart data={data} margin={{ top: 18, right: 12, left: 0, bottom: 6 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    fontSize={12}
                />
                <YAxis hide />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel={false} />}
                />
                <Bar dataKey={dataKey} name={label} fill={color} radius={[8, 8, 4, 4]} />
            </BarChart>
        </ChartContainer>
    );
}

function ReportLineChart({
    data,
}: {
    data: Array<Record<string, string | number>>;
}) {
    return (
        <ChartContainer config={reportChartConfig} className="h-[300px] w-full aspect-auto">
            <LineChart data={data} margin={{ top: 18, right: 18, left: 4, bottom: 6 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                <YAxis hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line
                    type="monotone"
                    dataKey="faturamento"
                    name="Faturamento"
                    stroke="var(--color-faturamento)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'var(--color-faturamento)' }}
                />
                <Line
                    type="monotone"
                    dataKey="pedidos"
                    name="Pedidos"
                    stroke="var(--color-pedidos)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'var(--color-pedidos)' }}
                />
            </LineChart>
        </ChartContainer>
    );
}

function ReportRanking({
    title,
    rows,
}: {
    title: string;
    rows: Array<{
        label: string;
        detail: string;
        value: string;
        percent: number;
    }>;
}) {
    return (
        <section className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#f97316]">Ranking</span>
                    <h2 className="text-[16px] font-extrabold text-dark-900">{title}</h2>
                </div>
            </div>
            <div className="mt-3 space-y-2">
                {rows.map((row) => (
                    <div key={row.label} className="rounded-md border border-neutral-100 bg-[#fbfbfc] p-2.5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <strong className="block truncate text-[12px] font-extrabold text-dark-900">{row.label}</strong>
                                <span className="text-[11px] font-semibold text-dark-500">{row.detail}</span>
                            </div>
                            <strong className="shrink-0 text-[12px] font-extrabold text-[#f97316]">{row.value}</strong>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                            <div
                                className="h-full rounded-full bg-[#f97316]"
                                style={{ width: `${Math.max(8, Math.min(100, row.percent))}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function CustomerStatusBadge({ status }: { status: CustomerReportStatus }) {
    const statusClasses: Record<CustomerReportStatus, string> = {
        potential: 'bg-blue-50 text-blue-700 ring-blue-100',
        active: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        inactive: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
    };
    const statusLabel: Record<CustomerReportStatus, string> = {
        potential: 'Em potencial',
        active: 'Ativo',
        inactive: 'Inativo',
    };

    return (
        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ring-1", statusClasses[status])}>
            {statusLabel[status]}
        </span>
    );
}

function CustomerReportMetric({
    Icon,
    label,
    value,
}: {
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <article className="rounded-md border border-neutral-200 bg-white p-5 text-center shadow-sm">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[#dff1ff] text-[#1e96ff]">
                <Icon size={18} />
            </span>
            <strong className="mt-3 block text-[22px] font-extrabold leading-7 text-dark-800">{value}</strong>
            <span className="mt-1 block text-[12px] font-extrabold text-dark-400">{label}</span>
        </article>
    );
}

function buildCustomerDraft(customer?: CustomerReportRow | null): CustomerEditableData {
    return {
        name: customer?.name ?? '',
        phone: customer?.phone ?? '',
        birthDate: customer?.birthDate ?? '',
        origin: customer?.origin ?? '',
        cpf: customer?.cpf ?? '',
        email: customer?.email ?? '',
        address: customer?.address ?? '',
        note: customer?.note ?? '',
    };
}

function getCustomerOrders(customer: CustomerReportRow, orders: AdminOrder[]) {
    return orders.filter((order) => order.phone === customer.phone);
}

function getFavoriteCustomerItem(customerOrders: AdminOrder[], fallback = 'Frango assado recheado') {
    const itemCounts = new Map<string, number>();

    customerOrders.forEach((order) => {
        order.items.forEach((item) => {
            itemCounts.set(item.name, (itemCounts.get(item.name) ?? 0) + item.quantity);
        });
    });

    return Array.from(itemCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? fallback;
}

function getDaysWithoutPurchase(customer: CustomerReportRow) {
    if (customer.orders === 0 || customer.status === 'potential') {
        return 'Sem compra';
    }

    if (customer.lastOrder === 'Hoje') {
        return '0 dias';
    }

    const daysMatch = customer.lastOrder.match(/(\d+)/);

    return daysMatch ? `${daysMatch[1]} dias` : customer.lastOrder;
}

function getDaysWithoutPurchaseValue(customer: CustomerReportRow) {
    if (customer.orders === 0 || customer.status === 'potential') {
        return -1;
    }

    if (customer.lastOrder === 'Hoje') {
        return 0;
    }

    const daysMatch = customer.lastOrder.match(/(\d+)/);

    return daysMatch ? Number(daysMatch[1]) : 0;
}

function CustomerInfoCard({
    Icon,
    label,
    value,
    description,
}: {
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    value: string;
    description?: string;
}) {
    return (
        <article className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e7f4ff] text-[#1e96ff]">
                <Icon size={15} />
            </span>
            <strong className="mt-3 block truncate text-[17px] font-extrabold leading-6 text-dark-900">{value}</strong>
            <span className="mt-0.5 block text-[11px] font-extrabold uppercase text-dark-400">{label}</span>
            {description && (
                <p className="mt-2 text-[12px] font-semibold leading-4 text-dark-500">{description}</p>
            )}
        </article>
    );
}

function CustomerEditSheet({
    customer,
    onClose,
    onSave,
}: {
    customer: CustomerReportRow | null;
    onClose: () => void;
    onSave: (customerId: string, data: CustomerEditableData) => void;
}) {
    const [draft, setDraft] = React.useState<CustomerEditableData>(() => buildCustomerDraft(customer));

    React.useEffect(() => {
        setDraft(buildCustomerDraft(customer));
    }, [customer]);

    function updateDraft(field: keyof CustomerEditableData, value: string) {
        setDraft((current) => ({ ...current, [field]: value }));
    }

    if (!customer) {
        return null;
    }

    return (
        <Sheet open={Boolean(customer)} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                iconClose
                className="flex h-full w-[min(520px,94vw)] flex-col overflow-hidden border-l border-neutral-200 bg-white p-0 text-dark-900 shadow-2xl dark:bg-white sm:!max-w-[520px]"
            >
                <SheetHeader className="border-b border-neutral-200 bg-white px-6 py-5 text-left">
                    <span className="w-fit rounded-full bg-[#fff3ea] px-3 py-1 text-[11px] font-extrabold uppercase text-[#f97316]">
                        Editar cliente
                    </span>
                    <SheetTitle className="text-[22px] font-extrabold leading-7 text-dark-950">
                        Dados principais
                    </SheetTitle>
                    <SheetDescription className="text-[12px] font-semibold leading-5 text-dark-500">
                        Atualize os dados usados para contato, identificação e segmentação no relatório.
                    </SheetDescription>
                </SheetHeader>

                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSave(customer.id, draft);
                    }}
                >
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#f7f8fa] px-6 py-5">
                        <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                            <div className="grid gap-3">
                                <label className="space-y-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-dark-500">Nome do cliente</span>
                                    <Input
                                        value={draft.name}
                                        onChange={(event) => updateDraft('name', event.target.value)}
                                        className="h-10 border-neutral-200 bg-white text-[13px] font-semibold text-dark-900"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-dark-500">Telefone</span>
                                    <Input
                                        value={draft.phone}
                                        onChange={(event) => updateDraft('phone', event.target.value)}
                                        className="h-10 border-neutral-200 bg-white text-[13px] font-semibold text-dark-900"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-dark-500">E-mail</span>
                                    <Input
                                        value={draft.email}
                                        onChange={(event) => updateDraft('email', event.target.value)}
                                        placeholder="cliente@email.com"
                                        className="h-10 border-neutral-200 bg-white text-[13px] font-semibold text-dark-900"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="space-y-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-dark-500">CPF</span>
                                    <Input
                                        value={draft.cpf}
                                        onChange={(event) => updateDraft('cpf', event.target.value)}
                                        placeholder="Não informado"
                                        className="h-10 border-neutral-200 bg-white text-[13px] font-semibold text-dark-900"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-dark-500">Aniversário</span>
                                    <Input
                                        value={draft.birthDate}
                                        onChange={(event) => updateDraft('birthDate', event.target.value)}
                                        placeholder="dd/mm/aaaa"
                                        className="h-10 border-neutral-200 bg-white text-[13px] font-semibold text-dark-900"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                            <div className="grid gap-3">
                                <label className="space-y-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-dark-500">Endereço</span>
                                    <Input
                                        value={draft.address}
                                        onChange={(event) => updateDraft('address', event.target.value)}
                                        placeholder="Sem endereço cadastrado"
                                        className="h-10 border-neutral-200 bg-white text-[13px] font-semibold text-dark-900"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-dark-500">Origem / classificação</span>
                                    <Input
                                        value={draft.origin}
                                        onChange={(event) => updateDraft('origin', event.target.value)}
                                        className="h-10 border-neutral-200 bg-white text-[13px] font-semibold text-dark-900"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-dark-500">Observação interna</span>
                                    <textarea
                                        value={draft.note}
                                        onChange={(event) => updateDraft('note', event.target.value)}
                                        placeholder="Ex.: cliente prefere retirar no primeiro horário."
                                        className="min-h-[96px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-[13px] font-semibold leading-5 text-dark-900 outline-none transition focus:border-[#1e96ff] focus:ring-2 focus:ring-[#1e96ff]/15"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="gap-2 border-t border-neutral-200 bg-white px-6 py-4 sm:space-x-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-10 border-neutral-200 bg-white px-4 text-[13px] font-extrabold text-dark-700 hover:bg-neutral-50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="h-10 bg-[#f97316] px-5 text-[13px] font-extrabold text-white hover:bg-[#ea6409]"
                        >
                            Salvar alterações
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

function CustomerDetailsSheet({
    customer,
    orders,
    onClose,
    onEdit,
}: {
    customer: CustomerReportRow | null;
    orders: AdminOrder[];
    onClose: () => void;
    onEdit: (customer: CustomerReportRow) => void;
}) {
    if (!customer) {
        return null;
    }

    const customerOrders = getCustomerOrders(customer, orders);
    const displayOrders = customerOrders.length > 0
        ? customerOrders
        : customer.orders > 0
            ? [{
                id: customer.id.replace(/\D/g, '') || customer.id,
                customer: customer.name,
                phone: customer.phone,
                status: 'ready' as const,
                channel: 'retirada' as const,
                pickupWindow: customer.lastOrder,
                createdAt: customer.lastOrder,
                paymentMethod: 'Histórico importado',
                paymentStatus: 'paid' as const,
                total: customer.total,
                items: [{ quantity: 1, name: 'Pedido histórico' }],
            }]
            : [];
    const movedTotal = displayOrders.reduce((total, order) => total + order.total, 0);
    const orderCount = customerOrders.length || customer.orders;
    const favoriteItem = getFavoriteCustomerItem(displayOrders, customer.status === 'inactive' ? 'Frango assado recheado' : 'Frango assado sem recheio');
    const firstOrder = displayOrders[displayOrders.length - 1]?.pickupWindow ?? 'Sem pedido concluído';
    const recentOrder = displayOrders[0]?.pickupWindow ?? customer.lastOrder;
    const loyaltyProgress = Math.min(10, orderCount);
    const cashbackRedeemed = Math.max(0, Number((movedTotal * 0.03).toFixed(2)));
    const couponsRedeemed = orderCount > 1 ? Math.min(3, orderCount - 1) : 0;

    return (
        <Sheet open={Boolean(customer)} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                iconClose
                className="flex h-full w-[min(980px,95vw)] flex-col overflow-hidden border-l border-neutral-200 bg-[#f1f2f4] p-0 text-dark-900 shadow-2xl dark:bg-[#f1f2f4] sm:!max-w-[980px]"
            >
                <SheetHeader className="border-b border-neutral-200 bg-white px-7 py-5 text-left">
                    <div className="flex items-start justify-between gap-6 pr-8">
                        <div className="min-w-0">
                            <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-extrabold uppercase text-[#1e96ff]">
                                Perfil do cliente
                            </span>
                            <SheetTitle className="mt-3 truncate text-[26px] font-extrabold leading-8 text-dark-950">
                                {customer.name}
                            </SheetTitle>
                            <SheetDescription className="mt-1 text-[13px] font-semibold leading-5 text-dark-500">
                                Histórico completo para atendimento, recompra e análise de movimentação.
                            </SheetDescription>
                        </div>

                        <div className="shrink-0 text-right">
                            <span className="block text-[10px] font-extrabold uppercase text-dark-400">Total movimentado</span>
                            <strong className="block text-[26px] font-extrabold leading-8 text-dark-950">
                                {formatCurrency(movedTotal)}
                            </strong>
                            <span className="mt-1 inline-flex rounded-full bg-[#fff3ea] px-3 py-1 text-[11px] font-extrabold text-[#f97316]">
                                {orderCount} pedido{orderCount === 1 ? '' : 's'}
                            </span>
                        </div>
                    </div>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
                    <section className="grid gap-3 xl:grid-cols-3">
                        <CustomerInfoCard Icon={FaRankingStar} label="Item mais pedido" value={favoriteItem} />
                        <CustomerInfoCard Icon={FaReceipt} label="Pedidos realizados" value={String(orderCount)} />
                        <CustomerInfoCard Icon={FaMoneyBillWave} label="Total movimentado" value={formatCurrency(movedTotal)} />
                    </section>

                    <section className="mt-4 grid gap-3 xl:grid-cols-4">
                        <CustomerInfoCard Icon={FaPhone} label="Telefone" value={customer.phone} />
                        <CustomerInfoCard Icon={FaLocationDot} label="Endereço" value={customer.address || 'Sem endereço'} />
                        <CustomerInfoCard Icon={FaCalendarDays} label="Primeiro pedido" value={firstOrder} />
                        <CustomerInfoCard Icon={FaCalendarDays} label="Pedido mais recente" value={recentOrder} />
                        <CustomerInfoCard Icon={FaIdCard} label="CPF" value={customer.cpf || 'Não informado'} />
                        <CustomerInfoCard Icon={FaGift} label="Aniversário" value={customer.birthDate && customer.birthDate !== '-' ? customer.birthDate : 'Não informado'} />
                        <CustomerInfoCard Icon={HiTicket} label="Cupons resgatados" value={String(couponsRedeemed)} />
                        <CustomerInfoCard Icon={FaPiggyBank} label="Cashback resgatado" value={formatCurrency(cashbackRedeemed)} />
                    </section>

                    <section className="mt-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="grid gap-5 xl:grid-cols-[260px_1fr_auto]">
                            <div>
                                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f4ff] text-[#1e96ff]">
                                    <FaStar size={16} />
                                </span>
                                <strong className="mt-3 block text-[22px] font-extrabold leading-7 text-dark-900">
                                    {loyaltyProgress}/10
                                </strong>
                                <span className="text-[12px] font-extrabold text-dark-400">Progresso no plano fidelidade</span>
                            </div>

                            <div className="flex items-center">
                                <div className="h-4 w-full overflow-hidden rounded-full bg-neutral-200">
                                    <div
                                        className="h-full rounded-full bg-[#f97316] transition-all"
                                        style={{ width: `${loyaltyProgress * 10}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="h-9 w-9 border-neutral-200 bg-white p-0 text-dark-500"
                                    data-tooltip-id="customer-loyalty-add-tooltip"
                                    data-tooltip-content="Adicionar ponto de fidelidade"
                                >
                                    <FaPlus size={12} />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-9 w-9 border-neutral-200 bg-white p-0 text-dark-500"
                                    data-tooltip-id="customer-loyalty-remove-tooltip"
                                    data-tooltip-content="Remover ponto de fidelidade"
                                >
                                    <FaTrashCan size={12} />
                                </Button>
                            </div>
                        </div>
                    </section>

                    <section className="mt-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 className="text-[20px] font-extrabold leading-6 text-dark-950">Movimentação do cliente</h3>
                                <p className="mt-1 text-[12px] font-semibold text-dark-500">
                                    Últimas ações financeiras e operacionais vinculadas ao cliente.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onEdit(customer)}
                                className="h-9 gap-2 border-[#f97316]/30 bg-[#fff8f2] px-3 text-[12px] font-extrabold text-[#f97316] hover:bg-[#fff3ea]"
                            >
                                <FaPenToSquare size={12} />
                                Editar dados
                            </Button>
                        </div>

                        <div className="mt-4 space-y-2">
                            {displayOrders.length > 0 ? displayOrders.slice(0, 5).map((order) => (
                                <div key={`movement-${order.id}`} className="grid grid-cols-[34px_1fr_auto] items-center gap-3 rounded-md border border-neutral-200 bg-[#fbfbfc] px-3 py-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff3ea] text-[#f97316]">
                                        <FaReceipt size={12} />
                                    </span>
                                    <div className="min-w-0">
                                        <strong className="block truncate text-[13px] font-extrabold text-dark-900">Pedido #{order.id}</strong>
                                        <span className="block truncate text-[12px] font-semibold text-dark-500">
                                            {order.pickupWindow} · {order.paymentMethod}
                                        </span>
                                    </div>
                                    <strong className="text-[13px] font-extrabold text-dark-900">{formatCurrency(order.total)}</strong>
                                </div>
                            )) : (
                                <div className="rounded-md border border-dashed border-neutral-200 bg-[#fbfbfc] p-4 text-[13px] font-semibold text-dark-500">
                                    Nenhuma movimentação registrada para este cliente.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="mt-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 className="text-[20px] font-extrabold leading-6 text-dark-950">Pedidos do cliente</h3>
                                <p className="mt-1 text-[12px] font-semibold text-dark-500">
                                    Todos os pedidos feitos por {customer.name}.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 gap-2 border-[#2f8df6] bg-white px-4 text-[12px] font-extrabold text-[#2f8df6] hover:bg-[#eef6ff]"
                            >
                                <FaDownload size={12} />
                                Exportar
                            </Button>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-md border border-neutral-200">
                            <table className="w-full border-collapse text-left">
                                <thead className="bg-white text-[12px] font-extrabold text-dark-900">
                                    <tr className="border-b border-neutral-200">
                                        <th className="px-4 py-3">Data</th>
                                        <th className="px-4 py-3">Nº do pedido</th>
                                        <th className="px-4 py-3">Itens</th>
                                        <th className="px-4 py-3">Valor</th>
                                        <th className="px-4 py-3">Pagamento</th>
                                        <th className="px-4 py-3">Forma de entrega</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[13px] font-semibold text-dark-600">
                                    {displayOrders.length > 0 ? displayOrders.map((order, index) => (
                                        <tr key={`detail-order-${order.id}`} className={cn("border-b border-white", index % 2 === 0 ? "bg-neutral-100" : "bg-white")}>
                                            <td className="px-4 py-3">{order.pickupWindow}</td>
                                            <td className="px-4 py-3 font-extrabold text-dark-900">#{order.id}</td>
                                            <td className="px-4 py-3">
                                                {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                                            </td>
                                            <td className="px-4 py-3 font-extrabold text-dark-900">{formatCurrency(order.total)}</td>
                                            <td className="px-4 py-3">{order.paymentMethod}</td>
                                            <td className="px-4 py-3">{order.channel === 'retirada' ? 'Retirada no local' : order.channel}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td className="px-4 py-8 text-center text-[13px] font-semibold text-dark-400" colSpan={6}>
                                                Nenhum pedido encontrado para este cliente.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function CustomerReportsView({
    customers,
    orders,
}: {
    customers: ReturnType<typeof buildCustomerStats>;
    orders: AdminOrder[];
}) {
    const [customerType, setCustomerType] = React.useState<CustomerReportStatus>('potential');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);
    const [customerOverrides, setCustomerOverrides] = React.useState<Record<string, Partial<CustomerReportRow>>>({});
    const [editingCustomer, setEditingCustomer] = React.useState<CustomerReportRow | null>(null);
    const [viewingCustomer, setViewingCustomer] = React.useState<CustomerReportRow | null>(null);
    const baseRows = React.useMemo(() => buildCustomerReportRows(customers), [customers]);
    const rows = React.useMemo(() => (
        baseRows.map((row) => ({ ...row, ...customerOverrides[row.id] }))
    ), [baseRows, customerOverrides]);
    const activeCount = rows.filter((row) => row.status === 'active').length;
    const potentialCount = rows.filter((row) => row.status === 'potential').length;
    const inactiveCount = rows.filter((row) => row.status === 'inactive').length;
    const topCustomers = customers.slice(0, 10);
    const filteredRows = React.useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return rows.filter((row) => {
            const matchesType = row.status === customerType;
            const matchesSearch = !normalizedSearch
                || row.name.toLowerCase().includes(normalizedSearch)
                || row.phone.includes(normalizedSearch)
                || row.origin.toLowerCase().includes(normalizedSearch);

            return matchesType && matchesSearch;
        }).sort((firstCustomer, secondCustomer) => {
            const daysDifference = getDaysWithoutPurchaseValue(secondCustomer) - getDaysWithoutPurchaseValue(firstCustomer);

            if (daysDifference !== 0) {
                return daysDifference;
            }

            return firstCustomer.name.localeCompare(secondCustomer.name, 'pt-BR');
        });
    }, [customerType, rows, searchTerm]);
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const currentTypeLabel = {
        potential: 'Clientes em potencial',
        active: 'Clientes ativos',
        inactive: 'Clientes inativos',
    }[customerType];
    const currentTypeDescription = {
        potential: 'Aqueles que demonstraram intenção, mas ainda não finalizaram o pedido.',
        active: 'Clientes com pedidos recentes ou recorrência no período selecionado.',
        inactive: 'Clientes sem compra recente e que podem receber campanha de reativação.',
    }[customerType];

    React.useEffect(() => {
        setPage(1);
    }, [customerType, searchTerm, pageSize]);

    function exportCustomers() {
        const headers = ['Cliente', 'Contato', 'Tipo', 'Pedidos', 'Total', 'Dias sem comprar', 'Nascimento', 'Origem'];
        const csvRows = filteredRows.map((row) => [
            row.name,
            row.phone,
            row.statusLabel,
            String(row.orders),
            row.total.toFixed(2).replace('.', ','),
            getDaysWithoutPurchase(row),
            row.birthDate,
            row.origin,
        ]);
        const csvContent = [headers, ...csvRows]
            .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'))
            .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `assados-zanini-clientes-${customerType}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function saveCustomer(customerId: string, data: CustomerEditableData) {
        setCustomerOverrides((current) => ({
            ...current,
            [customerId]: data,
        }));
        setEditingCustomer(null);
        setViewingCustomer((current) => (
            current?.id === customerId
                ? { ...current, ...data }
                : current
        ));
    }

    return (
        <main className="min-h-[calc(100vh-61px)] bg-[#f3f5f8] p-3">
            <section className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-[25px] font-extrabold leading-8 text-dark-800">Relatório de Clientes</h1>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-extrabold text-dark-400">
                        <span>Início</span>
                        <span>›</span>
                        <span>Relatórios</span>
                        <span>›</span>
                        <span className="text-dark-500">Relatório de Clientes</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 gap-2 border-[#2f8df6] bg-white px-4 text-[13px] font-extrabold text-[#2f8df6] hover:bg-[#eef6ff] hover:text-[#2f8df6]"
                    >
                        <FaDownload size={14} />
                        Importar clientes
                    </Button>
                    <Button
                        type="button"
                        className="h-10 gap-2 bg-[#1e96ff] px-4 text-[13px] font-extrabold text-white hover:bg-[#147fdb]"
                    >
                        <FaPlus size={14} />
                        Cadastrar cliente
                    </Button>
                </div>
            </section>

            <section className="mt-4 grid gap-3 xl:grid-cols-3">
                <CustomerReportMetric Icon={FaUserPlus} label="Clientes em potencial" value={String(potentialCount)} />
                <CustomerReportMetric Icon={FaUserCheck} label="Clientes ativos" value={String(activeCount)} />
                <CustomerReportMetric Icon={FaUserXmark} label="Clientes inativos" value={String(inactiveCount)} />
            </section>

            <section className="mt-4 rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
                    <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#dff1ff] text-[#1e96ff]">
                            <FaUser size={18} />
                        </span>
                        <div>
                            <strong className="block text-[22px] font-extrabold leading-7 text-dark-800">TOP 10</strong>
                            <span className="mt-1 block max-w-[220px] text-[12px] font-extrabold leading-4 text-dark-400">
                                Clientes ativos que mais realizaram pedidos
                            </span>
                        </div>
                    </div>
                    <ol className="grid gap-x-10 gap-y-1 text-[16px] font-extrabold text-dark-400 md:grid-cols-2">
                        {topCustomers.map((customer, index) => (
                            <li key={customer.phone} className="grid grid-cols-[38px_1fr_auto] items-center gap-2">
                                <span className="text-dark-700">{index + 1}º</span>
                                <span className="truncate">{customer.customer}</span>
                                <span className="text-[12px] text-[#f97316]">{customer.orders} ped.</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="mt-4 rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap gap-3 border-b border-neutral-200">
                            {[
                                { value: 'potential' as const, label: 'Clientes em potencial', count: potentialCount },
                                { value: 'inactive' as const, label: 'Clientes inativos', count: inactiveCount },
                                { value: 'active' as const, label: 'Clientes ativos', count: activeCount },
                            ].map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => setCustomerType(tab.value)}
                                    className={cn(
                                        "-mb-px h-10 border-b-2 px-4 text-[13px] font-extrabold transition-colors",
                                        customerType === tab.value
                                            ? "border-[#1e96ff] text-[#1e96ff]"
                                            : "border-transparent text-dark-500 hover:text-dark-900"
                                    )}
                                >
                                    {tab.label}
                                    <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-dark-500">
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <h2 className="mt-4 text-[20px] font-extrabold leading-6 text-dark-900">{currentTypeLabel}</h2>
                        <p className="mt-0.5 text-[13px] font-semibold leading-5 text-dark-500">{currentTypeDescription}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-9 border-[#2f8df6] px-0 text-[#2f8df6] hover:bg-[#eef6ff]"
                            onClick={() => window.print()}
                            aria-label="Imprimir tabela de clientes"
                        >
                            <FaFileExport size={14} />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 gap-2 border-[#2f8df6] bg-white px-4 text-[13px] font-extrabold text-[#2f8df6] hover:bg-[#eef6ff] hover:text-[#2f8df6]"
                            onClick={exportCustomers}
                        >
                            Exportar
                            <FaDownload size={13} />
                        </Button>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-[360px] max-w-[620px] flex-1 items-center">
                        <div className="relative flex-1">
                            <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={15} />
                            <Input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Pesquise por cliente, telefone ou origem"
                                className="h-10 !rounded-r-none !border-neutral-200 !bg-white pl-11 text-[13px] font-semibold !text-dark-900 shadow-none placeholder:!text-dark-300 focus-visible:!ring-2 focus-visible:!ring-[#1e96ff]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900"
                            />
                        </div>
                        <Button
                            type="button"
                            className="h-10 rounded-l-none bg-[#1e96ff] px-8 text-[13px] font-extrabold text-white hover:bg-[#147fdb]"
                        >
                            Pesquisar
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 text-[12px] font-bold text-dark-500">
                        <span>Página</span>
                        <input
                            aria-label="Página atual"
                            className="h-9 w-14 rounded-md border border-neutral-200 bg-white text-center text-[13px] font-extrabold text-dark-900 outline-none"
                            min={1}
                            max={totalPages}
                            onChange={(event) => setPage(Number(event.target.value) || 1)}
                            type="number"
                            value={currentPage}
                        />
                        <span>de {totalPages}</span>
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setPage(1)}
                            className="grid h-8 w-8 place-items-center rounded-md text-dark-500 transition hover:bg-neutral-100 disabled:opacity-35"
                        >
                            <FaAnglesLeft size={13} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            className="grid h-8 w-8 place-items-center rounded-md text-dark-500 transition hover:bg-neutral-100 disabled:opacity-35"
                        >
                            <FaChevronLeft size={13} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            className="grid h-8 w-8 place-items-center rounded-md text-dark-500 transition hover:bg-neutral-100 disabled:opacity-35"
                        >
                            <FaChevronRight size={13} />
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setPage(totalPages)}
                            className="grid h-8 w-8 place-items-center rounded-md text-dark-500 transition hover:bg-neutral-100 disabled:opacity-35"
                        >
                            <FaAnglesRight size={13} />
                        </button>
                        <select
                            aria-label="Registros por página"
                            className="h-9 rounded-md border border-neutral-200 bg-white px-2 text-[12px] font-extrabold text-dark-600 outline-none"
                            onChange={(event) => setPageSize(Number(event.target.value))}
                            value={pageSize}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <strong className="text-[16px] font-extrabold text-dark-900">
                        Total de registros {filteredRows.length}
                    </strong>
                    <span className="text-[12px] font-semibold text-dark-400">
                        Exibindo {visibleRows.length} registros nesta página
                    </span>
                </div>

                <div className="mt-3 overflow-hidden rounded-md border border-neutral-200">
                    <table className="w-full border-collapse text-left">
                        <thead className="bg-white">
                            <tr className="border-b border-neutral-200 text-[12px] font-extrabold text-dark-900">
                                <th className="px-4 py-3">
                                    <span
                                        className="inline-flex items-center gap-2"
                                        data-tooltip-id="customer-sort-tooltip"
                                        data-tooltip-content="Ordenar por nome do cliente"
                                    >
                                        Cliente
                                        <FaSort size={11} />
                                    </span>
                                </th>
                                <th className="px-4 py-3">Contato</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Pedidos</th>
                                <th className="px-4 py-3">Total</th>
                                <th className="px-4 py-3">Dias sem comprar</th>
                                <th className="px-4 py-3">Data de nascimento</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px] font-semibold text-dark-600">
                            {visibleRows.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className={cn(
                                        "border-b border-white transition hover:bg-[#eef6ff]",
                                        index % 2 === 0 ? "bg-neutral-100" : "bg-white",
                                        row.name.toLowerCase().includes('nita') && "bg-[#95d8ff] text-dark-900"
                                    )}
                                >
                                    <td className="px-4 py-3">
                                        <div className="min-w-0">
                                            <strong className="block truncate text-[13px] font-extrabold">{row.name}</strong>
                                            <span className="text-[11px] font-semibold text-dark-400">{row.origin}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{row.phone}</td>
                                    <td className="px-4 py-3"><CustomerStatusBadge status={row.status} /></td>
                                    <td className="px-4 py-3">{row.orders}</td>
                                    <td className="px-4 py-3">{row.total > 0 ? formatCurrency(row.total) : '-'}</td>
                                    <td className="px-4 py-3">{getDaysWithoutPurchase(row)}</td>
                                    <td className="px-4 py-3">{row.birthDate}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1.5">
                                            {row.status !== 'potential' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingCustomer(row)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-dark-500 transition hover:bg-[#fff3ea] hover:text-[#f97316]"
                                                        aria-label={`Editar ${row.name}`}
                                                        data-tooltip-id="customer-edit-tooltip"
                                                        data-tooltip-content={`Editar dados de ${row.name}`}
                                                    >
                                                        <FaPenToSquare size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingCustomer(row)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-dark-500 transition hover:bg-[#eef6ff] hover:text-[#1e96ff]"
                                                        aria-label={`Ver cliente ${row.name}`}
                                                        data-tooltip-id="customer-view-tooltip"
                                                        data-tooltip-content={`Ver perfil completo de ${row.name}`}
                                                    >
                                                        <FaEye size={14} />
                                                    </button>
                                                </>
                                            )}
                                            <a
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-dark-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                                                href={`https://wa.me/55${row.phone.replace(/\D/g, '')}`}
                                                rel="noreferrer"
                                                target="_blank"
                                                aria-label={`Abrir WhatsApp de ${row.name}`}
                                                data-tooltip-id="customer-whatsapp-tooltip"
                                                data-tooltip-content={`Abrir WhatsApp de ${row.name}`}
                                            >
                                                <FaWhatsapp size={16} />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <CustomerEditSheet
                customer={editingCustomer}
                onClose={() => setEditingCustomer(null)}
                onSave={saveCustomer}
            />
            <CustomerDetailsSheet
                customer={viewingCustomer}
                orders={orders}
                onClose={() => setViewingCustomer(null)}
                onEdit={(customer) => {
                    setViewingCustomer(null);
                    setEditingCustomer(customer);
                }}
            />
            <Tooltip id="customer-sort-tooltip" className="!z-[100] !rounded-md !bg-dark-900 !px-2.5 !py-1.5 !text-[11px] !font-bold !text-white" />
            <Tooltip id="customer-edit-tooltip" className="!z-[100] !rounded-md !bg-dark-900 !px-2.5 !py-1.5 !text-[11px] !font-bold !text-white" />
            <Tooltip id="customer-view-tooltip" className="!z-[100] !rounded-md !bg-dark-900 !px-2.5 !py-1.5 !text-[11px] !font-bold !text-white" />
            <Tooltip id="customer-whatsapp-tooltip" className="!z-[100] !rounded-md !bg-dark-900 !px-2.5 !py-1.5 !text-[11px] !font-bold !text-white" />
            <Tooltip id="customer-loyalty-add-tooltip" className="!z-[100] !rounded-md !bg-dark-900 !px-2.5 !py-1.5 !text-[11px] !font-bold !text-white" />
            <Tooltip id="customer-loyalty-remove-tooltip" className="!z-[100] !rounded-md !bg-dark-900 !px-2.5 !py-1.5 !text-[11px] !font-bold !text-white" />
        </main>
    );
}

function ReportsView({
    orders,
    reportType,
    scheduledOrders,
}: {
    orders: AdminOrder[];
    reportType: ReportType;
    scheduledOrders: ScheduledOrder[];
}) {
    const [reportDateFilterOpen, setReportDateFilterOpen] = React.useState(false);
    const [selectedReportDate, setSelectedReportDate] = React.useState('');
    const selectedReportCalendarDate = React.useMemo(() => parseLocalDate(selectedReportDate), [selectedReportDate]);
    const sourceOrders = React.useMemo<AdminOrder[]>(() => [...orders, ...scheduledOrders], [orders, scheduledOrders]);
    const allOrders = React.useMemo<AdminOrder[]>(() => {
        if (reportType !== 'general' || !selectedReportDate) {
            return sourceOrders;
        }

        return sourceOrders.filter((order) => getOrderReportDate(order) === selectedReportDate);
    }, [reportType, selectedReportDate, sourceOrders]);
    const currentReport = reportOptions.find((option) => option.value === reportType) ?? reportOptions[0];
    const weeklyData = React.useMemo(() => buildWeeklyReportData(allOrders), [allOrders]);
    const customers = React.useMemo(() => buildCustomerStats(allOrders), [allOrders]);
    const items = React.useMemo(() => buildItemStats(allOrders), [allOrders]);
    const revenue = allOrders.reduce((total, order) => total + order.total, 0);
    const paidRevenue = allOrders.filter((order) => order.paymentStatus === 'paid').reduce((total, order) => total + order.total, 0);
    const averageTicket = allOrders.length ? revenue / allOrders.length : 0;
    const activeCustomers = new Set(allOrders.map((order) => order.phone)).size;
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const couponDiscountTotal = localCoupons.reduce((total, coupon, index) => total + coupon.valor * (index + 3), 0);
    const cashbackGranted = Number((revenue * 0.03).toFixed(2));
    const cashbackUsed = Number((cashbackGranted * 0.42).toFixed(2));
    const loyaltyCustomers = customers.filter((customer) => customer.orders >= 2).length;
    const topCustomerTotal = customers[0]?.total || 1;
    const topItemQuantity = items[0]?.quantity || 1;
    const selectedReportPeriodLabel = selectedReportDate
        ? formatDisplayDate(selectedReportDate)
        : 'Todos os pedidos';

    if (reportType === 'customers') {
        return (
            <CustomerReportsView
                customers={customers}
                orders={allOrders}
            />
        );
    }

    const chartByReport: Record<ReportType, {
        title: string;
        description: string;
        content: React.ReactNode;
    }> = {
        general: {
            title: 'Pedidos e faturamento por dia',
            description: 'Acompanhe a evolução semanal da operação.',
            content: <ReportLineChart data={weeklyData} />,
        },
        customers: {
            title: 'Clientes com maior faturamento',
            description: 'Ranking dos clientes que mais compraram no período.',
            content: <ReportBarChart data={customers.slice(0, 7).map((customer) => ({ label: customer.customer.split(' ')[0], valor: customer.total }))} dataKey="valor" label="Faturamento" color="var(--color-clientes)" />,
        },
        orders: {
            title: 'Pedidos por canal',
            description: 'Distribuição de retirada, balcão e delivery.',
            content: <ReportBarChart data={buildChannelStats(allOrders)} dataKey="pedidos" label="Pedidos" />,
        },
        items: {
            title: 'Itens mais vendidos',
            description: 'Quantidade vendida por produto no período.',
            content: <ReportBarChart data={items.slice(0, 8).map((item) => ({ label: item.name.replace('Frango assado ', '').replace(' Defumada', ''), pedidos: item.quantity }))} dataKey="pedidos" label="Quantidade" />,
        },
        coupons: {
            title: 'Cupons por desconto configurado',
            description: 'Volume previsto de impacto por campanha.',
            content: <ReportBarChart data={localCoupons.map((coupon, index) => ({ label: coupon.nome, usos: coupon.quantidade - index * 7 }))} dataKey="usos" label="Usos disponíveis" color="var(--color-usos)" />,
        },
        loyalty: {
            title: 'Clientes no programa de fidelidade',
            description: 'Avanço estimado por etapa de recorrência.',
            content: <ReportBarChart data={[
                { label: '1 pedido', clientes: customers.filter((customer) => customer.orders === 1).length },
                { label: '2 pedidos', clientes: customers.filter((customer) => customer.orders === 2).length },
                { label: '3 pedidos', clientes: customers.filter((customer) => customer.orders === 3).length },
                { label: 'Prêmio', clientes: customers.filter((customer) => customer.orders >= 4).length },
            ]} dataKey="clientes" label="Clientes" color="var(--color-clientes)" />,
        },
        cashback: {
            title: 'Cashback concedido e utilizado',
            description: 'Controle do benefício financeiro em aberto.',
            content: <ReportBarChart data={[
                { label: 'Concedido', valor: cashbackGranted },
                { label: 'Utilizado', valor: cashbackUsed },
                { label: 'Em aberto', valor: Math.max(0, cashbackGranted - cashbackUsed) },
                { label: 'Expira breve', valor: cashbackGranted * 0.18 },
            ]} dataKey="valor" label="Valor" color="var(--color-faturamento)" />,
        },
    };

    const metricsByReport: Record<ReportType, Array<{
        label: string;
        value: string;
        description: string;
        Icon: React.ComponentType<{ size?: number; className?: string }>;
    }>> = {
        general: [
            { label: 'Faturamento', value: formatCurrency(revenue), description: 'Total dos pedidos visíveis', Icon: FaCoins },
            { label: 'Ticket médio', value: formatCurrency(averageTicket), description: 'Valor médio por pedido', Icon: FaReceipt },
            { label: 'Total de pedidos', value: String(allOrders.length), description: `${scheduledOrders.length} agendados`, Icon: FaChartLine },
            { label: 'Clientes ativos', value: String(activeCustomers), description: 'Clientes únicos no período', Icon: FaUsers },
        ],
        customers: [
            { label: 'Clientes ativos', value: String(activeCustomers), description: 'Clientes únicos', Icon: FaUsers },
            { label: 'Recorrentes', value: String(loyaltyCustomers), description: 'Com mais de um pedido', Icon: FaGift },
            { label: 'Maior cliente', value: formatCurrency(customers[0]?.total ?? 0), description: customers[0]?.customer ?? 'Sem dados', Icon: FaUser },
            { label: 'Ticket médio', value: formatCurrency(averageTicket), description: 'Média geral por pedido', Icon: FaReceipt },
        ],
        orders: [
            { label: 'Pedidos', value: String(allOrders.length), description: 'Total no período', Icon: FaReceipt },
            { label: 'Pagos', value: String(allOrders.filter((order) => order.paymentStatus === 'paid').length), description: formatCurrency(paidRevenue), Icon: IoCheckmarkCircle },
            { label: 'A receber', value: String(allOrders.filter((order) => order.paymentStatus === 'pending').length), description: 'Pendentes de pagamento', Icon: FaCreditCard },
            { label: 'Agendados', value: String(scheduledOrders.length), description: 'Pedidos futuros', Icon: FaCalendarDays },
        ],
        items: [
            { label: 'Itens vendidos', value: String(totalItems), description: 'Soma de todos os produtos', Icon: FaBoxOpen },
            { label: 'Mais vendido', value: String(items[0]?.quantity ?? 0), description: items[0]?.name ?? 'Sem dados', Icon: FaStore },
            { label: 'Receita itens', value: formatCurrency(revenue), description: 'Baseada nos pedidos', Icon: FaCoins },
            { label: 'Combos e extras', value: String(items.filter((item) => item.name.includes('Coca') || item.name.includes('Maionese') || item.name.includes('Arroz')).length), description: 'Acompanhamentos e bebidas', Icon: FaPlus },
        ],
        coupons: [
            { label: 'Cupons ativos', value: String(localCoupons.filter((coupon) => coupon.status).length), description: 'Disponíveis na loja', Icon: HiTicket },
            { label: 'Usos restantes', value: String(localCoupons.reduce((total, coupon) => total + coupon.quantidade, 0)), description: 'Limite total configurado', Icon: FaUsers },
            { label: 'Desconto previsto', value: formatCurrency(couponDiscountTotal), description: 'Estimativa da campanha', Icon: FaCoins },
            { label: 'Públicos', value: String(localCoupons.filter((coupon) => coupon.listaPublica).length), description: 'Aparecem para clientes', Icon: FaChartLine },
        ],
        loyalty: [
            { label: 'Participantes', value: String(activeCustomers), description: 'Clientes aptos no período', Icon: FaUsers },
            { label: 'Em progresso', value: String(loyaltyCustomers), description: 'Já compraram mais de uma vez', Icon: FaGift },
            { label: 'Próximos do prêmio', value: String(customers.filter((customer) => customer.orders >= 3).length), description: 'Faltando pouco', Icon: IoCheckmarkCircle },
            { label: 'Prêmio estimado', value: '1 assado', description: 'Benefício final configurado', Icon: FaStore },
        ],
        cashback: [
            { label: 'Concedido', value: formatCurrency(cashbackGranted), description: '3% sobre faturamento', Icon: FaPiggyBank },
            { label: 'Utilizado', value: formatCurrency(cashbackUsed), description: 'Resgatado em pedidos', Icon: IoCheckmarkCircle },
            { label: 'Saldo aberto', value: formatCurrency(Math.max(0, cashbackGranted - cashbackUsed)), description: 'Ainda disponível', Icon: FaCoins },
            { label: 'Expira em breve', value: formatCurrency(cashbackGranted * 0.18), description: 'Atenção operacional', Icon: FaClock },
        ],
    };

    const rankingByReport: Record<ReportType, {
        title: string;
        rows: Array<{
            label: string;
            detail: string;
            value: string;
            percent: number;
        }>;
    }> = {
        general: {
            title: 'Resumo dos melhores resultados',
            rows: [
                { label: customers[0]?.customer ?? 'Sem cliente', detail: 'Cliente com maior faturamento', value: formatCurrency(customers[0]?.total ?? 0), percent: ((customers[0]?.total ?? 0) / topCustomerTotal) * 100 },
                { label: items[0]?.name ?? 'Sem item', detail: 'Produto mais vendido', value: `${items[0]?.quantity ?? 0} un.`, percent: ((items[0]?.quantity ?? 0) / topItemQuantity) * 100 },
                { label: 'Pagamentos confirmados', detail: 'Receita já paga', value: formatCurrency(paidRevenue), percent: revenue ? (paidRevenue / revenue) * 100 : 0 },
            ],
        },
        customers: {
            title: 'Clientes por faturamento',
            rows: customers.slice(0, 5).map((customer) => ({
                label: customer.customer,
                detail: `${customer.orders} pedido${customer.orders > 1 ? 's' : ''}`,
                value: formatCurrency(customer.total),
                percent: (customer.total / topCustomerTotal) * 100,
            })),
        },
        orders: {
            title: 'Distribuição operacional',
            rows: [...buildStatusStats(allOrders), ...buildPaymentStats(allOrders)].map((row) => ({
                label: row.label,
                detail: 'Quantidade de pedidos',
                value: String(row.pedidos),
                percent: allOrders.length ? (row.pedidos / allOrders.length) * 100 : 0,
            })),
        },
        items: {
            title: 'Produtos com maior giro',
            rows: items.slice(0, 6).map((item) => ({
                label: item.name,
                detail: 'Quantidade vendida',
                value: `${item.quantity} un.`,
                percent: (item.quantity / topItemQuantity) * 100,
            })),
        },
        coupons: {
            title: 'Campanhas de cupom',
            rows: localCoupons.map((coupon) => ({
                label: coupon.nome,
                detail: coupon.descricao,
                value: coupon.tipo === 'porcentagem' ? `${coupon.valor}%` : formatCurrency(coupon.valor),
                percent: Math.min(100, coupon.quantidade),
            })),
        },
        loyalty: {
            title: 'Fidelidade por etapa',
            rows: [
                { label: 'Primeiro pedido', detail: 'Clientes iniciando a jornada', value: String(customers.filter((customer) => customer.orders === 1).length), percent: 45 },
                { label: 'Segundo pedido', detail: 'Clientes em recorrência', value: String(customers.filter((customer) => customer.orders === 2).length), percent: 65 },
                { label: 'Perto do prêmio', detail: 'Clientes com 3+ pedidos', value: String(customers.filter((customer) => customer.orders >= 3).length), percent: 82 },
            ],
        },
        cashback: {
            title: 'Uso do cashback',
            rows: [
                { label: 'Cashback concedido', detail: 'Total gerado no período', value: formatCurrency(cashbackGranted), percent: 100 },
                { label: 'Cashback utilizado', detail: 'Clientes que resgataram', value: formatCurrency(cashbackUsed), percent: cashbackGranted ? (cashbackUsed / cashbackGranted) * 100 : 0 },
                { label: 'Saldo em aberto', detail: 'Benefício ainda disponível', value: formatCurrency(Math.max(0, cashbackGranted - cashbackUsed)), percent: cashbackGranted ? ((cashbackGranted - cashbackUsed) / cashbackGranted) * 100 : 0 },
            ],
        },
    };

    return (
        <main className="min-h-[calc(100vh-61px)] bg-[#f3f5f8] p-3">
            <ReportNavigation reportType={reportType} />

            <section className="mt-3 rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
                {reportType === 'general' ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <span className="text-[10px] font-extrabold uppercase text-[#f97316]">Filtros do relatório</span>
                            <h2 className="mt-0.5 text-[18px] font-extrabold leading-6 text-dark-950">
                                Período analisado
                            </h2>
                            <p className="mt-1 text-[12px] font-semibold leading-5 text-dark-500">
                                {selectedReportDate
                                    ? `Exibindo pedidos de ${selectedReportPeriodLabel}.`
                                    : 'Exibindo todos os pedidos cadastrados no painel.'}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-[214px]">
                                {reportDateFilterOpen && (
                                    <button
                                        type="button"
                                        className="fixed inset-0 z-20 cursor-default"
                                        aria-label="Fechar calendário"
                                        onClick={() => setReportDateFilterOpen(false)}
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => setReportDateFilterOpen((open) => !open)}
                                    className={cn(
                                        "flex h-9 w-full items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 pr-8 text-left text-[12px] font-extrabold shadow-none transition hover:bg-neutral-50",
                                        selectedReportDate ? "text-dark-900" : "text-dark-500",
                                        reportDateFilterOpen && "border-[#f97316] ring-2 ring-[#f97316]/15"
                                    )}
                                >
                                    <FaCalendarDays className="shrink-0 text-[#f97316]" size={14} />
                                    <span className="truncate">{selectedReportPeriodLabel}</span>
                                </button>
                                {selectedReportDate && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setSelectedReportDate('');
                                            setReportDateFilterOpen(false);
                                        }}
                                        className="absolute right-1.5 top-1/2 z-30 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#f3f5f8] text-dark-500 transition hover:bg-[#fff3ea] hover:text-[#f97316]"
                                        aria-label="Limpar filtro de data"
                                    >
                                        <FaXmark size={10} />
                                    </button>
                                )}
                                {reportDateFilterOpen && (
                                    <div className="absolute right-0 top-[calc(100%+8px)] z-30 rounded-md border border-neutral-200 bg-white p-2 shadow-xl">
                                        <Calendar
                                            mode="single"
                                            selected={selectedReportCalendarDate}
                                            onSelect={(date) => {
                                                if (!date) {
                                                    return;
                                                }

                                                setSelectedReportDate(formatDateToISO(date));
                                                setReportDateFilterOpen(false);
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
                                                {selectedReportDate ? selectedReportPeriodLabel : 'Nenhuma data'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedReportDate('');
                                                    setReportDateFilterOpen(false);
                                                }}
                                                className="h-7 rounded-md px-2 text-[11px] font-extrabold text-[#f97316] transition hover:bg-[#fff3ea]"
                                            >
                                                Limpar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button className="h-9 rounded-md bg-[#2f8df6] px-3 text-[12px] font-extrabold text-white hover:bg-[#1f7ce0]">
                                Exportar relatório
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-5">
                        <div className="min-w-0">
                            <span className="text-[10px] font-extrabold uppercase text-[#f97316]">Relatórios</span>
                            <h1 className="mt-0.5 text-[22px] font-extrabold leading-7 text-dark-950">
                                {currentReport.title}
                            </h1>
                            <p className="mt-1 text-[13px] font-semibold leading-5 text-dark-500">
                                {currentReport.description}
                            </p>
                        </div>
                        <button className="hidden h-9 rounded-md bg-[#2f8df6] px-3 text-[12px] font-extrabold text-white hover:bg-[#1f7ce0] lg:block">
                            Exportar relatório
                        </button>
                    </div>
                )}
            </section>

            <section className="mt-3 grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
                {metricsByReport[reportType].map((metric) => (
                    <ReportMetricCard key={metric.label} {...metric} />
                ))}
            </section>

            <section className="mt-3 grid gap-3 2xl:grid-cols-[minmax(0,1fr)_380px]">
                <article className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-extrabold uppercase text-[#f97316]">Gráfico</span>
                            <h2 className="text-[16px] font-extrabold text-dark-900">{chartByReport[reportType].title}</h2>
                            <p className="text-[12px] font-semibold text-dark-500">{chartByReport[reportType].description}</p>
                        </div>
                        <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-extrabold text-[#2f8df6]">
                            Semanal
                        </span>
                    </div>
                    <div className="mt-3">
                        {chartByReport[reportType].content}
                    </div>
                </article>

                <ReportRanking {...rankingByReport[reportType]} />
            </section>
        </main>
    );
}

function AdminOrdersDashboardContent() {
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const isScheduledView = currentView === 'scheduled';
    const isReportsView = currentView === 'reports';
    const reportType = normalizeReportType(searchParams.get('report'));
    const [orders, setOrders] = React.useState(initialOrders);
    const [scheduledOrders, setScheduledOrders] = React.useState(initialScheduledOrders);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedChannel, setSelectedChannel] = React.useState<'all' | OrderChannel>('all');
    const [selectedProductFilter, setSelectedProductFilter] = React.useState<ProductFilter>('all');
    const [scheduledSearchTerm, setScheduledSearchTerm] = React.useState('');
    const [selectedScheduledDay, setSelectedScheduledDay] = React.useState<ScheduledDay>('saturday');
    const [selectedScheduledDate, setSelectedScheduledDate] = React.useState('');
    const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);
    const [autoAcceptOrders, setAutoAcceptOrders] = React.useState(false);
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

    const moveOrder = (orderId: string, status: OrderStatus) => {
        setOrders((currentOrders) => currentOrders.map((order) => (
            order.id === orderId ? { ...order, status } : order
        )));
    };

    const resetOrders = () => {
        setOrders(initialOrders);
        setScheduledOrders(initialScheduledOrders);
        setSelectedProductFilter('all');
        setSelectedScheduledDay('saturday');
        setSelectedScheduledDate('');
        setScheduledSearchTerm('');
        setFilterMenuOpen(false);
        setAutoAcceptOrders(false);
    };

    const handleCardDragStart = (event: React.DragEvent<HTMLElement>, orderId: string) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', orderId);
        setDraggedOrderId(orderId);
    };

    const handleCardDragEnd = () => {
        setDraggedOrderId(null);
        setDragOverColumn(null);
    };

    const handleDropOrder = (orderId: string | null, status: OrderStatus) => {
        if (!orderId) {
            handleCardDragEnd();
            return;
        }

        setOrders((currentOrders) => currentOrders.map((order) => (
            order.id === orderId ? { ...order, status } : order
        )));
        handleCardDragEnd();
    };

    const handleRemoveOrder = (orderId: string) => {
        setOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId));
        setSelectedOrder(null);
    };

    const handlePaymentStatusChange = (orderId: string, paymentStatus: PaymentStatus) => {
        setOrders((currentOrders) => currentOrders.map((order) => (
            order.id === orderId ? { ...order, paymentStatus } : order
        )));
        setSelectedOrder((currentOrder) => (
            currentOrder?.id === orderId ? { ...currentOrder, paymentStatus } : currentOrder
        ));
    };

    const handleSendScheduledToProduction = (orderId: string) => {
        const scheduledOrder = scheduledOrders.find((order) => order.id === orderId);

        if (!scheduledOrder) {
            return;
        }

        const productionOrder: AdminOrder = {
            id: scheduledOrder.id,
            customer: scheduledOrder.customer,
            phone: scheduledOrder.phone,
            status: 'production',
            channel: 'retirada',
            pickupWindow: `${scheduledOrder.scheduledDateLabel}, ${scheduledOrder.scheduledWindow}`,
            createdAt: 'agendado',
            paymentMethod: scheduledOrder.paymentMethod,
            paymentStatus: scheduledOrder.paymentStatus,
            total: scheduledOrder.total,
            items: scheduledOrder.items,
        };

        setScheduledOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId));
        setOrders((currentOrders) => [productionOrder, ...currentOrders]);
        setSelectedScheduledOrder(null);
    };

    const handleSendScheduledDayToProduction = (day: ScheduledOrder['scheduledDay'], date?: string) => {
        const dayOrders = scheduledOrders.filter((order) => (
            order.scheduledDay === day && (!date || order.scheduledDate === date)
        ));

        if (dayOrders.length === 0) {
            return;
        }

        const productionOrders: AdminOrder[] = dayOrders.map((scheduledOrder) => ({
            id: scheduledOrder.id,
            customer: scheduledOrder.customer,
            phone: scheduledOrder.phone,
            status: 'production',
            channel: 'retirada',
            pickupWindow: `${scheduledOrder.scheduledDateLabel}, ${scheduledOrder.scheduledWindow}`,
            createdAt: 'agendado',
            paymentMethod: scheduledOrder.paymentMethod,
            paymentStatus: scheduledOrder.paymentStatus,
            total: scheduledOrder.total,
            items: scheduledOrder.items,
        }));

        setScheduledOrders((currentOrders) => currentOrders.filter((order) => (
            order.scheduledDay !== day || (Boolean(date) && order.scheduledDate !== date)
        )));
        setOrders((currentOrders) => [...productionOrders, ...currentOrders]);
        setSelectedScheduledOrder((currentOrder) => (
            currentOrder?.scheduledDay === day && (!date || currentOrder.scheduledDate === date) ? null : currentOrder
        ));
    };

    const handleCancelScheduledOrder = (orderId: string) => {
        setScheduledOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId));
        setSelectedScheduledOrder((currentOrder) => (
            currentOrder?.id === orderId ? null : currentOrder
        ));
    };

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

    if (isReportsView) {
        return (
            <ReportsView
                orders={orders}
                reportType={reportType}
                scheduledOrders={scheduledOrders}
            />
        );
    }

    return (
        <main className="min-h-[calc(100vh-61px)] p-3">
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
                order={selectedOrder}
                open={Boolean(selectedOrder)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedOrder(null);
                    }
                }}
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
