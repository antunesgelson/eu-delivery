"use client";
import { useCuponsAdmin } from "@/hook/useAdminData";

import { useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import {
  FaCalendarDay,
  FaChevronDown,
  FaCircleCheck,
  FaCircleExclamation,
  FaClock,
  FaEye,
  FaEyeSlash,
  FaMagnifyingGlass,
  FaMoneyBillWave,
  FaPause,
  FaPenToSquare,
  FaPercent,
  FaPlay,
  FaPlus,
  FaRegCopy,
  FaTag,
  FaTrashCan,
  FaUsers,
} from "react-icons/fa6";
import { HiTicket } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useForm, type FieldPathValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cupomSchema, decimal, type CouponFormState } from "./schema";
import { dataDaLoja } from "@/hook/useAgendamento";
import { CupomDTO } from "@/dto/cupomDTO";
import { cn } from "@/lib/utils";

type CouponFilter = "todos" | "ativos" | "pausados" | "expirados" | "publicos";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function getInitialCouponForm(): CouponFormState {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    nome: "",
    descricao: "",
    tipo: "porcentagem",
    valor: "",
    valorMinimoGasto: "",
    quantidade: "100",
    validade: nextMonth.toISOString().slice(0, 10),
    listaPublica: true,
    unicoUso: false,
    status: true,
  };
}

function normalizeCouponCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9_-]/g, "");
}

function createCouponId(code: string) {
  return `cupom-${normalizeCouponCode(code).toLowerCase()}-${Date.now().toString(36)}`;
}

function isCouponExpired(coupon: CupomDTO) {
  return coupon.validade.slice(0, 10) < dataDaLoja();
}

function getCouponStatus(coupon: CupomDTO) {
  if (isCouponExpired(coupon)) {
    return "expirado";
  }

  return coupon.status ? "ativo" : "pausado";
}

function getStatusCopy(coupon: CupomDTO) {
  const status = getCouponStatus(coupon);

  if (status === "expirado") {
    return "Expirado";
  }

  if (status === "pausado") {
    return "Pausado";
  }

  return "Ativo";
}

