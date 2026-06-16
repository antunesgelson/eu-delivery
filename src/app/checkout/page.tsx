'use client'

import { ModalAgendarEntrega } from "@/components/Modal/AgendarEntrega";
import { ModalChooseAdress } from '@/components/Modal/ChooseAddress';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useCart from "@/hook/useCart";
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React from "react";

import { BsBasket2Fill } from "react-icons/bs";
import { FaMapMarkedAlt } from "react-icons/fa";
import { FaCoins, FaUserTag } from "react-icons/fa6";
import { HiTicket } from "react-icons/hi2";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoWallet } from "react-icons/io5";
import { MdAccessTimeFilled } from "react-icons/md";
import { PiTrash } from "react-icons/pi";

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
    const [openScheduleModal, setOpenScheduleModal] = React.useState(false);
    const [openPickupModal, setOpenPickupModal] = React.useState(false);
    const router = useRouter();
    const { cart, cupom, removeItemFromCart, sendLocalOrder } = useCart();
    const items = React.useMemo(() => cart?.itens ?? [], [cart?.itens]);
    const hasItems = items.length > 0;
    const hasPickup = !!cart?.endereco && Object.keys(cart.endereco).length > 0;
    const hasSchedule = !!cart?.dataEntrega;
    const hasPayment = !!cart?.formaPagamento;
    const total = cart?.valorTotalPedido ?? 0;
    const cashbackValue = total * 0.03;

    const nextStep = React.useMemo(() => {
        if (!hasItems) {
            return { label: 'Adicionar produtos', action: () => router.push('/') };
        }

        if (!hasPickup) {
            return { label: 'Escolher retirada', action: () => setOpenPickupModal(true) };
        }

        if (!hasSchedule) {
            return { label: 'Agendar retirada', action: () => setOpenScheduleModal(true) };
        }

        if (!hasPayment) {
            return { label: 'Escolher pagamento', action: () => router.push('/formofpayment') };
        }

        return {
            label: 'Enviar pedido',
            action: () => {
                sendLocalOrder();
                router.push('/orderstatus');
            },
        };
    }, [hasItems, hasPayment, hasPickup, hasSchedule, router, sendLocalOrder]);

    const pickupAddress = hasPickup ? cart?.endereco : undefined;

    return (
        <main className="mt-14 min-h-screen bg-[#f7f7f7] pb-28">
            <div className="mx-auto max-w-[430px]">
                <div className='p-4 leading-3'>
                    <h2 className="uppercase text-[20px] font-extrabold flex items-center gap-2 text-dark-900">
                        <BsBasket2Fill /> itens do pedido
                    </h2>
                    <span className='text-[12px] text-muted-foreground'>Confira os produtos antes de finalizar.</span>
                </div>

                <section className="bg-white p-4 space-y-4">
                    <AnimatePresence>
                        {!hasItems &&
                            <motion.span
                                className="block text-center text-sm text-muted-foreground"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}>
                                O carrinho está vazio.
                            </motion.span>
                        }
                    </AnimatePresence>
                    <AnimatePresence mode="popLayout">
                        {items.map((item) => (
                            <motion.div
                                key={item.id}
                                className="-mt-2"
                                layout
                                transition={{ type: "spring" }}>
                                <div className="flex justify-between items-center text-sm gap-2">
                                    <div className="font-extrabold leading-4">
                                        {item.quantidade}x <span className="uppercase">{item.produto.titulo}</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <strong className="whitespace-nowrap text-[#f97316]">{formatCurrency(item.valor)}</strong>
                                        <Button
                                            onClick={() => removeItemFromCart(Number(item.id))}
                                            size="icon"
                                            variant="icon"
                                            className="group -mt-1">
                                            <PiTrash className="h-8 w-8 rounded-full p-1 duration-300 group-hover:bg-black group-hover:p-1.5 group-hover:text-white" size={20} />
                                        </Button>
                                    </div>
                                </div>
                                {item.obs && (
                                    <div className="flex flex-col text-muted-foreground text-sm">
                                        <span className="italic text-xs">{item.obs}</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </section>

                <div className='p-4 leading-3'>
                    <h2 className="uppercase text-[20px] font-extrabold flex items-center gap-2 text-dark-900">
                        <FaUserTag /> informações do pedido
                    </h2>
                </div>

                <section className="bg-white p-4 space-y-8">
                    <div className="flex items-center">
                        <FaMapMarkedAlt size={25} className="text-muted-foreground" />
                        <div className="flex w-full items-center justify-between">
                            <div className="ml-3 flex min-w-0 flex-col items-start leading-4">
                                <span className="font-semibold">Recebimento:</span>
                                {!pickupAddress
                                    ? <span className="text-muted-foreground text-sm">Escolha a retirada no local</span>
                                    : <>
                                        <span className="text-muted-foreground text-sm font-semibold">Retirada no local</span>
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
                                <span className="font-semibold">Horário de retirada:</span>
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
                        <HiTicket size={25} className="text-muted-foreground" />
                        <div className="flex w-full items-center justify-between">
                            <div className="ml-3 flex flex-col items-start leading-4">
                                <span className="font-semibold">Cupom aplicado:</span>
                                {cupom
                                    ? <div className="text-muted-foreground text-sm tracking-tight">
                                        <span className="uppercase">#{cupom.nome}</span>
                                        <span className="text-xs"> desconto de {cupom.valor}%</span>
                                    </div>
                                    : <span className="text-muted-foreground text-sm tracking-tight">Nenhum cupom aplicado</span>
                                }
                            </div>
                            <Button
                                size="sm"
                                variant="success"
                                onClick={() => router.push('/cupom')}>
                                Selecionar
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

                    <Separator />

                    <div className="flex flex-col items-end gap-1 mt-8 text-base">
                        <span>Subtotal: {formatCurrency(total)}</span>
                        <span>Taxa de retirada: <strong className="text-emerald-600">Grátis</strong></span>
                        <span className="font-bold">Total: <strong className="text-xl">{formatCurrency(total)}</strong></span>
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
                        onClick={nextStep.action}>
                        <span className="ml-3 flex items-center gap-2">
                            <IoMdCheckmarkCircleOutline size={25} />
                            {nextStep.label}
                        </span>
                        <strong className="rounded-lg bg-white p-1 text-base font-bold text-primary">
                            {formatCurrency(total)}
                        </strong>
                    </Button>
                    {hasItems && (
                        <div className="mt-1 flex justify-center items-center gap-2 text-[11px] text-muted-foreground">
                            <FaCoins />
                            Você ganhará <strong>{formatCurrency(cashbackValue)}</strong> de cashback.
                        </div>
                    )}
                </div>
            </footer>
        </main>
    )
}
