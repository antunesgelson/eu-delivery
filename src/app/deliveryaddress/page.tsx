'use client'
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ModalRemove } from "@/components/Modal/Remove";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { FaMapLocationDot, FaRegStar, FaRegTrashCan, FaStar } from "react-icons/fa6";
import { MdAddLocation } from "react-icons/md";
import { TiEdit } from "react-icons/ti";

import { AddressDTO } from "@/dto/addressDTO";
import { api } from "@/service/api";
import { useQuery } from "@tanstack/react-query";

export default function DeliveryAddress() {
    const [favorite, setFavorite] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [address, setAddress] = useState<AddressDTO>({} as AddressDTO);

    const { data: addressList, refetch } = useQuery({
        queryKey: ['deliveryaddress-list'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/endereco/todos')
                return data
            } catch (error) {
                console.log(error)
                toast.error('Erro ao buscar endereços')
                throw new Error('Erro ao buscar endereços')
            }
        }
    })

    function handleRemoveAddress(address: AddressDTO) {
        setOpenModal(true)
        setAddress(address)
    }


    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3'>
                <h1 className="uppercase text-2xl font-bold flex items-center gap-1 "><FaMapLocationDot size={25} /> endereços salvos </h1>
                <span className='text-[12px]'>Você pode editar, excluir ou adicionar novos endereços...</span>
                <br />
                <span className='text-[12px]'>Quando a fome bater, o seu pedido vai ser ainda mais rapido!</span>
            </div>

            <section className="bg-white p-4 h-full flex flex-col justify-between">
                {addressList?.length == 0 && <span className="text-center my-auto text-sm text-muted-foreground">Nenhum endereço cadastrado.</span>}
                {addressList && addressList?.length > 0 && addressList.map((address: AddressDTO) => (
                    <div key={address.id} >
                        <div className="flex justify-between items-center">
                            <h2 className="uppercase font-bold">{address.apelido}</h2>
                            <div className="flex items-center ">
                                {/* Editar */}
                                <Link href={`/deliveryaddress/edit/${address.id}`}>
                                    <TiEdit size={20} />
                                </Link>
                                {/* Remover */}
                                <Button
                                    variant={'icon'}
                                    onClick={() => handleRemoveAddress(address)}>
                                    <FaRegTrashCan />
                                </Button>
                                {/* Favoritar */}
                                {address.favorite
                                    ? <FaStar onClick={() => setFavorite(!favorite)} className="text-amber-500" />
                                    : <FaRegStar onClick={() => setFavorite(!favorite)} />
                                }
                            </div>
                        </div>

                        <span className="text-muted-foreground">{address.rua}, {address.numero}</span> <br />
                        <span className="text-muted-foreground">{address.bairro} - SUA-CIDADE, SEU-ESTADO</span>
                        <p className="italic text-muted-foreground">{address.complemento}</p>
                        <p className="italic text-muted-foreground">{address.referencia}</p>

                        <Separator className="my-4" />
                    </div>
                ))}

                <div className="flex justify-center my-4">
                    <Button asChild className="flex  items-center gap-1 w-full" variant={'success'}>
                        <Link href={'/deliveryaddress/add'}>
                            <MdAddLocation size={18} />
                            Adicionar novo endereço
                        </Link>
                    </Button>
                </div>
            </section>

            <ModalRemove
                address={address}
                refetch={refetch}
                open={openModal}
                onClose={() => setOpenModal(false)}
            />
        </motion.main>
    )
}