'use client'

import { Button } from "@/components/ui/button";
import React,{Suspense} from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery,useMutation } from '@tanstack/react-query';
import { api,mostrarErro } from '@/service/api';
import { PedidoAPI,statusPedido } from '@/hook/usePedidos';
import useCart from "@/hook/useCart";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { FaMapMarkerAlt, FaWhatsapp } from "react-icons/fa";
import { FaClock, FaReceipt, FaStore } from "react-icons/fa6";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { MdOutlineNotificationsActive } from "react-icons/md";

const orderSteps = [
    {
        title: 'Pedido recebido',
        description: 'Recebemos sua solicitação e ela entrou na fila de conferência.',
    },
    {
        title: 'Aguardando confirmação',
        description: 'A equipe vai validar disponibilidade, horário e forma de pagamento.',
    },
    {
        title: 'Em preparo',
        description: 'Seu pedido está sendo preparado com o padrão da casa.',
    },
    {
        title: 'Pronto para retirada',
        description: 'Você já pode vir até a loja para retirar seu pedido.',
    },
    {
        title: 'Finalizado',
        description: 'Pedido concluído. Obrigado por comprar no Assados Zanini.',
    },
];

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function formatSchedule(value?: string | null) {
    if (!value) {
        return 'Horário não informado';
    }

    try {
        return format(parseISO(value), "dd/MM 'às' HH:mm");
    } catch {
        return value;
    }
}

function getConfigValue(configData: any, key: string) {
    return configData?.find((item: any) => item.chave?.toUpperCase() === key)?.valor ?? '';
}

