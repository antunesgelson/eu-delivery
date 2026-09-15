'use client'

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

import AssadosZaniniSymbol from "@/assets/logo/assados-zanini-symbol.jpg";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { BiSolidFoodMenu } from "react-icons/bi";
import {
    FaBell,
    FaBoxOpen,
    FaCashRegister,
    FaChartLine,
    FaChevronDown,
    FaChevronRight,
    FaClipboardList,
    FaGear,
    FaGift,
    FaGlobe,
    FaPiggyBank,
    FaReceipt,
    FaRegCalendarCheck,
    FaStore,
    FaUsers,
} from "react-icons/fa6";
import { HiTicket } from "react-icons/hi2";
import { IoSearch } from "react-icons/io5";

type MenuItem = {
    title: string;
    href: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
    children?: MenuItem[];
}

const reportMenuItems: MenuItem[] = [
    { title: 'Relatório geral', href: '/admin/dashboard?view=reports&report=general', Icon: FaChartLine },
    { title: 'Clientes', href: '/admin/dashboard?view=reports&report=customers', Icon: FaUsers },
    { title: 'Pedidos', href: '/admin/dashboard?view=reports&report=orders', Icon: FaReceipt },
    { title: 'Itens', href: '/admin/dashboard?view=reports&report=items', Icon: FaBoxOpen },
    { title: 'Cupons', href: '/admin/dashboard?view=reports&report=coupons', Icon: HiTicket },
    { title: 'Fidelidade', href: '/admin/dashboard?view=reports&report=loyalty', Icon: FaGift },
    { title: 'Cashback', href: '/admin/dashboard?view=reports&report=cashback', Icon: FaPiggyBank },
];

const menuItems: MenuItem[] = [
    { title: 'Meus pedidos', href: '/admin/dashboard', Icon: FaClipboardList, badge: '4' },
    { title: 'Pedidos PDV', href: '/admin/pedidos-pdv', Icon: FaCashRegister },
    { title: 'Pedidos agendados', href: '/admin/dashboard?view=scheduled', Icon: FaRegCalendarCheck, badge: '16' },
    { title: 'Gestor de cardápio', href: '/admin/cardapio', Icon: BiSolidFoodMenu },
    { title: 'Cupons', href: '/admin/cupom', Icon: HiTicket },
    { title: 'Relatórios', href: '/admin/dashboard?view=reports&report=general', Icon: FaChartLine, children: reportMenuItems },
    { title: 'Configurações', href: '/admin/config', Icon: FaGear },
];

function getAdminPageInfo(pathname: string | null, currentView: string | null, productId: string | null, currentReport: string | null) {
    if (pathname === '/admin/dashboard' && currentView === 'scheduled') {
        return {
            eyebrow: 'Agenda de produção',
            headerTitle: 'Pedidos agendados',
            browserTitle: 'Pedidos Agendados',
        };
    }

    if (pathname === '/admin/dashboard' && currentView === 'reports') {
        const selectedReport = reportMenuItems.find((item) => item.href.includes(`report=${currentReport ?? 'general'}`));

        return {
            eyebrow: 'Análises',
            headerTitle: selectedReport?.title ?? 'Relatório geral',
            browserTitle: selectedReport?.title ?? 'Relatórios',
        };
    }

    if (pathname === '/admin/cardapio') {
        return {
            eyebrow: 'Gestão de pedidos',
            headerTitle: 'Gestor de cardápio',
            browserTitle: 'Gestor de Cardápio',
        };
    }

    if (pathname === '/admin/pedidos-pdv') {
        return {
            eyebrow: 'Balcão e delivery',
            headerTitle: 'Pedidos PDV',
            browserTitle: 'Pedidos PDV',
        };
    }

    if (pathname === '/admin/cardapio/novo-item') {
        const isEditingItem = Boolean(productId);

        return {
            eyebrow: 'Gestor de cardápio',
            headerTitle: isEditingItem ? 'Editar item' : 'Adicionar item',
            browserTitle: isEditingItem ? 'Editar Item' : 'Adicionar Item',
        };
    }

    if (pathname === '/admin/cupom') {
        return {
            eyebrow: 'Gestão de pedidos',
            headerTitle: 'Cupons',
            browserTitle: 'Cupons',
        };
    }

    if (pathname === '/admin/config') {
        return {
            eyebrow: 'Gestão de pedidos',
            headerTitle: 'Configurações',
            browserTitle: 'Configurações',
        };
    }

    return {
        eyebrow: 'Gestão de pedidos',
        headerTitle: 'Meus pedidos',
        browserTitle: 'Meus Pedidos',
    };
}

