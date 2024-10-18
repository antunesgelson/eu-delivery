'use client'
import useCart from "@/hook/useCart"
import Link from "next/link"
import React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import { AddressDTO } from "@/dto/addressDTO"
import { api } from "@/service/api"
import { useMutation, useQuery } from "@tanstack/react-query"

import { AxiosError } from "axios"
import { CgArrowsExchange } from "react-icons/cg"
import { FaMapLocationDot, FaRegStar, FaStar } from "react-icons/fa6"
import { MdAddLocation } from "react-icons/md"


type Props = {
    open: boolean
    onClose: () => void
}

export function ModalChooseAdress({ open, onClose }: Props) {
    const { handleUpdateCart } = useCart()

    const { mutateAsync: handleChangeAddress, isPending } = useMutation({
        mutationKey: ['change-address-order'],
        mutationFn: async (addressID: number) => {
            const { data } = await api.put('/pedido', {
                enderecoId: addressID
            })

            return data
        }, onSuccess(data) {
            console.log('data => ', data)
            handleUpdateCart()
            onClose()
            toast.success('Endereço de entrega alterado com sucesso!')

        }, onError(error: unknown) {
            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Erro inesperado, tente novamente mais tarde.')
            }
        }
    })



    const { data: addressList } = useQuery({
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

    React.useEffect(() => {

    }, [addressList]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className=" min-h-[530px]  h-[530px] w-11/12 mx-auto rounded-md ">
                <DialogHeader className="h-16 ">
                    <DialogTitle className=" ">
                        <div className='py-4 leading-3 flex flex-col justify-center items-center '>
                            <h1 className="uppercase text-xl font-bold flex items-center gap-1 "><FaMapLocationDot /> endereços salvos </h1>
                            <span className='text-xs'>Selecione o endereço que deseja receber seu pedido.</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[50vh] -mt-10">
                    <section className=" h-full flex flex-col justify-between gap-2 ">
                        {addressList?.length == 0 && <span className="text-center my-auto text-sm text-muted-foreground">Nenhum endereço cadastrado.</span>}
                        {addressList && addressList?.length > 0 && addressList.map((address: AddressDTO) => (
                            <div
                                key={address.id}
                                className={`bg-white p-4 rounded-lg shadow-sm drop-shadow-lg border cursor-pointer ${address.favorite && 'border-emerald-500'}`}
                                onClick={() => handleChangeAddress(address.id)}>
                                <div className="flex justify-between items-center">
                                    <h2 className="uppercase font-bold">{address.apelido}</h2>
                                    <div className="flex items-center ">
                                        {/* Favoritar */}
                                        {address.favorite
                                            ? <FaStar className="text-amber-500 cursor-pointer" />
                                            : <FaRegStar className="cursor-pointer" />
                                        }
                                    </div>
                                </div>
                                <span className="text-muted-foreground">{address.rua}, {address.numero}</span> <br />
                                <span className="text-muted-foreground">{address.bairro} - SUA-CIDADE, SEU-ESTADO</span>
                                <p className="italic text-muted-foreground">{address.complemento}</p>
                                <p className="italic text-muted-foreground">{address.referencia}</p>
                            </div>
                        ))}
                    </section>
                </ScrollArea>

                <DialogFooter className=" fixed bottom-4 right-4 left-4  ">
                    <div className="flex justify-center items-center ">
                        {addressList?.length == 0 &&
                            <Button asChild className="flex  items-center gap-1 w-full" variant={'success'}>
                                <Link href={'/deliveryaddress/add'}>
                                    <MdAddLocation size={18} />
                                    Adicionar novo endereço
                                </Link>
                            </Button>
                        }
                        {addressList &&
                            <Button
                                loading={isPending}
                                variant={'success'}
                                className="w-full flex items-center justify-center ">
                                Alterar
                                <CgArrowsExchange size={23} />
                            </Button>
                        }
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


