'use client'

import { ModalRemove } from "@/components/Modal/Remove";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { FaRegStar, FaRegTrashCan, FaStar } from "react-icons/fa6";
import { TiEdit } from "react-icons/ti";
export default function DeliveryAddress() {
    const [favorite, setFavorite] = useState(true);
    const [openModal, setOpenModal] = useState(false);

    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3'>
                <h1 className="uppercase text-2xl font-bold ">endereços salvos </h1>
                <span className='text-[12px]'>Você pode editar, excluir ou adicionar novos endereços...</span>
                <br />
                <span className='text-[12px]'>Quando a fome bater, o seu pedido vai ser ainda mais rapido!</span>
            </div>

            <section className="bg-white p-4 h-[30dvh] flex flex-col justify-between">
                {/* <span className="text-center">Nenhum endereço cadastrado.</span> */}
                <div>
                    <div className="flex justify-between items-center">
                        <h2 className="uppercase font-bold">Casa</h2>
                        <div className="flex items-center ">
                            <Link href={'/deliveryaddress/edit'}>
                                <TiEdit size={20} />
                            </Link>
                            <Button variant={'icon'} onClick={() => setOpenModal(true)}>
                                <FaRegTrashCan />
                            </Button>
                            {favorite ? <FaStar onClick={() => setFavorite(!favorite)} className="text-amber-500" />
                                     : <FaRegStar onClick={() => setFavorite(!favorite)} />
                            }
                        </div>
                    </div>
                    <span className="text-muted-foreground">Rua Vani Correa, 332</span> <br />
                    <span className="text-muted-foreground">Bom Viver - Biguaçu, SC</span>
                    <p className="italic text-muted-foreground"> casa fundos</p>
                </div>

                <div className="flex justify-center my-4">
                    <Button className="w-full" variant={'success'}>
                        <Link href={'/deliveryaddress/add'}>
                            Adicionar novo endereço
                        </Link>
                    </Button>
                </div>
            </section>

            <ModalRemove
                open={openModal}
                onClose={() => setOpenModal(false)}
                addressTitle={'Casa'}
            />
        </motion.main>
    )
}