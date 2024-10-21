'use client'
import { ModalAgendarEntrega } from "@/components/Modal/AgendarEntrega";
import { ModalChooseAdress } from '@/components/Modal/ChooseAddress';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import useCart from "@/hook/useCart";
import { api } from "@/service/api";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import React from "react";

import { BsBasket2Fill } from "react-icons/bs";
import { FaMapMarkedAlt, FaPiggyBank } from "react-icons/fa";
import { FaCoins, FaUserTag } from "react-icons/fa6";
import { HiTicket } from "react-icons/hi2";
import { IoWallet } from "react-icons/io5";
import { MdAccessTimeFilled } from "react-icons/md";
import { PiTrash } from "react-icons/pi";
import { toast } from "sonner";

export default function Checkout() {
    const [openModal, setOpenModal] = React.useState(false);
    const [openModalAdress, setOpenModalAdress] = React.useState(false);
    const { cart, handleUpdateCart, cupom } = useCart()
    const [loadingItems, setLoadingItems] = React.useState<{ [key: number]: boolean }>({});


    const { mutateAsync: handleRemoveItemCart } = useMutation({
        mutationKey: ['change-checkout'],
        mutationFn: async ({ itemID }: { itemID: number }) => {
            const { data } = await api.delete(`/pedido/carrinho/item/${itemID}`)
            return data
        }, onSuccess() {
            toast.success('Item removido com sucesso!')
            handleUpdateCart()
        }, onError(error: unknown) {
            console.log(error)
            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Erro inesperado, tente novamente mais tarde.')
            }
        }
    })

    const handleRemoveItem = async (itemID: number) => {
        setLoadingItems((prev) => ({ ...prev, [itemID]: true }));
        try {
            await handleRemoveItemCart({ itemID });
        } finally {
            setLoadingItems((prev) => ({ ...prev, [itemID]: false }));
        }
    };

    React.useEffect(() => {
        console.log('cupom', cupom)
    }, [cupom]);

    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} >

            <div className='p-4 leading-3'>
                <h2 className="uppercase text-2xl font-bold flex items-center gap-2 "> <BsBasket2Fill /> itens do pedido </h2>
                <span className='text-xs text-muted-foreground'>Você pode coferir todos os pedidos realizados em nosso site, e também pode refazer eles de forma rápida e prática!</span>
            </div>

            <section className="bg-white p-4 space-y-4">
                <AnimatePresence>
                    {cart?.itens.length === 0 &&
                        <motion.span
                            className="text-muted-foreground text-sm text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}>
                            O carrinho está vazio.
                        </motion.span>
                    }
                </AnimatePresence>
                <AnimatePresence mode="popLayout">
                    {cart?.itens.map((item) => (
                        <motion.div
                            key={item.id}
                            className="-mt-2"
                            layout
                            transition={{ type: "spring" }}>
                            <div className="flex justify-between items-center text-sm gap-2">
                                <div className="font-semibold">{item.quantidade}x <span className="uppercase">{item.produto.titulo}</span></div>
                                <div className="flex items-center justify-center">
                                    <strong className="whitespace-nowrap">R$ {item?.valor?.toFixed(2)}</strong>
                                    <Button
                                        onClick={() => handleRemoveItem(Number(item.id))}
                                        loading={loadingItems[item.id] || false}
                                        size={'icon'}
                                        variant={'icon'}
                                        className="group -mt-1  ">
                                        <PiTrash className=" group-hover:bg-black group-hover:text-white h-8 w-8 p-1 group-hover:p-1.5 rounded-full  duration-300 " size={20} />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-col text-muted-foreground text-sm">
                                <span className="italic text-xs">{item.obs}</span>
                                {item.adicionais.map((adicional) => (
                                    <span key={adicional.id}>-{adicional.nome}</span>
                                ))}
                                <strong>+1x fanta uva lata</strong>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </section>

            <div className='p-4 leading-3'>
                <h2 className="uppercase text-2xl font-bold flex items-center gap-2 "> <FaUserTag /> minhas informações </h2>
            </div>

            <section className="bg-white p-4 space-y-8">
                {/* ENDEREÇO DE ENTREGA */}
                <div className="flex items-center ">
                    <FaMapMarkedAlt size={25} className="text-muted-foreground" />
                    <div className="flex justify-between items-center w-full ">
                        <div className="flex flex-col items-start leading-4 ml-3">
                            <span className="font-semibold">Entregar em:</span>
                            <span className="text-muted-foreground text-sm">{cart?.endereco.rua}, {cart?.endereco.numero}</span>
                            <span className="text-xs italic text-muted-foreground ">
                                {cart?.endereco.complemento && `Complemento: ${cart.endereco.complemento}`}
                            </span>
                            <span className="text-xs italic text-muted-foreground ">
                                {cart?.endereco.referencia && `Referencia: ${cart.endereco.referencia}`}
                            </span>
                        </div>
                        <Button
                            size={'sm'}
                            variant={'destructive'}
                            onClick={() => setOpenModalAdress(true)}>
                            Alterar
                        </Button>
                    </div>
                </div>
                {/* AGENDAR HORÁRIO DE ENTREGA */}
                <div className="flex items-center ">
                    <MdAccessTimeFilled size={25} className="text-muted-foreground" />
                    <div className="flex justify-between items-center w-full ">
                        <div className="flex flex-col items-start leading-4 ml-3">
                            <span className="font-semibold">Horário:</span>
                            {!cart?.dataEntrega && <span className="text-muted-foreground text-sm">Selecione um horário</span>}
                            {/* {cart?.dataEntrega && <span className="text-muted-foreground text-sm">Entregar dia 02/12 as 08:00</span>} */}
                            {cart?.dataEntrega && <span className="text-muted-foreground text-sm">Entregar dia {cart.dataEntrega}</span>}
                        </div>
                        <Button
                            size={'sm'}
                            variant={'destructive'}
                            onClick={() => setOpenModal(true)}>
                            Agendar
                        </Button>
                    </div>
                </div>
                {/* CUPOM */}
                <div className="flex items-center ">
                    <HiTicket size={25} className="text-muted-foreground" />
                    <div className="flex justify-between items-center w-full ">
                        <div className="flex flex-col items-start leading-4 ml-3">
                            <span className="font-semibold">Cupom Aplicado:</span>
                            {cupom && <div className="text-muted-foreground text-sm tracking-tight">
                                <span className="uppercase">#{cupom.nome}</span>
                                <span className="text-xs"> (desconto de {cupom.valor}%)</span>
                            </div>}
                            {!cupom && <span className="text-muted-foreground text-sm tracking-tight">Nenhum cupom aplicado</span>}
                        </div>
                        <Button
                            asChild
                            size={'sm'}
                            variant={'success'}>
                            <Link href={'/cupom'}>
                                Selecionar
                            </Link>
                        </Button>
                    </div>
                </div>
                {/* CASHBACK */}
                <div className="">
                    <div className="flex items-center ">
                        <FaPiggyBank size={25} className="text-muted-foreground" />
                        <div className="flex justify-between items-center w-full ">
                            <div className="flex flex-col items-start leading-4 ml-3">
                                <span className="font-semibold">Saldo disponível: <span className="text-emerald-500">R$ {cart?.cashBack.toFixed(2)}</span></span>
                                <span className="text-muted-foreground text-sm">Utilizar o saldo disponível nesta compra?</span>
                            </div>
                            <Switch className="" />
                        </div>
                    </div>
                    <span className=" bg-muted-foreground text-white text-[12px] rounded-md p-0.5 ml-8">Após essa compra, sobrará R$ 7,64</span>
                </div>
                {/* FORMA DE PAGAMENTO */}
                <div className="flex items-center ">
                    <IoWallet size={25} className="text-muted-foreground" />
                    <div className="flex justify-between items-center w-full ">
                        <div className="flex flex-col items-start leading-4 ml-3">
                            <span className="font-semibold">Pagamento:</span>
                            <span className="text-muted-foreground text-sm">Escolha a forma de pagamento</span>
                        </div>
                        <Button
                            asChild
                            size={'sm'}
                            variant={'success'}>
                            <Link href={'/formofpayment'} >
                                Escolher
                            </Link>
                        </Button>
                    </div>
                </div>

                <Separator />
                {/* RESUMO DO PEDIDO */}
                <div className="flex flex-col items-end gap-1 mt-8 text-base">
                    <span>Subtotal: R$ {cart?.valorTotalPedido.toFixed(2)}</span>
                    <strong className="text-emerald-600">Desconto do Cupom: R$ 39,90</strong>
                    <span>Taxa de Entrega: <strong className="text-emerald-600">Grátis!</strong></span>
                    <span className="font-bold">Total: R$ <strong className="text-xl">35,91</strong></span>
                </div>

                <div className="flex justify-center  ">
                    <Button className="w-full uppercase text-lg" variant={'success'}>
                        enviar pedido
                    </Button>
                </div>
            </section>

            <ModalAgendarEntrega
                open={openModal}
                onClose={() => setOpenModal(false)}
            />

            <ModalChooseAdress
                open={openModalAdress}
                onClose={() => setOpenModalAdress(false)}
            />

            <footer className="text-[12px] flex justify-center p-1 items-center text-muted-foreground gap-2">
                <FaCoins />
                Você ganhará
                <strong>R$ 3,59</strong>
                de cashback com essa compra.
            </footer>
        </motion.main>
    )
}