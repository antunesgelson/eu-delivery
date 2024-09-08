'use client'
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { BsSave } from "react-icons/bs";
import { MdEditLocationAlt } from "react-icons/md";

import { api } from "@/service/api";
import { useMutation, useQuery } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import zod, { z } from "zod";

type Props = {
    params?: { addressID?: number }
}

const CompleteAddressSchema = zod.object({
    apelido: zod.string().min(1, 'Informe um apelido para o endereço.'),
    rua: zod.string().optional(),
    bairro: zod.string().optional(),
    cep: zod.string().optional(),
    numero: zod.string().optional(),
    complemento: zod.string().min(1, 'Informe um complemento para o endereço.'),
    referencia: zod.string().min(1, 'Informe uma referência para o endereço.'),
})

export type CompleteAddressForm = z.infer<typeof CompleteAddressSchema>


const CompleteAddress = ({ params }: Props) => {
    const router = useRouter();
    const { handleSubmit, register, reset, formState: { errors } } = useForm<CompleteAddressForm>({
        resolver: zodResolver(CompleteAddressSchema)
    })

    const { mutateAsync: handleEditAddress, isPending } = useMutation({
        mutationKey: ['editAddress'],
        mutationFn: async ({ apelido, bairro, cep, complemento, numero, referencia, rua }: CompleteAddressForm) => {
            const addressID = params?.addressID ? parseInt(params.addressID.toString(), 10) : 0;
            const { data } = await api.put('/endereco', {
                id: addressID,
                favorite: false,
                apelido: apelido,
                rua: rua,
                bairro: bairro,
                cep: cep,
                numero: numero,
                complemento: complemento,
                referencia: referencia,
            })
            return data
        }, onSuccess(data) {
            toast.success('Endereço editado com sucesso!')
            router.push(`/deliveryaddress`);
        }, onError(error: any) {
            console.error('Erro ao editar endereço:', error);
            toast.error(error.response.data.message)
            throw error;
        },
    })


    const { data: address } = useQuery({
        queryKey: ['deliveryaddress-ID'],
        queryFn: async () => {
            try {
                const { data } = await api.get(`/endereco/${params?.addressID}`)
                return data
            } catch (error) {
                console.log(error)
                toast.error('Erro ao buscar endereço')
                throw new Error('Erro ao buscar endereço')
            }
        }
    })


    useEffect(() => {
        if (!address) return
        address.map((address: CompleteAddressForm) => (
            reset({
                apelido: address.apelido ?? '',
                rua: address.rua ?? '',
                numero: address.numero ?? '',
                bairro: address.bairro ?? '',
                cep: address.cep ?? '',
                complemento: address.complemento ?? '',
                referencia: address.referencia ?? '',
            })
        ))
    }, [address]);


    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}>
            <div className='p-4 leading-3'>
                <h1 className="uppercase text-2xl font-bold flex items-center gap-1"><MdEditLocationAlt size={25} />edite o seu endereço</h1>
                <span className='text-[12px]'>Preencha todos os detalhes do seu endereço para garantir que seu pedido chegue rapidinho!</span>
            </div>

            <section className="bg-white p-4">
                <form onSubmit={handleSubmit((data) => handleEditAddress(data))} className="space-y-4">
                    <div>
                        <Label className="uppercase" htmlFor="terms">apelido</Label>
                        <Input
                            className="uppercase"
                            {...register('apelido')}
                            error={errors.apelido?.message}
                        />
                    </div>

                    <div>
                        <Label className="uppercase" htmlFor="terms">endereço</Label>
                        <Input
                            disabled
                            className="capitalize"
                            {...register('rua')}
                            error={errors.rua?.message}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="uppercase" htmlFor="terms">bairro</Label>
                            <Input
                                disabled
                                type="text"
                                className="capitalize"
                                {...register('bairro')}
                                error={errors.bairro?.message}
                            />
                        </div>

                        <div>
                            <Label className="uppercase" htmlFor="terms">cep </Label>
                            <Input
                                disabled
                                type="text"
                                {...register('cep')}
                                error={errors.cep?.message}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="uppercase" htmlFor="terms">número</Label>
                            <Input
                                disabled
                                type="text"
                                className="capitalize"
                                {...register('numero')}
                                error={errors.numero?.message}
                            />
                        </div>

                        <div>
                            <Label className="uppercase" htmlFor="terms">complemento</Label>
                            <Input
                                type="text"
                                placeholder="Ex: Bloco 1, AP 321"
                                {...register('complemento')}
                                error={errors.complemento?.message}
                            />
                        </div>
                    </div>

                    <div className=' '>
                        <Label className="uppercase" htmlFor="terms">referência</Label>
                        <Textarea
                            rows={5}
                            placeholder="Digite sua mensagem aqui."
                            {...register('referencia')}
                            error={errors.referencia?.message}
                        />
                    </div>

                    <Button
                        type="submit"
                        loading={isPending}
                        className="w-full flex items-center gap-1"
                        variant={'success'}>
                        Salvar alterações
                        <BsSave />
                    </Button>
                </form>
            </section>
        </motion.main >
    )
}

export default CompleteAddress;

