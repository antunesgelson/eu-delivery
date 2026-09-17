'use client'

import { ModalAgendarEntrega } from "@/components/Modal/AgendarEntrega";
import { ModalChooseAdress } from '@/components/Modal/ChooseAddress';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCouponDiscount } from "@/data/coupons";
import { useBeneficios } from "@/hook/useLoja";
import useCart from "@/hook/useCart";
import { format, parseISO } from 'date-fns';
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { FaMapMarkedAlt } from "react-icons/fa";
import { FaCoins, FaUserTag } from "react-icons/fa6";
import { HiTicket } from "react-icons/hi2";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoWallet } from "react-icons/io5";
import { MdAccessTimeFilled } from "react-icons/md";

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function formatSchedule(value?: string | null) {
    if (!value) {
        return 'Selecione um horário';
    }

    try {
        return format(parseISO(value), "dd/MM 'às' HH:mm");
    } catch {
        return value;
    }
}

export default function Checkout() {
    const {cashbackBalance}=useBeneficios();
    const [openScheduleModal, setOpenScheduleModal] = React.useState(false);
    const [openPickupModal, setOpenPickupModal] = React.useState(false);
    const router = useRouter();
    const { cart, cupom, sendLocalOrder, setCashbackUsage,configData,isPending,isLoading,isError,handleUpdateCart } = useCart();
    const items = React.useMemo(() => cart?.itens ?? [], [cart?.itens]);
    const hasItems = items.length > 0;
    const hasPickup = !!cart?.endereco && Object.keys(cart.endereco).length > 0;
    const hasSchedule = !!cart?.dataEntrega;
    const hasPayment = !!cart?.formaPagamento;
    const total = cart?.valorTotalPedido ?? 0;
    const couponDiscount = cart?.descontoCupom ?? 0;
    const totalAfterCoupon = Math.max(total - couponDiscount, 0);
    const maxCashbackForOrder = Math.min(cashbackBalance, totalAfterCoupon);
    const selectedCashback = Math.min(cart?.cashBack ?? 0, maxCashbackForOrder);
    const isUsingCashback = selectedCashback > 0;
    const finalTotal=cart?.valorFinal??0;
    const hasCoupon = !!cupom;
    const cashbackValue = hasCoupon ? 0 : finalTotal * Number(configData.find(c=>c.chave==='CASHBACK')?.valor??3)/100;



    const nextStep = React.useMemo(() => {
        if (!hasItems) {
            return { label: 'Adicionar produtos', action: () => router.push('/') };
        }

        if (!hasPickup) {
            return { label: 'Escolher recebimento', action: () => setOpenPickupModal(true) };
        }

        if (!hasSchedule) {
            return { label: 'Escolher horário', action: () => setOpenScheduleModal(true) };
        }

        if (!hasPayment) {
            return { label: 'Escolher pagamento', action: () => router.push('/formofpayment') };
        }

        return {
            label: 'Enviar pedido',
            action: async () => {
                const orderResult = await sendLocalOrder();

                if (!orderResult.ok) {
                    toast.error('Não foi possível enviar o pedido.', {
                        description: orderResult.errors.slice(0, 2).join(' '),
                    });
                    return;
                }

                router.push(`/orderstatus?id=${orderResult.id}`);
            },
        };
    }, [hasItems, hasPayment, hasPickup, hasSchedule, router, sendLocalOrder]);

    const pickupAddress = hasPickup ? cart?.endereco : undefined;

    if (isLoading) return <main className="mt-16 p-4" role="status">Carregando carrinho…</main>;
    if (isError) return <main className="mt-16 p-4" role="alert">Não foi possível carregar o carrinho. <Button onClick={handleUpdateCart}>Tentar novamente</Button></main>;

    return (
        <main className="mt-14 min-h-screen bg-[#f7f7f7] pb-28">
            <div className="mx-auto max-w-[430px]">
                {cart?.tipoRecebimento==='delivery'&&<div className="bg-orange-50 p-4 text-sm font-semibold">Entrega no endereço selecionado • Taxa: {formatCurrency(cart.taxaEntrega)}</div>}
                <section className="bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-[18px] font-extrabold leading-6 text-dark-900">Resumo do pedido</h2>
                            <p className="mt-0.5 text-[12px] leading-4 text-dark-500">
                                Confira os itens antes de enviar.
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            className="h-8 shrink-0 px-2.5 text-[12px] font-extrabold"
                        >
                            <Link href="/cart">Editar</Link>
                        </Button>
                    </div>

                    <Separator className="my-4" />

                    {hasItems ? (
                        <div className="divide-y divide-neutral-100">
                            {items.map((item) => (
                                <div key={item.id} className="grid grid-cols-[auto_1fr_auto] gap-3 py-3 first:pt-0 last:pb-0">
                                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#fff7f1] px-2 text-[12px] font-extrabold text-[#f97316]">
                                        {item.quantidade}x
                                    </span>
                                    <div className="min-w-0">
                                        <strong className="block line-clamp-2 text-[13px] font-extrabold uppercase leading-4 text-dark-900">
                                            {item.produto.titulo}
                                        </strong>
                                        {item.obs && (
                                            <span className="mt-1 block line-clamp-2 text-[11px] italic leading-4 text-dark-500">
                                                Obs: {item.obs}
                                            </span>
                                        )}
                                    </div>
                                    <strong className="whitespace-nowrap text-[13px] font-extrabold text-dark-900">
                                        {formatCurrency(item.valor)}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md bg-[#f7f7f7] p-4 text-center">
                            <strong className="text-[14px] text-dark-800">Carrinho vazio</strong>
                            <p className="mt-1 text-[12px] text-dark-500">Adicione produtos para continuar.</p>
                        </div>
                    )}
                </section>

                <div className='p-4 leading-3'>
                    <h2 className="uppercase text-[20px] font-extrabold flex items-center gap-2 text-dark-900">
                        <FaUserTag /> informações do pedido
                    </h2>
                </div>

                <section className="bg-white p-4 space-y-6 shadow-sm">
                    <div className="flex items-center">
                        <FaMapMarkedAlt size={25} className="text-muted-foreground" />
                        <div className="flex w-full items-center justify-between">
                            <div className="ml-3 flex min-w-0 flex-col items-start leading-4">
                                <span className="font-semibold">Recebimento:</span>
                                {!pickupAddress
                                    ? <span className="text-muted-foreground text-sm">Escolha a retirada no local</span>
                                    : <>
                                        <span className="text-muted-foreground text-sm font-semibold">{cart?.tipoRecebimento==='delivery'?'Entrega no endereço':'Retirada no local'}</span>
                                        <span className="text-muted-foreground text-sm">{pickupAddress.rua}, {pickupAddress.numero}</span>
                                        <span className="text-xs italic text-muted-foreground">{pickupAddress.bairro}</span>
                                    </>
                                }
                            </div>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setOpenPickupModal(true)}>
                                {pickupAddress ? 'Alterar' : 'Escolher'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <MdAccessTimeFilled size={25} className="text-muted-foreground" />
                        <div className="flex w-full items-center justify-between">
                            <div className="ml-3 flex flex-col items-start leading-4">
                                <span className="font-semibold">{cart?.tipoRecebimento === 'delivery' ? 'Horário de entrega:' : 'Horário de retirada:'}</span>
                                <span className="text-muted-foreground text-sm">{formatSchedule(cart?.dataEntrega)}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setOpenScheduleModal(true)}>
                                {cart?.dataEntrega ? 'Alterar' : 'Agendar'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <IoWallet size={25} className="text-muted-foreground" />
                        <div className="flex w-full items-center justify-between">
                            <div className="ml-3 flex flex-col items-start leading-4">
                                <span className="font-semibold">Pagamento:</span>
                                <span className="text-muted-foreground text-sm">
                                    {cart?.formaPagamento ?? 'Escolha a forma de pagamento'}
                                </span>
                            </div>
                            <Button
                                size="sm"
                                variant="success"
                                onClick={() => router.push('/formofpayment')}>
                                Escolher
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="mt-3 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-[18px] font-extrabold leading-6 text-dark-900">Resumo financeiro</h2>
                            <p className="mt-0.5 text-[12px] text-dark-500">Total final antes de enviar o pedido.</p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2 text-[14px]">
                        <div className="flex items-center justify-between">
                            <span className="text-dark-600">Subtotal</span>
                            <strong className="text-dark-900">{formatCurrency(total)}</strong>
                        </div>
                        {couponDiscount > 0 && (
                            <div className="flex items-center justify-between text-emerald-600">
                                <span>Cupom {cupom?.nome}</span>
                                <strong>- {formatCurrency(couponDiscount)}</strong>
                            </div>
                        )}
                        {isUsingCashback && (
                            <div className="flex items-center justify-between text-[#f97316]">
                                <span>Cashback usado</span>
                                <strong>- {formatCurrency(selectedCashback)}</strong>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-dark-600">{cart?.tipoRecebimento==='delivery'?'Taxa de entrega':'Taxa de retirada'}</span>
                            <strong className="text-emerald-600">{cart?.tipoRecebimento==='delivery'?formatCurrency(cart.taxaEntrega):'Grátis'}</strong>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <strong className="text-[16px] text-dark-900">Total</strong>
                        <strong className="text-[22px] leading-7 text-dark-900">{formatCurrency(finalTotal)}</strong>
                    </div>
                </section>
            </div>

            <ModalAgendarEntrega
                open={openScheduleModal}
                onClose={() => setOpenScheduleModal(false)}
            />

            <ModalChooseAdress
                open={openPickupModal}
                onClose={() => setOpenPickupModal(false)}
            />

            <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 px-3 py-2 backdrop-blur">
                <div className="mx-auto max-w-[430px]">
                    <Button
                        type="button"
                        variant="success"
                        className="flex h-12 w-full justify-between p-2 text-lg"
                        disabled={isPending}
                        onClick={nextStep.action}>
                        <span className="ml-3 flex items-center gap-2">
                            <IoMdCheckmarkCircleOutline size={25} />
                            {nextStep.label}
                        </span>
                        <strong className="rounded-lg bg-white p-1 text-base font-bold text-primary">
                            {formatCurrency(finalTotal)}
                        </strong>
                    </Button>
                    {hasItems && isUsingCashback && (
                        <div className="mt-1 flex justify-center items-center gap-2 text-[11px] text-muted-foreground">
                            <FaCoins />
                            Cashback usado: <strong>{formatCurrency(selectedCashback)}</strong>
                        </div>
                    )}
                    {hasItems && !hasCoupon && !isUsingCashback && (
                        <div className="mt-1 flex justify-center items-center gap-2 text-[11px] text-muted-foreground">
                            <FaCoins />
                            Você ganhará <strong>{formatCurrency(cashbackValue)}</strong> de cashback.
                        </div>
                    )}
                    {hasItems && hasCoupon && (
                        <div className="mt-1 flex justify-center items-center gap-2 text-[11px] text-muted-foreground">
                            <HiTicket />
                            Cupom ativo: cashback não acumula neste pedido.
                        </div>
                    )}
                </div>
            </footer>
        </main>
    )
}