function OrderStatusContent() {
    const search=useSearchParams(),id=search.get('id');
    const query=useQuery<PedidoAPI|undefined>({queryKey:['pedido',id],queryFn:async()=>id?(await api.get(`/pedido/${id}`)).data:(await api.get('/pedido',{params:{limit:1}})).data.items[0],refetchInterval:5000,retry:false});
    const cart=query.data;
    const payment=useMutation({mutationFn:async()=>(await api.post(`/pagamento/${cart?.id}/checkout`)).data,onSuccess:data=>{if(data.checkoutUrl)window.location.assign(data.checkoutUrl);else void query.refetch();},onError:mostrarErro});
    const { configData } = useCart();
    const [agora, setAgora] = React.useState(() => Date.now());
    React.useEffect(() => { const timer = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(timer); }, []);
    const pagamentoVencido = !!cart?.pagamentoExpiraEm && new Date(cart.pagamentoExpiraEm).getTime() <= agora;
    const cupom=undefined;
    const currentStatus=statusPedido[cart?.status??'']??'Pedido recebido';
    const currentStepIndex = Math.max(orderSteps.findIndex((step) => step.title === currentStatus), 0);
    const currentStep=cart?.status==='cancelled'?{title:cart.cancelamentoMotivo==='pagamento_expirado'?'Prazo de pagamento encerrado':'Cancelado',description:cart.cancelamentoMotivo==='pagamento_expirado'?'O pedido foi cancelado após 15 minutos sem confirmação de pagamento. Os itens e benefícios reservados foram liberados.':'Este pedido foi cancelado.'}:orderSteps[currentStepIndex];
    const items = cart?.itens ?? [];
    const couponDiscount = (cart?.descontoCupom??0);
    const selectedCashback = Math.min(cart?.cashBack ?? 0, Math.max((cart?.valorTotalPedido ?? 0) - couponDiscount, 0));
    const finalTotal=cart?.valorFinal??0;
    const schedule = formatSchedule(cart?.dataEntrega);
    const phone = getConfigValue(configData, 'TELEFONE').replace(/\D/g, '');
    const addressLine = `${cart?.endereco?.rua ?? ''}, ${cart?.endereco?.numero ?? ''}`.trim();
    const itemsText = items
        .map((item) => `${item.quantidade}x ${item.produto.titulo}`)
        .join(', ');
    const whatsappMessage = [
        `Olá, Assados Zanini. Quero acompanhar meu pedido #${cart?.id ?? 1}.`,
        `Status atual: ${currentStep.title}.`,
        `Retirada: ${schedule}.`,
        `Itens: ${itemsText || 'não informado'}.`,
        couponDiscount > 0 ? `Cupom usado: ${'aplicado'} (-${formatCurrency(couponDiscount)}).` : '',
        selectedCashback > 0 ? `Cashback usado: ${formatCurrency(selectedCashback)}.` : '',
        `Total: ${formatCurrency(finalTotal)}.`,
    ].filter(Boolean).join('\n');
    const whatsappLink = `https://wa.me/55${phone}?text=${encodeURIComponent(whatsappMessage)}`;

    if(query.isPending||query.isError)return <main className="mt-20 p-6"><p>{query.isPending?'Carregando pedido…':'Não foi possível carregar este pedido.'}</p>{query.isError&&<Button onClick={()=>query.refetch()}>Tentar novamente</Button>}</main>;
    if (!cart || items.length === 0) {
        return (
            <main className="mt-14 min-h-screen bg-[#f7f7f7] px-4 py-8">
                <section className="mx-auto max-w-[430px] rounded-md bg-white p-5 text-center shadow-sm">
                    <h1 className="text-[20px] font-extrabold text-dark-900">Nenhum pedido em andamento</h1>
                    <p className="mt-2 text-[13px] leading-5 text-dark-500">
                        Adicione produtos ao carrinho para acompanhar o status do pedido.
                    </p>
                    <Button asChild variant="success" className="mt-5 h-11 w-full text-[14px] font-extrabold">
                        <Link href="/">Ver cardápio</Link>
                    </Button>
                </section>
            </main>
        );
    }

    return (
        <main className="mt-14 min-h-screen bg-[#f7f7f7] pb-8">
            <div className="mx-auto max-w-[430px]">
                <section className="bg-[#111111] px-4 pb-5 pt-6 text-white">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] px-3 py-1 text-[11px] font-extrabold uppercase leading-none text-white">
                                Pedido #{cart.id}
                            </span>
                            <h1 className="mt-3 text-[24px] font-extrabold leading-7">Pedido enviado</h1>
                            <p className="mt-2 text-[13px] leading-5 text-white/75">
                                Acompanhe o progresso do seu pedido pelo status abaixo.
                            </p>
                        </div>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#f97316] ring-1 ring-white/10">
                            <IoMdCheckmarkCircleOutline size={34} />
                        </div>
                    </div>
                </section>

                <section className="-mt-2 rounded-t-[18px] bg-white px-4 pb-5 pt-5 shadow-sm">
                    <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-45 motion-reduce:animate-none" />
                                <MdOutlineNotificationsActive className="relative" size={23} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[11px] font-extrabold uppercase leading-none text-emerald-700">Status atual</span>
                                <h2 className="mt-1 text-[17px] font-extrabold leading-5 text-dark-900">{currentStep.title}</h2>
                            </div>
                        </div>
                        <p className="mt-3 text-[12px] leading-5 text-dark-600">
                            {currentStep.description}
                        </p>
                    </div>

                    {phone&&<Button asChild variant="success" className="mt-4 h-12 w-full gap-2 bg-[#16bf75] text-[15px] font-extrabold shadow-sm hover:bg-[#13a866]">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                            <FaWhatsapp size={20} />
                            Acompanhar no WhatsApp
                        </a>
                    </Button>}
                    <p className="mt-3 text-sm">Pagamento: {cart.pagamentoStatus==='paid'?'confirmado':cart.pagamentoStatus==='refunded'?'estornado':cart.pagamentoStatus==='refund_pending'?'estorno pendente':'aguardando'}</p>
                    {cart.pagamentoStatus === 'refund_pending' && <p role="alert" className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">O pagamento foi confirmado após o cancelamento. O pedido continua cancelado; entre em contato com a loja para acompanhar o estorno.</p>}
                    {cart.pagamentoStatus === 'pending' && cart.status !== 'cancelled' && cart.pagamentoExpiraEm && <p role="status" className="mt-3 text-sm">{pagamentoVencido ? 'Prazo encerrado. Estamos conferindo o pagamento antes de liberar a reserva.' : `Pague até ${new Date(cart.pagamentoExpiraEm).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}. O estoque fica reservado por 15 minutos.`}</p>}
                    {cart.pagamentoStatus==='pending'&&cart.status!=='cancelled'&&cart.formaPagamento?.startsWith('Pagamento online')&&<Button disabled={payment.isPending || pagamentoVencido} onClick={()=>payment.mutate()} className="mt-3 w-full">Pagar com Mercado Pago</Button>}
                </section>

                {cart.status !== 'cancelled' && <section className="mt-3 bg-white px-4 py-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-[18px] font-extrabold leading-6 text-dark-900">Andamento</h2>
                            <p className="mt-0.5 text-[12px] leading-4 text-dark-500">Veja cada etapa até a retirada.</p>
                        </div>
                        <span className="rounded-full bg-[#fff3eb] px-3 py-1 text-[11px] font-extrabold uppercase text-[#f97316]">
                            {currentStepIndex + 1} de {orderSteps.length}
                        </span>
                    </div>

                    <div className="mt-5">
                        {orderSteps.map((step, index) => {
                            const isDone = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={step.title} className="grid grid-cols-[28px_1fr] gap-3">
                                    <div className="flex flex-col items-center">
                                        <span
                                            className={cn(
                                                "relative mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white",
                                                isDone && "border-[#f97316] bg-[#f97316]",
                                                isCurrent && "border-[#f97316] bg-[#f97316]",
                                                !isDone && !isCurrent && "border-neutral-300"
                                            )}
                                        >
                                            {isCurrent && (
                                                <span className="absolute h-4 w-4 animate-ping rounded-full bg-[#f97316] opacity-50 motion-reduce:animate-none" />
                                            )}
                                            <span className={cn("relative h-1.5 w-1.5 rounded-full", isDone || isCurrent ? "bg-white" : "bg-neutral-300")} />
                                        </span>
                                        {index < orderSteps.length - 1 && (
                                            <span
                                                className={cn(
                                                    "relative h-[58px] w-0.5 overflow-hidden rounded-full bg-neutral-200"
                                                )}
                                            >
                                                {(isDone || isCurrent) && (
                                                    <span
                                                        className={cn(
                                                            "absolute left-0 top-0 h-full w-full rounded-full bg-gradient-to-b from-[#f97316] via-[#fb923c] to-[#f97316]",
                                                            isDone && "opacity-100",
                                                            isCurrent && "order-status-flow shadow-[0_0_10px_rgba(249,115,22,0.55)]"
                                                        )}
                                                    />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <div className={cn("pb-5", index === orderSteps.length - 1 && "pb-0")}>
                                        <div className={cn(
                                            "rounded-md border p-3 transition-colors",
                                            isCurrent ? "border-[#f97316] bg-[#fff7f1]" : "border-transparent bg-transparent",
                                            isDone && "bg-[#fff7f1]/70"
                                        )}>
                                            <strong className={cn(
                                                "block text-[14px] leading-5",
                                                isDone || isCurrent ? "text-dark-900" : "text-dark-500"
                                            )}>
                                                {step.title}
                                            </strong>
                                            <span className="mt-1 block text-[12px] leading-5 text-dark-500">
                                                {step.description}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>}

                <section className="mt-3 space-y-4 bg-white px-4 py-5 shadow-sm">
                    <div>
                        <h2 className="text-[18px] font-extrabold leading-6 text-dark-900">Resumo do pedido</h2>
                        <p className="mt-0.5 text-[12px] leading-4 text-dark-500">Informações do pedido.</p>
                    </div>

                    <div className="grid gap-3">
                        <div className="flex items-start gap-3 rounded-md bg-[#f7f7f7] p-3 text-[13px] text-dark-600">
                            <FaStore className="mt-0.5 shrink-0 text-[#f97316]" size={17} />
                            <div>
                                <strong className="block text-dark-900">{cart.tipoRecebimento==='delivery'?'Entrega no endereço':'Retirada no local'}</strong>
                                <span>{addressLine}</span>
                                <span className="block">{cart.endereco?.bairro}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-md bg-[#f7f7f7] p-3 text-[13px] text-dark-600">
                            <FaClock className="shrink-0 text-[#f97316]" size={17} />
                            <span>{schedule}</span>
                        </div>
                    </div>

                    <div className="rounded-md border border-neutral-200">
                        <div className="flex items-center gap-2 border-b px-3 py-3">
                            <FaReceipt className="text-[#f97316]" size={16} />
                            <strong className="text-[14px] text-dark-900">Itens</strong>
                        </div>
                        <div className="px-3 py-2">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between gap-3 py-2 text-[13px]">
                                    <span className="min-w-0 line-clamp-2 text-dark-600">{item.quantidade}x {item.produto.titulo}</span>
                                    <strong className="whitespace-nowrap text-dark-900">{formatCurrency(item.valor)}</strong>
                                </div>
                            ))}
                            <div className="mt-2 flex justify-between border-t py-3 text-[15px]">
                                <span>Subtotal</span>
                                <strong>{formatCurrency(cart.valorTotalPedido)}</strong>
                            </div>
                            {couponDiscount > 0 && (
                                <div className="flex justify-between pb-3 text-[13px] text-emerald-600">
                                    <span>Cupom {'aplicado'}</span>
                                    <strong>- {formatCurrency(couponDiscount)}</strong>
                                </div>
                            )}
                            {selectedCashback > 0 && (
                                <div className="flex justify-between pb-3 text-[13px] text-[#f97316]">
                                    <span>Cashback usado</span>
                                    <strong>- {formatCurrency(selectedCashback)}</strong>
                                </div>
                            )}
                            <div className="flex justify-between border-t py-3 text-[15px]">
                                <strong>Total</strong>
                                <strong>{formatCurrency(finalTotal)}</strong>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="px-4 py-5">
                    <Button asChild variant="outline" className="h-12 w-full text-[14px] font-extrabold">
                        <Link href="/">Voltar ao início</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}

export default function OrderStatusPage(){return <Suspense fallback={<p>Carregando…</p>}><OrderStatusContent/></Suspense>;}
