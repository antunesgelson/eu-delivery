"use client";

import { useQuery } from "@tanstack/react-query";
import { api, mostrarErro } from "@/service/api";
import { lerConfiguracao, type Configuracao } from "@/hook/useAgendamento";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import useAuth from "@/hook/useAuth";
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
  FaClipboardList,
  FaGear,
  FaGift,
  FaGlobe,
  FaPiggyBank,
  FaReceipt,
  FaRegCalendarCheck,
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
};

const reportMenuItems: MenuItem[] = [
  {
    title: "Relatório geral",
    href: "/admin/dashboard?view=reports&report=general",
    Icon: FaChartLine,
  },
  {
    title: "Clientes",
    href: "/admin/dashboard?view=reports&report=customers",
    Icon: FaUsers,
  },
  {
    title: "Pedidos",
    href: "/admin/dashboard?view=reports&report=orders",
    Icon: FaReceipt,
  },
  {
    title: "Itens",
    href: "/admin/dashboard?view=reports&report=items",
    Icon: FaBoxOpen,
  },
  {
    title: "Cupons",
    href: "/admin/dashboard?view=reports&report=coupons",
    Icon: HiTicket,
  },
  {
    title: "Fidelidade",
    href: "/admin/dashboard?view=reports&report=loyalty",
    Icon: FaGift,
  },
  {
    title: "Cashback",
    href: "/admin/dashboard?view=reports&report=cashback",
    Icon: FaPiggyBank,
  },
];

const menuItems: MenuItem[] = [
  { title: "Meus pedidos", href: "/admin/dashboard", Icon: FaClipboardList },
  { title: "Pedidos PDV", href: "/admin/pedidos-pdv", Icon: FaCashRegister },
  {
    title: "Pedidos agendados",
    href: "/admin/dashboard?view=scheduled",
    Icon: FaRegCalendarCheck,
  },
  {
    title: "Gestor de cardápio",
    href: "/admin/cardapio",
    Icon: BiSolidFoodMenu,
  },
  { title: "Cupons", href: "/admin/cupom", Icon: HiTicket },
  {
    title: "Relatórios",
    href: "/admin/dashboard?view=reports&report=general",
    Icon: FaChartLine,
    children: reportMenuItems,
  },
  { title: "Configurações", href: "/admin/config", Icon: FaGear },
];

function getAdminPageInfo(
  pathname: string | null,
  currentView: string | null,
  productId: string | null,
  currentReport: string | null,
) {
  if (pathname === "/admin/dashboard" && currentView === "scheduled") {
    return {
      eyebrow: "Agenda de produção",
      headerTitle: "Pedidos agendados",
      browserTitle: "Pedidos Agendados",
    };
  }

  if (pathname === "/admin/dashboard" && currentView === "reports") {
    const selectedReport = reportMenuItems.find((item) =>
      item.href.includes(`report=${currentReport ?? "general"}`),
    );

    return {
      eyebrow: "Análises",
      headerTitle: selectedReport?.title ?? "Relatório geral",
      browserTitle: selectedReport?.title ?? "Relatórios",
    };
  }

  if (pathname === "/admin/cardapio") {
    return {
      eyebrow: "Gestão de pedidos",
      headerTitle: "Gestor de cardápio",
      browserTitle: "Gestor de Cardápio",
    };
  }

  if (pathname === "/admin/pedidos-pdv") {
    return {
      eyebrow: "Balcão e delivery",
      headerTitle: "Pedidos PDV",
      browserTitle: "Pedidos PDV",
    };
  }

  if (pathname === "/admin/cardapio/novo-item") {
    const isEditingItem = Boolean(productId);

    return {
      eyebrow: "Gestor de cardápio",
      headerTitle: isEditingItem ? "Editar item" : "Adicionar item",
      browserTitle: isEditingItem ? "Editar Item" : "Adicionar Item",
    };
  }

  if (pathname === "/admin/cupom") {
    return {
      eyebrow: "Gestão de pedidos",
      headerTitle: "Cupons",
      browserTitle: "Cupons",
    };
  }

  if (pathname === "/admin/config") {
    return {
      eyebrow: "Gestão de pedidos",
      headerTitle: "Configurações",
      browserTitle: "Configurações",
    };
  }

  return {
    eyebrow: "Gestão de pedidos",
    headerTitle: "Meus pedidos",
    browserTitle: "Meus Pedidos",
  };
}

