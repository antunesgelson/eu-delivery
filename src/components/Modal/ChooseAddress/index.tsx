'use client'
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

import { AddressDTO } from "@/dto/addressDTO"
import { api } from "@/service/api"
import { useQuery } from "@tanstack/react-query"

import { CgArrowsExchange } from "react-icons/cg"
import { FaMapLocationDot, FaRegStar, FaStar } from "react-icons/fa6"
import { MdAddLocation } from "react-icons/md"

type Props = {
    open: boolean
    onClose: () => void
}

export function ModalChooseAdress({ open, onClose }: Props) {

    // function handleRemoveAddress(address: AddressDTO) {
    //     setOpenModal(true)
    //     setAddress(address)
    // }

    // const { mutateAsync: handleEditAddress } = useMutation({
    //     mutationKey: ['editAddress-favorite'],
    //     mutationFn: async (address: AddressDTO) => {
    //         const { data } = await api.put('/endereco', {
    //             id: address.id,
    //             favorite: !address.favorite,
    //         })
    //         return data
    //     }, onSuccess(data) {

    //         console.log(data)
    //         // toast.success('Endereço editado com sucesso!')
    //     }, onError(error: any) {
    //         console.error('Erro ao editar endereço:', error);
    //         toast.error(error.response.data.message)
    //         throw error;
    //     },
    // })

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

                <section className=" h-full flex flex-col justify-between -mt-48">
                    {addressList?.length == 0 && <span className="text-center my-auto text-sm text-muted-foreground">Nenhum endereço cadastrado.</span>}
                    {addressList && addressList?.length > 0 && addressList.map((address: AddressDTO) => (
                        <div key={address.id} className={`bg-white p-4 rounded-lg shadow-sm drop-shadow-lg border ${address.favorite && 'border-emerald-500'}`}>
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
