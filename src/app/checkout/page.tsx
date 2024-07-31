'use client'
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

import { BsBasket2Fill } from "react-icons/bs";
import { FaMapMarkedAlt, FaPiggyBank } from "react-icons/fa";
import { FaCoins, FaUserTag } from "react-icons/fa6";
import { HiTicket } from "react-icons/hi2";
import { IoWallet } from "react-icons/io5";
import { MdAccessTimeFilled } from "react-icons/md";
import { PiTrash } from "react-icons/pi";
export default function Checkout() {
    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} >

            <div className='p-4 leading-3'>
                <h2 className="uppercase text-2xl font-bold flex items-center gap-2 "> <BsBasket2Fill /> itens do pedido </h2>
                {/* <span className='text-[12px]'>Você pode coferir todos os pedidos realizados em nosso site, e também pode refazer eles de forma rápida e prática!</span> */}
            </div>

            <section className="bg-white p-4">
                <div className="flex justify-between items-start text-sm gap-2">
                    <span className="font-semibold">1x COMBO COSTELA + FRITAS E RIFRIGERANTE</span>
                    <strong className="whitespace-nowrap">R$ 39,90</strong>
                    <PiTrash className="" size={22} />
                </div>
                <div className="flex flex-col text-muted-foreground text-sm">
                    <span>padrão</span>
                    <span>com batatinha</span>
                    <strong>+1x fanta uva lata</strong>
                </div>
            </section>

            <div className='p-4 leading-3'>
                <h2 className="uppercase text-2xl font-bold flex items-center gap-2 "> <FaUserTag /> minhas informações </h2>
                {/* <span className='text-[12px]'>Você pode coferir todos os pedidos realizados em nosso site, e também pode refazer eles de forma rápida e prática!</span> */}
            </div>

            <section className="bg-white p-4 space-y-8">
                <div className="flex items-center ">
                    <FaMapMarkedAlt size={25} className="text-muted-foreground" />
                    <div className="flex justify-between items-center w-full ">
                        <div className="flex flex-col items-start leading-4 ml-3">
                            <span className="font-semibold">Entregar em:</span>
                            <span className="text-muted-foreground text-sm">Rua das Flores, 123</span>
                        </div>
                        <Button size={'sm'} variant={'destructive'}>Alterar</Button>
                    </div>
                </div>

                <div className="flex items-center ">
                    <MdAccessTimeFilled size={25} className="text-muted-foreground" />
                    <div className="flex justify-between items-center w-full ">
                        <div className="flex flex-col items-start leading-4 ml-3">
                            <span className="font-semibold">Horário:</span>
                            <span className="text-muted-foreground text-sm">Entregar dia 02/12 as 08:00</span>
                        </div>
                        <Button size={'sm'} variant={'destructive'}>Alterar</Button>
                    </div>
                </div>

                <div className="flex items-center ">
                    <HiTicket size={25} className="text-muted-foreground" />
                    <div className="flex justify-between items-center w-full ">
                        <div className="flex flex-col items-start leading-4 ml-3">
                            <span className="font-semibold">Cupom Aplicado:</span>
                            <span className="text-muted-foreground text-sm">#MEUCUPOM (desconto de 10%)</span>
                        </div>
                        <Button size={'sm'} variant={'destructive'}>Alterar</Button>
                    </div>
                </div>

                <div className="">
                    <div className="flex items-center ">
                        <FaPiggyBank size={25} className="text-muted-foreground" />
                        <div className="flex justify-between items-center w-full ">
                            <div className="flex flex-col items-start leading-4 ml-3">
                                <span className="font-semibold">Saldo disponível: <span className="text-emerald-500">R$ 7,64</span></span>
                                <span className="text-muted-foreground text-sm">Utilizar o saldo disponível nesta compra?</span>
                            </div>
                            <Switch className="" />
                        </div>
                    </div>
                    <span className=" bg-muted-foreground text-white text-[12px] rounded-md p-0.5 ml-8">Após essa compra, sobrará R$ 7,64</span>
                </div>

                <div className="flex items-center ">
                    <IoWallet size={25} className="text-muted-foreground" />
                    <div className="flex justify-between items-center w-full ">
                        <div className="flex flex-col items-start leading-4 ml-3">
                            <span className="font-semibold">Pagamento:</span>
                            <span className="text-muted-foreground text-sm">Escolha a forma de pagamento</span>
                        </div>
                        <Button size={'sm'} variant={'success'}>Escolher</Button>
                    </div>
                </div>

                <Separator />

                <div className="flex flex-col items-end gap-1 mt-8 text-base   ">
                    <span>Subtotal: R$ 39,90</span>
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

            <footer className="text-[12px] flex justify-center p-1 items-center text-muted-foreground gap-2 t"><FaCoins /> Você ganhará <strong>R$ 3,59</strong> de cashback com essa compra.</footer>
        </motion.main>
    )
}