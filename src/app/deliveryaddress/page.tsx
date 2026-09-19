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
import { api, mostrarErro } from "@/service/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useCart from "@/hook/useCart";
import { useRetornoEndereco } from "@/hook/useRetornoEndereco";
import { useRouter } from "next/navigation";
import React from "react";

function DeliveryAddressContent() {
    const { returnTo, addressLink } = useRetornoEndereco();
    const router = useRouter();
    const { chooseDeliveryAddress, isPending: isSelecting } = useCart();
    const selecting = React.useRef(false);
    const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
    async function selectAddress(id: number) {
        if (!returnTo || selecting.current) return;
        selecting.current = true;
        setSelectedAddress(id);
        try {
            await chooseDeliveryAddress(id);
            toast.success("Endereço de entrega selecionado.");
            router.push(returnTo);
        } catch {
            // O contexto do carrinho apresenta o erro retornado pela API.
        } finally {
            selecting.current = false;
            setSelectedAddress(null);
        }
    }
    const client = useQueryClient();
    const [openModal, setOpenModal] = useState(false);
    const [address, setAddress] = React.useState<AddressDTO>({} as AddressDTO);



    const { data: addressList, refetch, isPending: isLoading, isError } = useQuery<AddressDTO[]>({
        queryKey: ['deliveryaddress-list'],
        queryFn: async () => (await api.get('/endereco/todos')).data,
    });


    function handleRemoveAddress(address: AddressDTO) {
        setOpenModal(true)
        setAddress(address)
    }



    const { mutate: handleEditAddress, isPending: isSaving } = useMutation({
        mutationKey: ['editAddress-favorite'],
        mutationFn: async (address: AddressDTO) => {
            const { data } = await api.put('/endereco', {
                id: address.id,
                favorite: !address.favorite,
            })
            return data
        }, onSuccess() {
            void client.invalidateQueries({ queryKey: ['deliveryaddress-list'] });
        }, onError: mostrarErro,

    })


    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3'>
                <h1 className="uppercase text-2xl font-bold flex items-center gap-1 "><FaMapLocationDot size={25} /> endereços salvos </h1>
                <span className='text-xs'>Você pode editar, excluir ou adicionar novos endereços...</span>
                <br />
                <span className='text-xs'>Quando a fome bater, o seu pedido vai ser ainda mais rapido!</span>
            </div>

            {returnTo && <div className="p-4 space-y-2"><p>Selecione onde deseja receber este pedido. A disponibilidade e a taxa serão verificadas ao escolher.</p><Button asChild variant="outline"><Link href={returnTo}>Voltar ao pedido</Link></Button></div>}
            <section className="bg-white p-4 h-full flex flex-col justify-between">
                {isLoading && <p role="status">Carregando endereços…</p>}
                {isError && <div role="alert">Não foi possível carregar os endereços. <Button onClick={() => refetch()}>Tentar novamente</Button></div>}
                {addressList?.length == 0 && <span className="text-center my-auto text-sm text-muted-foreground">Nenhum endereço cadastrado.</span>}
                {addressList && addressList?.length > 0 && addressList.map((address: AddressDTO) => (
                    <article key={address.id} aria-label={`Endereço ${address.apelido}`} >
                        <div className="flex justify-between items-center">
                            <h2 className="uppercase font-bold">{address.apelido}</h2>
                            <div className="flex items-center ">
                                {/* Editar */}
                                <Link aria-label={`Editar ${address.apelido}`} href={addressLink(`/deliveryaddress/edit/${address.id}`)}>
                                    <TiEdit size={20} />
                                </Link>
                                {/* Remover */}
                                <Button
                                    disabled={isSelecting} aria-label={`Excluir ${address.apelido}`} variant={'icon'}
                                    onClick={() => handleRemoveAddress(address)}>
                                    <FaRegTrashCan />
                                </Button>
                                {/* Favoritar */}
                                <Button variant="icon" disabled={isSaving} aria-label={`${address.favorite ? 'Desfavoritar' : 'Favoritar'} ${address.apelido}`} onClick={() => handleEditAddress(address)}>
                                    {address.favorite ? <FaStar className="text-amber-500" /> : <FaRegStar />}
                                </Button>
                            </div>
                        </div>

                        <span className="text-muted-foreground">{address.rua}, {address.numero}</span> <br />
                        <span className="text-muted-foreground">{address.bairro}</span>
                        <p className="italic text-muted-foreground">{address.complemento}</p>
                        <p className="italic text-muted-foreground">{address.referencia}</p>

                        {returnTo && <Button className="mt-3 w-full" variant="success" disabled={isSelecting || selectedAddress !== null} onClick={() => void selectAddress(address.id)}>{selectedAddress === address.id ? "Verificando entrega…" : "Entregar aqui"}</Button>}
                        <Separator className="my-4" />
                    </article>
                ))}

                <div className="flex justify-center my-4">
                    <Button asChild className="flex  items-center gap-1 w-full" variant={'success'}>
                        <Link href={addressLink('/deliveryaddress/add')}>
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
export default function DeliveryAddress() {
    return <React.Suspense fallback={<main className="mt-16 p-4" role="status">Carregando endereços…</main>}><DeliveryAddressContent /></React.Suspense>;
}