function AdminHeaderTitle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view");
  const productId = searchParams.get("productId");
  const currentReport = searchParams.get("report");
  const pageInfo = getAdminPageInfo(
    pathname,
    currentView,
    productId,
    currentReport,
  );

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
  const currentView = searchParams.get("view");
  const productId = searchParams.get("productId");
  const currentReport = searchParams.get("report");
  const pageInfo = getAdminPageInfo(
    pathname,
    currentView,
    productId,
    currentReport,
  );

  React.useLayoutEffect(() => {
    document.title = `Assados Zanini | ${pageInfo.browserTitle}`;
  }, [pageInfo.browserTitle]);

  return null;
}

function AdminMenuItem({ item }: { item: MenuItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view");
  const currentReport = searchParams.get("report") ?? "general";
  const viewParam = item.href.includes("?view=")
    ? item.href.split("?view=")[1]
    : null;
  const isReportsGroup =
    item.children?.length && item.href.includes("view=reports");
  const active = isReportsGroup
    ? pathname === "/admin/dashboard" && currentView === "reports"
    : viewParam
      ? pathname === "/admin/dashboard" && currentView === viewParam
      : item.href === "/admin/dashboard"
        ? pathname === "/admin/dashboard" && !currentView
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
            : "text-white/72 hover:bg-white/10 hover:text-white",
        )}
      >
        <Icon size={15} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">{item.title}</span>
        {item.badge && (
          <span
            className={cn(
              "flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold",
              active ? "bg-white text-[#f97316]" : "bg-white/10 text-white/85",
            )}
          >
            {item.badge}
          </span>
        )}
        {item.children && (
          <FaChevronDown
            size={11}
            className={cn(
              "text-current/70 transition-transform",
              expanded && "rotate-180",
            )}
          />
        )}
      </Link>

      {item.children && expanded && (
        <div className="mt-1 space-y-1 pl-7">
          {item.children.map((child) => {
            const ChildIcon = child.Icon;
            const childReport = child.href.split("report=")[1];
            const childActive = currentReport === childReport;

            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-md px-2 text-[11px] font-bold transition-colors",
                  childActive
                    ? "bg-white text-[#143d60] shadow-sm"
                    : "text-white/58 hover:bg-white/10 hover:text-white",
                )}
              >
                <ChildIcon size={12} className="shrink-0" />
                <span className="truncate">{child.title}</span>
                {child.title === "Cashback" && (
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

function AdminNavigation({ search = "" }: { search?: string }) {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = menuItems.filter((item) =>
    `${item.title} ${item.children?.map((c) => c.title).join(" ") ?? ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(term),
  );
  return (
    <React.Suspense
      fallback={
        <div className="space-y-1">
          {filtered.map((item) => (
            <div key={item.title} className="h-10 rounded-md bg-white/5" />
          ))}
        </div>
      }
    >
      {filtered.map((item) => (
        <AdminMenuItem key={item.title} item={item} />
      ))}
    </React.Suspense>
  );
}

function EstadoLoja() {
  const config = useQuery<Configuracao[]>({
    queryKey: ["configuracao"],
    queryFn: async ({ signal }) =>
      (await api.get("/configuracao", { signal })).data,
    refetchInterval: 60000,
    retry: false,
  });
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const rules = lerConfiguracao<
    Record<
      string,
      {
        abertura?: string;
        fechamento?: string;
        inicio_intervalo?: string;
        fim_intervalo?: string;
      }
    >
  >(config.data, "HORARIOATENDIMENTO", {});
  let label = "Consultando horário…";
  if (config.isError) label = "Horário indisponível";
  else if (config.data && now) {
    const day = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "America/Sao_Paulo",
    }).format(now);
    const key = (
      {
        Sun: "dom",
        Mon: "seg",
        Tue: "ter",
        Wed: "qua",
        Thu: "qui",
        Fri: "sex",
        Sat: "sab",
      } as Record<string, string>
    )[day];
    const rule =
      rules[key] ??
      (["sab", "dom"].includes(key)
        ? { abertura: "11:30", fechamento: "14:00" }
        : {});
    const time = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "America/Sao_Paulo",
    }).format(now);
    const aberto =
      rule.abertura &&
      rule.fechamento &&
      time >= rule.abertura &&
      time < rule.fechamento;
    const pausa =
      rule.inicio_intervalo &&
      rule.fim_intervalo &&
      time >= rule.inicio_intervalo &&
      time < rule.fim_intervalo;
    label = aberto
      ? pausa
        ? "Em intervalo"
        : "Em atendimento"
      : "Fora do atendimento";
  }
  return (
    <Link
      href="/admin/config"
      className="mt-1 block text-[10px] text-white/80"
      aria-label={`Horário da loja: ${label}`}
    >
      {label}
    </Link>
  );
}
function PedidosPendentes() {
  const { user } = useAuth();
  const query = useQuery<{ total: number }>({
    queryKey: ["pedidos", "pendentes"],
    queryFn: async ({ signal }) =>
      (
        await api.get("/admin/pedidos", {
          params: { status: "active", limit: 1 },
          signal,
        })
      ).data,
    enabled: Boolean(user?.isAdmin),
    refetchInterval: 15000,
    retry: false,
  });
  const label = query.isError
    ? "Consultar pedidos em andamento"
    : query.data
      ? `${query.data.total} pedidos em andamento`
      : "Consultar pedidos";
  return (
    <Link
      href="/admin/dashboard"
      aria-label={label}
      title={label}
      className="flex h-9 items-center gap-1 rounded-md border px-2 text-sm"
    >
      <FaBell aria-hidden="true" />
      {!query.isError && query.data && <span>{query.data.total}</span>}
    </Link>
  );
}
export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, sair } = useAuth();
  const pathname = usePathname();
  const [mobile, setMobile] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [leaving, setLeaving] = React.useState(false);
  React.useEffect(() => {
    setMobile(false);
  }, [pathname]);
  const sidebar = (
    <>
      <div className="flex min-h-[62px] items-center gap-2 border-b border-white/10 px-3 py-2">
        <Image
          src={AssadosZaniniSymbol}
          alt="Assados Zanini"
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-contain"
        />
        <div className="min-w-0">
          <strong className="block text-sm">Assados Zanini</strong>
          <EstadoLoja />
        </div>
      </div>
      <Link
        href="/admin/pedidos-pdv"
        className="mx-2.5 mt-3 flex items-center gap-2 rounded-md bg-white/10 p-2.5 text-sm font-bold"
      >
        <FaCashRegister /> Abrir PDV
      </Link>
      <label className="mx-2.5 mt-3 flex items-center gap-2 rounded-md bg-[#103553] px-2.5">
        <IoSearch aria-hidden="true" />
        <input
          aria-label="Buscar no menu"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar no menu"
          className="h-9 min-w-0 w-full bg-transparent text-xs text-white placeholder:text-white/60"
        />
      </label>
      <nav
        aria-label="Menu administrativo"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setMobile(false);
        }}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-4"
      >
        <AdminNavigation search={search} />
      </nav>
      <div className="space-y-2 border-t border-white/10 p-3">
        <Link
          href="/profile"
          className="block truncate text-sm font-semibold"
          onClick={() => setMobile(false)}
        >
          {user?.nome || "Administrador"} · Minha conta
        </Link>
        <button
          disabled={leaving}
          className="rounded border border-white/30 px-3 py-1 text-xs disabled:opacity-50"
          onClick={async () => {
            setLeaving(true);
            try {
              await sair();
            } catch (e) {
              mostrarErro(e);
              setLeaving(false);
            }
          }}
        >
          {leaving ? "Saindo…" : "Sair da conta"}
        </button>
      </div>
    </>
  );
  return (
    <div className="min-h-screen bg-[#f3f5f8] text-dark-900">
      <React.Suspense fallback={null}>
        <AdminDocumentTitle />
      </React.Suspense>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[208px] flex-col bg-[#143d60] text-white shadow-xl xl:flex">
        {sidebar}
      </aside>
      <Dialog open={mobile} onOpenChange={setMobile}>
        <DialogContent className="inset-y-0 left-0 flex h-dvh max-h-dvh w-[280px] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-none bg-[#143d60] p-0 text-white">
          <DialogTitle className="sr-only">
            Navegação administrativa
          </DialogTitle>
          <DialogDescription className="sr-only">
            Acesse as funções da loja.
          </DialogDescription>
          {sidebar}
        </DialogContent>
      </Dialog>
      <div className="min-h-screen min-w-0 xl:pl-[208px]">
        <header className="sticky top-0 z-30 border-b bg-white/95 px-3 py-2 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setMobile(true)}
              aria-label="Abrir menu administrativo"
              className="rounded border px-2 py-1.5 text-sm xl:hidden"
            >
              Menu
            </button>
            <React.Suspense fallback={<span>Painel administrativo</span>}>
              <AdminHeaderTitle />
            </React.Suspense>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/"
                className="flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs font-bold"
              >
                <FaGlobe />
                <span className="hidden sm:inline">Ver loja</span>
                <span className="sr-only sm:hidden">Ver loja</span>
              </Link>
              <PedidosPendentes />
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
