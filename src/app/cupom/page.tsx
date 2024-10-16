
'use client'
import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CupomDTO } from "@/dto/cupomDTO";
import { api } from "@/service/api";
import { useMutation } from "@tanstack/react-query";

import useCart from "@/hook/useCart";
import { useRouter } from "next/navigation";
import { HiTicket } from "react-icons/hi2";
import { IoTicketSharp } from "react-icons/io5";
import { toast } from "sonner";

export default function Cupom() {
    const [checked, setChecked] = React.useState<string | null>(null);
    const { cuponsFree, handleUpdateCart, handleUpdateCupom, cupom: cupomActive } = useCart()
    const router = useRouter()

    const { mutateAsync: handleAppyCupom } = useMutation({
        mutationKey: ['apply-cupom-free'],
        mutationFn: async ({ nome }: CupomDTO) => {
            const { data } = await api.put('/pedido', {
                cupom: nome
            })

            return data
        }, onSuccess(data) {
            console.log('data => ', data)
            handleUpdateCart()
            handleUpdateCupom()
            router.replace('/checkout');
            toast.success('Cupom aplicado com sucesso!')

        }, onError(error: unknown) {
            console.error(error)
        },
    })

    function handleWapperApplyCupom(cupom: CupomDTO) {
        setChecked(cupom.id)
        handleAppyCupom(cupom)
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };


    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>
            <div className='p-4 leading-3'>
                <h2 className="uppercase text-base text-center my-1 font-bold"> informe o código do seu cupom:</h2>
                <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-4">
                        <Input
                            placeholder="código do cupom"
                            className=" bg-white border-[2px] border-dashed uppercase text-muted"
                        />
                    </div>
                    <Button className="w-full col-span-2 flex items-center gap-1" variant={'success'}>
                        Aplicar
                        <IoTicketSharp size={20} />
                    </Button>
                </div>
            </div>

            <div className='p-4 leading-3'>
                <h1 className="uppercase text-base font-bold -mb-7 -mt-3 text-center"> ou escola um dos cupons disponíveis:</h1>
            </div>

            <div className="flex flex-col justify-between ">
                <ScrollArea className=" p-4 text-sm h-[60vh] ">
                    {cuponsFree?.filter((oldCupom) => oldCupom.listaPublica == true).map((cupom) => (
                        <div key={cupom.id}
                            className={`border my-1  rounded-lg p-4 bg-white relative duration-300 flex justify-between items-center ${checked === cupom.id || cupom.id == cupomActive?.id && 'border-emerald-500'}`}
                            onClick={() => handleWapperApplyCupom(cupom)}>
                            <div className="flex flex-col text-xs leading-4">
                                <span className="font-semibold uppercase flex items-center gap-1">
                                    <HiTicket size={25} className="text-muted-foreground" />
                                    {cupom.nome}
                                </span>
                                <span className="text-muted-foreground ">{cupom.descricao}</span>
                                <span className="text-muted-foreground ">Validade: {formatDate(cupom.validade)}</span>
                                <Link href={'/cashback'} className="font-bold cursor-pointer">VER REGRAS</Link>
                            </div>
                            <div>
                                <Checkbox
                                    className=" "
                                    checked={checked === cupom.id || cupom.id == cupomActive?.id}
                                    variant={`add`}
                                />
                            </div>
                        </div>
                    ))}
                </ScrollArea>


            </div>
        </motion.main>
    )
}