function AdminHeaderTitle() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const productId = searchParams.get('productId');
    const currentReport = searchParams.get('report');
    const pageInfo = getAdminPageInfo(pathname, currentView, productId, currentReport);

    return (
        <div className="min-w-0">
            <Typography as="span" variant="overline" tone="accent">
                {pageInfo.eyebrow}
            </Typography>
            <Typography variant="title" truncate className="leading-5">
                {pageInfo.headerTitle}
            </Typography>
        </div>
    );
}

function AdminDocumentTitle() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const productId = searchParams.get('productId');
    const currentReport = searchParams.get('report');
    const pageInfo = getAdminPageInfo(pathname, currentView, productId, currentReport);

    React.useLayoutEffect(() => {
        document.title = `Assados Zanini | ${pageInfo.browserTitle}`;
    }, [pageInfo.browserTitle]);

    return null;
}

function AdminMenuItem({ item }: { item: MenuItem }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const currentReport = searchParams.get('report') ?? 'general';
    const viewParam = item.href.includes('?view=') ? item.href.split('?view=')[1] : null;
    const isReportsGroup = item.children?.length && item.href.includes('view=reports');
    const active = isReportsGroup
        ? pathname === '/admin/dashboard' && currentView === 'reports'
        : viewParam
        ? pathname === '/admin/dashboard' && currentView === viewParam
        : item.href === '/admin/dashboard'
            ? pathname === '/admin/dashboard' && !currentView
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);
    const Icon = item.Icon;
    const expanded = Boolean(isReportsGroup && active);

    return (
        <div>
            <Link
                href={item.href}
                className={cn(
                    "group flex h-9 items-center gap-2 rounded-md px-2.5 text-[12px] font-bold transition-colors",
                    active
                        ? "bg-[#f97316] text-white shadow-sm"
                        : "text-white/72 hover:bg-white/10 hover:text-white"
                )}
            >
                <Icon size={15} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {item.badge && (
                    <span className={cn(
                        "flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold",
                        active ? "bg-white text-[#f97316]" : "bg-white/10 text-white/85"
                    )}>
                        {item.badge}
                    </span>
                )}
                {item.children && (
                    <FaChevronDown
                        size={11}
                        className={cn("text-current/70 transition-transform", expanded && "rotate-180")}
                    />
                )}
            </Link>

            {item.children && expanded && (
                <div className="mt-1 space-y-1 pl-7">
                    {item.children.map((child) => {
                        const ChildIcon = child.Icon;
                        const childReport = child.href.split('report=')[1];
                        const childActive = currentReport === childReport;

                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                    "flex h-8 items-center gap-2 rounded-md px-2 text-[11px] font-bold transition-colors",
                                    childActive
                                        ? "bg-white text-[#143d60] shadow-sm"
                                        : "text-white/58 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <ChildIcon size={12} className="shrink-0" />
                                <span className="truncate">{child.title}</span>
                                {child.title === 'Cashback' && (
                                    <span className="ml-auto rounded-full bg-[#f97316] px-1.5 py-0.5 text-[8px] font-extrabold text-white">
                                        Novo
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function AdminNavigation() {
    return (
        <React.Suspense fallback={(
            <div className="space-y-1">
                {menuItems.map((item) => (
                    <div key={item.title} className="h-10 rounded-md bg-white/5" />
                ))}
            </div>
        )}>
            {menuItems.map((item) => (
                <AdminMenuItem key={item.title} item={item} />
            ))}
        </React.Suspense>
    );
}

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#f3f5f8] text-dark-900">
            <React.Suspense fallback={null}>
                <AdminDocumentTitle />
            </React.Suspense>

            <section className="flex min-h-screen items-center justify-center px-6 xl:hidden">
                <div className="max-w-[420px] rounded-md border bg-white p-6 text-center shadow-sm">
                    <Image
                        src={AssadosZaniniSymbol}
                        alt="Assados Zanini"
                        width={72}
                        height={72}
                        className="mx-auto h-[72px] w-[72px] rounded-full bg-[#f4d7a8] object-contain"
                        priority
                    />
                    <span className="mt-5 inline-flex rounded-full bg-[#fff3ea] px-3 py-1 text-[11px] font-extrabold uppercase text-[#f97316]">
                        Painel desktop
                    </span>
                    <h1 className="mt-3 text-[24px] font-extrabold leading-7 text-dark-900">
                        Acesse o admin pelo computador
                    </h1>
                    <p className="mt-3 text-[14px] leading-6 text-dark-500">
                        O painel da Assados Zanini foi pensado para operação em tela grande, com kanban, filtros e menu lateral.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#f97316] px-5 text-[14px] font-extrabold text-white hover:bg-[#ea6409]"
                    >
                        Voltar para a loja
                    </Link>
                </div>
            </section>

            <div className="hidden min-h-screen xl:block">
            <aside className="fixed inset-y-0 left-0 z-40 flex w-[208px] flex-col bg-[#143d60] text-white shadow-xl">
                <div className="flex h-[62px] items-center gap-2 border-b border-white/10 px-3">
                    <Image
                        src={AssadosZaniniSymbol}
                        alt="Assados Zanini"
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full border border-white/30 bg-[#f4d7a8] object-contain"
                        priority
                    />
                    <div className="min-w-0">
                        <strong className="block truncate text-[14px] leading-5">Assados Zanini</strong>
                        <span className="mt-0.5 inline-flex rounded-full bg-[#ef5b2a] px-2 py-0.5 text-[9px] font-extrabold uppercase leading-none">
                            Fechado
                        </span>
                    </div>
                </div>

                <div className="px-2.5 py-3">
                    <div className="flex h-9 items-center gap-2 rounded-md bg-white/10 px-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f97316]">
                            <FaStore size={12} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="block text-[10px] font-extrabold uppercase text-white/55">Caixa</span>
                            <strong className="block text-[12px] leading-4">Aberto</strong>
                        </div>
                        <FaChevronRight size={11} className="text-white/45" />
                    </div>
                </div>

                <div className="border-y border-white/10 px-2.5 py-2.5">
                    <div className="flex h-9 items-center gap-2 rounded-md bg-[#103553] px-2.5 text-white/55">
                        <IoSearch size={15} />
                        <span className="truncate text-[11px] font-semibold">Procurando por algo?</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
                    <span className="mb-2 block px-2.5 text-[9px] font-extrabold uppercase tracking-wide text-white/42">
                        Seu dia a dia
                    </span>
                    <AdminNavigation />
                </nav>

                <div className="p-2.5">
                    <div className="rounded-lg bg-[#0f3452] p-2">
                        <div className="flex items-center gap-2">
                            <Image
                                src={AssadosZaniniSymbol}
                                alt="Assados Zanini"
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-full bg-[#f4d7a8] object-contain"
                            />
                            <div className="min-w-0 flex-1">
                                <strong className="block truncate text-[11px]">Gelson Antunes</strong>
                                <span className="text-[10px] text-white/55">Loja principal</span>
                            </div>
                            <FaChevronRight size={11} className="text-white/45" />
                        </div>
                    </div>
                </div>
            </aside>

            <div className="min-h-screen pl-[208px]">
                <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-2 backdrop-blur">
                    <div className="flex items-center justify-between gap-4">
                        <React.Suspense fallback={(
                            <div className="min-w-0">
                                <span className="text-[10px] font-extrabold uppercase text-[#f97316]">Gestão de pedidos</span>
                                <h1 className="truncate text-[18px] font-extrabold leading-5 text-dark-900">Meus pedidos</h1>
                            </div>
                        )}>
                            <AdminHeaderTitle />
                        </React.Suspense>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/"
                                className="hidden h-8 items-center gap-1.5 rounded-md border bg-white px-3 text-[12px] font-bold text-dark-700 hover:bg-[#f7f7f7] sm:flex"
                            >
                                <FaGlobe size={13} />
                                Ver loja
                            </Link>
                            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border bg-white text-dark-700">
                                <FaBell size={15} />
                                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ef5b2a] ring-2 ring-white" />
                            </button>
                            <div className="flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-2.5">
                                <Image
                                    src={AssadosZaniniSymbol}
                                    alt="Assados Zanini"
                                    width={30}
                                    height={30}
                                    className="h-7 w-7 rounded-full bg-[#f4d7a8] object-contain"
                                />
                                <span className="hidden text-[12px] font-extrabold text-dark-800 sm:inline">Assados Zanini</span>
                            </div>
                        </div>
                    </div>
                </header>

                {children}
            </div>
            </div>
        </div>
    );
}