function getStatusClasses(coupon: CupomDTO) {
  const status = getCouponStatus(coupon);

  if (status === "expirado") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (status === "pausado") {
    return "bg-neutral-100 text-neutral-600 ring-neutral-200";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

function formatCouponValue(coupon: Pick<CupomDTO, "tipo" | "valor">) {
  if (coupon.tipo === "porcentagem") {
    return `${coupon.valor}%`;
  }

  return formatCurrency(coupon.valor);
}

function toFormState(coupon: CupomDTO): CouponFormState {
  return {
    nome: coupon.nome,
    descricao: coupon.descricao,
    tipo: coupon.tipo,
    valor: String(coupon.valor).replace(".", ","),
    valorMinimoGasto: String(coupon.valorMinimoGasto).replace(".", ","),
    quantidade: String(coupon.quantidade),
    validade: coupon.validade.slice(0, 10),
    listaPublica: coupon.listaPublica,
    unicoUso: coupon.unicoUso,
    status: coupon.status,
  };
}

function getDaysToExpire(coupon: CupomDTO) {
  const now = new Date(dataDaLoja());
  const expiresAt = new Date(coupon.validade.slice(0, 10));
  return Math.ceil(
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export default function AdminCupomPage() {
  const {
    coupons,
    setCoupons,
    isLoading: loadingCatalog,
    error: catalogError,
    refetch,
    isPending,
    hasData,
  } = useCuponsAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<CouponFilter>("todos");
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const controller = useForm<CouponFormState>({
    resolver: zodResolver(cupomSchema),
    defaultValues: getInitialCouponForm(),
  });
  const form = controller.watch();
  const errors = controller.formState.errors;
  const draftId = useRef("");
  const blocked = isPending || Boolean(catalogError);
  const setForm = controller.reset;

  const metrics = useMemo(() => {
    const activeCoupons = coupons.filter(
      (coupon) => getCouponStatus(coupon) === "ativo",
    );
    const publicCoupons = coupons.filter((coupon) => coupon.listaPublica);
    const availableUses = activeCoupons.reduce(
      (total, coupon) => total + coupon.quantidade,
      0,
    );
    const expiringSoon = activeCoupons.filter((coupon) => {
      const days = getDaysToExpire(coupon);
      return days >= 0 && days <= 30;
    }).length;

    return [
      {
        label: "Cupons ativos",
        value: String(activeCoupons.length),
        description: `${publicCoupons.length} aparecem para o cliente`,
        Icon: HiTicket,
      },
      {
        label: "Usos disponíveis",
        value: availableUses.toLocaleString("pt-BR"),
        description: "Soma dos limites restantes",
        Icon: FaUsers,
      },
      {
        label: "Maior desconto",
        value: activeCoupons.length
          ? formatCouponValue(
              activeCoupons.reduce(
                (best, coupon) => (coupon.valor > best.valor ? coupon : best),
                activeCoupons[0],
              ),
            )
          : "R$ 0,00",
        description: "Entre cupons ativos",
        Icon: FaPercent,
      },
      {
        label: "Expiram em breve",
        value: String(expiringSoon),
        description: "Até 30 dias",
        Icon: FaClock,
      },
    ];
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return coupons
      .filter((coupon) => {
        if (!term) {
          return true;
        }

        return [
          coupon.nome,
          coupon.descricao,
          coupon.tipo,
          formatCouponValue(coupon),
        ].some((value) => value.toLowerCase().includes(term));
      })
      .filter((coupon) => {
        if (activeFilter === "ativos") {
          return getCouponStatus(coupon) === "ativo";
        }

        if (activeFilter === "pausados") {
          return getCouponStatus(coupon) === "pausado";
        }

        if (activeFilter === "expirados") {
          return getCouponStatus(coupon) === "expirado";
        }

        if (activeFilter === "publicos") {
          return coupon.listaPublica;
        }

        return true;
      })
      .sort(
        (a, b) =>
          Number(getCouponStatus(b) === "ativo") -
          Number(getCouponStatus(a) === "ativo"),
      );
  }, [activeFilter, coupons, searchTerm]);

  const filterOptions: Array<{
    id: CouponFilter;
    label: string;
    count: number;
  }> = [
    { id: "todos", label: "Todos", count: coupons.length },
    {
      id: "ativos",
      label: "Ativos",
      count: coupons.filter((coupon) => getCouponStatus(coupon) === "ativo")
        .length,
    },
    {
      id: "pausados",
      label: "Pausados",
      count: coupons.filter((coupon) => getCouponStatus(coupon) === "pausado")
        .length,
    },
    {
      id: "expirados",
      label: "Expirados",
      count: coupons.filter((coupon) => getCouponStatus(coupon) === "expirado")
        .length,
    },
    {
      id: "publicos",
      label: "Públicos",
      count: coupons.filter((coupon) => coupon.listaPublica).length,
    },
  ];

  function openCreateCouponModal() {
    if (blocked) return;
    draftId.current = createCouponId("novo");
    setEditingCouponId(null);
    setForm(getInitialCouponForm());
    setCouponModalOpen(true);
  }

  function openEditCouponModal(coupon: CupomDTO) {
    if (blocked) return;
    setEditingCouponId(coupon.id);
    setForm(toFormState(coupon));
    setCouponModalOpen(true);
  }

  function updateForm<K extends keyof CouponFormState>(
    field: K,
    value: FieldPathValue<CouponFormState, K>,
  ) {
    controller.setValue(field, value, {
      shouldDirty: true,
      shouldValidate: controller.formState.isSubmitted,
    });
  }

  const handleSubmitCoupon = controller.handleSubmit(async (values) => {
    if (blocked) return;
    const id = editingCouponId ?? draftId.current;
    if (
      coupons.some(
        (coupon) =>
          coupon.nome.toUpperCase() === values.nome && coupon.id !== id,
      )
    ) {
      controller.setError("nome", {
        message: "Já existe um cupom com esse código.",
      });
      return;
    }
    const nextCoupon: CupomDTO = {
      ...values,
      id,
      quantidade: Number(values.quantidade),
      valor: decimal(values.valor),
      valorMinimoGasto: decimal(values.valorMinimoGasto),
    };
    const saved = await setCoupons((current) =>
      current.some((c) => c.id === id)
        ? current.map((c) => (c.id === id ? nextCoupon : c))
        : [nextCoupon, ...current],
    );
    if (saved) setCouponModalOpen(false);
  });

  function toggleCouponStatus(coupon: CupomDTO) {
    setCoupons((current) =>
      current.map((item) =>
        item.id === coupon.id ? { ...item, status: !item.status } : item,
      ),
    );
  }

  function duplicateCoupon(coupon: CupomDTO) {
    const baseCode = normalizeCouponCode(`${coupon.nome.slice(0, 48)}_COPIA`);
    let nextCode = baseCode;
    let suffix = 2;

    while (coupons.some((item) => item.nome === nextCode)) {
      nextCode = `${baseCode}${suffix}`;
      suffix += 1;
    }

    const duplicatedCoupon: CupomDTO = {
      ...coupon,
      id: createCouponId(nextCode),
      nome: nextCode,
      status: false,
    };

    openCreateCouponModal();
    setForm(
      toFormState({
        ...duplicatedCoupon,
        validade: isCouponExpired(coupon)
          ? getInitialCouponForm().validade
          : coupon.validade,
      }),
    );
  }

  function deleteCoupon(coupon: CupomDTO) {
    setCoupons((current) => current.filter((item) => item.id !== coupon.id));
  }

  async function copyCouponCode(coupon: CupomDTO) {
    try {
      await navigator.clipboard.writeText(coupon.nome);
      toast.success(`Código ${coupon.nome} copiado.`);
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  }

  if (loadingCatalog)
    return (
      <main className="p-6" role="status">
        Carregando dados…
      </main>
    );
  if (catalogError && !hasData)
    return (
      <main className="p-6" role="alert">
        Não foi possível carregar os dados.{" "}
        <button onClick={() => refetch()}>Tentar novamente</button>
      </main>
    );

  return (
    <main className="min-h-[calc(100vh-61px)] bg-[#f3f5f8] p-2.5 text-neutral-950">
      {catalogError && (
        <div role="alert" className="mb-3 rounded border border-red-200 p-3">
          Não foi possível atualizar os cupons. Sua edição foi preservada.{" "}
          <Button onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      )}
      <fieldset disabled={blocked} className="min-w-0">
        <section className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-[#f97316]">
                Marketing e descontos
              </span>
              <h1 className="mt-0.5 text-xl font-black tracking-tight text-neutral-950">
                Gestão de cupons
              </h1>
              <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                Crie campanhas, acompanhe validade e controle quais cupons
                aparecem para o cliente.
              </p>
            </div>

            <Button
              className="h-9 gap-2 rounded-md bg-[#2f8df6] px-4 text-sm font-black text-white shadow-sm hover:bg-[#1679e8]"
              onClick={openCreateCouponModal}
            >
              <FaPlus />
              Novo cupom
            </Button>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ Icon, ...metric }) => (
              <div
                className="rounded-md border border-neutral-200 bg-[#fbfbfc] p-3"
                key={metric.label}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-black uppercase text-neutral-500">
                      {metric.label}
                    </p>
                    <strong className="mt-1 block text-2xl font-black text-neutral-950">
                      {metric.value}
                    </strong>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#fff3ea] text-[#f97316]">
                    <Icon size={15} />
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-2 rounded-md border border-neutral-200 bg-white p-2.5 shadow-sm">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <FaMagnifyingGlass
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                size={14}
              />
              <Input
                className="h-10 rounded-md border-neutral-200 bg-white pl-10 text-sm font-bold text-neutral-950 placeholder:text-neutral-400 dark:bg-white dark:text-neutral-950"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por código, descrição ou tipo de desconto"
                value={searchTerm}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <button
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-md border px-3 text-xs font-black transition",
                    activeFilter === filter.id
                      ? "border-[#f97316] bg-[#fff3ea] text-[#f97316]"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
                  )}
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      activeFilter === filter.id
                        ? "bg-white text-[#f97316]"
                        : "bg-neutral-100 text-neutral-500",
                    )}
                  >
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-2 grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredCoupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            const daysToExpire = getDaysToExpire(coupon);

            return (
              <article
                className={cn(
                  "rounded-md border border-neutral-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                  status === "expirado" && "opacity-75",
                )}
                key={coupon.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-black text-white">
                        <HiTicket />
                        {coupon.nome}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-black ring-1",
                          getStatusClasses(coupon),
                        )}
                      >
                        {getStatusCopy(coupon)}
                      </span>
                      {coupon.listaPublica ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-100">
                          <FaEye size={11} />
                          Público
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-black text-neutral-600 ring-1 ring-neutral-200">
                          <FaEyeSlash size={11} />
                          Oculto
                        </span>
                      )}
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs font-semibold leading-relaxed text-neutral-600">
                      {coupon.descricao}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={`Ações de ${coupon.nome}`}
                        className="size-8 shrink-0 rounded-md border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                        size="icon"
                        variant="outline"
                      >
                        <FaChevronDown size={12} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Ações do cupom</DropdownMenuLabel>
                      <DropdownMenuItem
                        disabled={blocked}
                        onSelect={() => openEditCouponModal(coupon)}
                      >
                        <FaPenToSquare className="mr-2 text-[#f97316]" />
                        Editar cupom
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={blocked}
                        onSelect={() => copyCouponCode(coupon)}
                      >
                        <FaRegCopy className="mr-2 text-[#f97316]" />
                        Copiar código
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={blocked}
                        onSelect={() => duplicateCoupon(coupon)}
                      >
                        <FaRegCopy className="mr-2 text-[#f97316]" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={blocked}
                        onSelect={() => toggleCouponStatus(coupon)}
                      >
                        {coupon.status ? (
                          <FaPause className="mr-2 text-[#f97316]" />
                        ) : (
                          <FaPlay className="mr-2 text-emerald-600" />
                        )}
                        {coupon.status ? "Pausar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={blocked}
                        className="text-red-600 focus:bg-red-50 focus:text-red-700"
                        onSelect={() => deleteCoupon(coupon)}
                      >
                        <FaTrashCan className="mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <CouponInfo
                    label="Desconto"
                    value={formatCouponValue(coupon)}
                    Icon={
                      coupon.tipo === "porcentagem"
                        ? FaPercent
                        : FaMoneyBillWave
                    }
                    highlight
                  />
                  <CouponInfo
                    label="Pedido mínimo"
                    value={formatCurrency(coupon.valorMinimoGasto)}
                    Icon={FaTag}
                  />
                  <CouponInfo
                    label="Usos restantes"
                    value={`${coupon.quantidade} usos`}
                    Icon={FaUsers}
                  />
                  <CouponInfo
                    label="Validade"
                    value={formatDate(coupon.validade)}
                    Icon={FaCalendarDay}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                    {status === "ativo" ? (
                      <FaCircleCheck className="text-emerald-500" />
                    ) : status === "expirado" ? (
                      <FaCircleExclamation className="text-red-500" />
                    ) : (
                      <FaPause className="text-neutral-400" />
                    )}
                    {status === "expirado"
                      ? "Cupom não disponível"
                      : daysToExpire <= 30
                        ? `Expira em ${daysToExpire} dias`
                        : coupon.unicoUso
                          ? "Uso único por cliente"
                          : "Uso recorrente permitido"}
                  </div>

                  <Button
                    className="h-8 gap-1.5 rounded-md border-neutral-200 bg-white px-3 text-xs font-black text-neutral-900 hover:bg-[#fff3ea] hover:text-[#f97316]"
                    onClick={() => openEditCouponModal(coupon)}
                    variant="outline"
                  >
                    <FaPenToSquare />
                    Editar
                  </Button>
                </div>
              </article>
            );
          })}
        </section>

        {filteredCoupons.length === 0 && (
          <section className="mt-2 rounded-md border border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#fff3ea] text-[#f97316]">
              <HiTicket size={20} />
            </span>
            <h2 className="mt-3 text-lg font-black text-neutral-950">
              Nenhum cupom encontrado
            </h2>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              Ajuste os filtros ou cadastre um cupom para começar uma campanha.
            </p>
            <Button
              className="mt-4 h-9 gap-2 rounded-md bg-[#f97316] px-4 text-sm font-black text-white hover:bg-[#ea580c]"
              onClick={openCreateCouponModal}
            >
              <FaPlus />
              Criar cupom
            </Button>
          </section>
        )}
      </fieldset>
      <Dialog
        open={couponModalOpen}
        onOpenChange={(open) => {
          if (!isPending) setCouponModalOpen(open);
        }}
      >
        <DialogContent className="max-h-[calc(100vh-72px)] max-w-2xl overflow-hidden border-neutral-200 bg-white p-0 text-neutral-950 dark:bg-white">
          {catalogError && <div role="alert" className="p-4">Não foi possível confirmar os cupons. Sua edição foi preservada. <Button onClick={() => void refetch()}>Atualizar cupons</Button></div>}
          <form
            className="flex max-h-[calc(100vh-72px)] flex-col"
            onSubmit={handleSubmitCoupon}
            noValidate
          >
            <fieldset disabled={blocked} className="flex min-h-0 flex-col">
              <DialogHeader className="border-b border-neutral-200 px-5 py-4">
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div>
                    <DialogTitle className="text-xl font-black text-neutral-950">
                      {editingCouponId ? "Editar cupom" : "Novo cupom"}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-xs font-semibold text-neutral-500">
                      Configure regras de uso, validade e visibilidade do cupom.
                    </DialogDescription>
                  </div>
                  <span className="hidden rounded-full bg-[#fff3ea] px-3 py-1.5 text-xs font-black text-[#f97316] sm:inline-flex">
                    {form.tipo === "porcentagem"
                      ? `${form.valor || 0}% OFF`
                      : `${form.valor || "0"} de desconto`}
                  </span>
                </div>
              </DialogHeader>

              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
                  <FieldGroup
                    error={errors.nome?.message}
                    label="Código do cupom"
                    required
                  >
                    <Input
                      className="h-10 rounded-md border-neutral-200 bg-white text-sm font-black uppercase text-neutral-950 placeholder:text-neutral-400 dark:bg-white dark:text-neutral-950"
                      onChange={(event) =>
                        updateForm(
                          "nome",
                          normalizeCouponCode(event.target.value),
                        )
                      }
                      placeholder="ZANINI10"
                      aria-label="Código do cupom"
                      aria-invalid={Boolean(errors.nome)}
                      value={form.nome}
                    />
                  </FieldGroup>

                  <FieldGroup label="Tipo de desconto">
                    <div className="grid grid-cols-2 gap-1 rounded-md bg-neutral-100 p-1">
                      <button
                        className={cn(
                          "flex h-9 items-center justify-center gap-2 rounded-md text-xs font-black transition",
                          form.tipo === "porcentagem"
                            ? "bg-white text-[#f97316] shadow-sm"
                            : "text-neutral-500",
                        )}
                        onClick={() => updateForm("tipo", "porcentagem")}
                        type="button"
                      >
                        <FaPercent />
                        Porcentagem
                      </button>
                      <button
                        className={cn(
                          "flex h-9 items-center justify-center gap-2 rounded-md text-xs font-black transition",
                          form.tipo === "valor_fixo"
                            ? "bg-white text-[#f97316] shadow-sm"
                            : "text-neutral-500",
                        )}
                        onClick={() => updateForm("tipo", "valor_fixo")}
                        type="button"
                      >
                        <FaMoneyBillWave />
                        Valor fixo
                      </button>
                    </div>
                  </FieldGroup>
                </div>

                <FieldGroup
                  error={errors.descricao?.message}
                  label="Descrição para o cliente"
                  required
                >
                  <Textarea
                    className="min-h-[78px] rounded-md border-neutral-200 bg-white text-sm font-semibold text-neutral-950 placeholder:text-neutral-400 dark:bg-white dark:text-neutral-950"
                    onChange={(event) =>
                      updateForm("descricao", event.target.value)
                    }
                    placeholder="Ex: Ganhe 10% de desconto em pedidos acima de R$ 50,00."
                    aria-label="Descrição para o cliente"
                    aria-invalid={Boolean(errors.descricao)}
                    value={form.descricao}
                  />
                </FieldGroup>

                <div className="grid gap-3 md:grid-cols-4">
                  <FieldGroup
                    error={errors.valor?.message}
                    label={form.tipo === "porcentagem" ? "Percentual" : "Valor"}
                    required
                  >
                    <Input
                      className="h-10 rounded-md border-neutral-200 bg-white text-sm font-black text-neutral-950 dark:bg-white dark:text-neutral-950"
                      inputMode="decimal"
                      onChange={(event) =>
                        updateForm("valor", event.target.value)
                      }
                      placeholder={form.tipo === "porcentagem" ? "10" : "5,00"}
                      aria-label={
                        form.tipo === "porcentagem" ? "Percentual" : "Valor"
                      }
                      aria-invalid={Boolean(errors.valor)}
                      value={form.valor}
                    />
                  </FieldGroup>

                  <FieldGroup
                    error={errors.valorMinimoGasto?.message}
                    label="Pedido mínimo"
                  >
                    <Input
                      className="h-10 rounded-md border-neutral-200 bg-white text-sm font-black text-neutral-950 dark:bg-white dark:text-neutral-950"
                      inputMode="decimal"
                      onChange={(event) =>
                        updateForm("valorMinimoGasto", event.target.value)
                      }
                      placeholder="50,00"
                      aria-label="Pedido mínimo"
                      aria-invalid={Boolean(errors.valorMinimoGasto)}
                      value={form.valorMinimoGasto}
                    />
                  </FieldGroup>

                  <FieldGroup
                    error={errors.quantidade?.message}
                    label="Usos restantes"
                  >
                    <Input
                      className="h-10 rounded-md border-neutral-200 bg-white text-sm font-black text-neutral-950 dark:bg-white dark:text-neutral-950"
                      min={0}
                      onChange={(event) =>
                        updateForm("quantidade", event.target.value)
                      }
                      type="number"
                      aria-label="Usos restantes"
                      aria-invalid={Boolean(errors.quantidade)}
                      value={form.quantidade}
                    />
                  </FieldGroup>

                  <FieldGroup
                    error={errors.validade?.message}
                    label="Validade"
                    required
                  >
                    <Input
                      className="h-10 rounded-md border-neutral-200 bg-white text-sm font-black text-neutral-950 dark:bg-white dark:text-neutral-950"
                      onChange={(event) =>
                        updateForm("validade", event.target.value)
                      }
                      type="date"
                      aria-label="Validade"
                      aria-invalid={Boolean(errors.validade)}
                      value={form.validade}
                    />
                  </FieldGroup>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <SwitchCard
                    checked={form.status}
                    description="Cupom pode ser usado no checkout."
                    label="Cupom ativo"
                    onChange={(checked) => updateForm("status", checked)}
                  />
                  <SwitchCard
                    checked={form.listaPublica}
                    description="Aparece na tela pública de cupons."
                    label="Listar para o cliente"
                    onChange={(checked) => updateForm("listaPublica", checked)}
                  />
                  <SwitchCard
                    checked={form.unicoUso}
                    description="Limita o uso a uma vez por cliente."
                    label="Uso único"
                    onChange={(checked) => updateForm("unicoUso", checked)}
                  />
                </div>
              </div>

              <DialogFooter className="border-t border-neutral-200 bg-white px-5 py-3">
                <Button
                  className="h-9 rounded-md border-neutral-200 px-4 text-sm font-black text-neutral-900"
                  onClick={() => setCouponModalOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  className="h-9 rounded-md bg-[#f97316] px-4 text-sm font-black text-white hover:bg-[#ea580c]"
                  type="submit"
                >
                  {isPending
                    ? "Salvando…"
                    : editingCouponId
                      ? "Salvar alterações"
                      : "Criar cupom"}
                </Button>
              </DialogFooter>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CouponInfo({
  Icon,
  highlight = false,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  highlight?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-[#fbfbfc] p-2.5",
        highlight && "border-[#fed7aa] bg-[#fff7ed]",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-neutral-500">
        <Icon
          className={highlight ? "text-[#f97316]" : "text-neutral-400"}
          size={12}
        />
        {label}
      </div>
      <strong
        className={cn(
          "mt-0.5 block text-sm font-black text-neutral-950",
          highlight && "text-[#f97316]",
        )}
      >
        {value}
      </strong>
    </div>
  );
}

function FieldGroup({
  children,
  label,
  required = false,
  error,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-black uppercase text-neutral-500">
        {label}
        {required && <span className="ml-1 text-[#f97316]">*</span>}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function SwitchCard({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-[#fbfbfc] p-3">
      <div>
        <p className="text-xs font-black text-neutral-950">{label}</p>
        <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-neutral-500">
          {description}
        </p>
      </div>
      <Switch aria-label={label} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
