'use client'
import {useParams} from 'next/navigation';
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

import { useRetornoEndereco } from "@/hook/useRetornoEndereco";
import Link from "next/link";
import { enderecoSchema } from '@/lib/endereco';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { BsSave } from "react-icons/bs";
import { MdEditLocationAlt } from "react-icons/md";

import { api, mostrarErro } from "@/service/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import zod, { z } from "zod";

type Props = {
    params?: { addressID?: number }
}

const CompleteAddressSchema = enderecoSchema;

export type CompleteAddressForm = z.infer<typeof CompleteAddressSchema>


const CompleteAddress = () => {
 const params=useParams<{addressID:string}>();
    const router = useRouter();
    const { returnTo, addressLink } = useRetornoEndereco();
    const client = useQueryClient();
    const { handleSubmit, register, reset, formState: { errors } } = useForm<CompleteAddressForm>({
        resolver: zodResolver(CompleteAddressSchema)
    })

    const { mutate: handleEditAddress, isPending } = useMutation({
        mutationKey: ['editAddress'],
        mutationFn: async ({ apelido, bairro, cep, complemento, numero, referencia, rua }: CompleteAddressForm) => {
            const addressID = params?.addressID ? parseInt(params.addressID.toString(), 10) : 0;
            const { data } = await api.put('/endereco', {
                id: addressID,

                apelido: apelido,
                rua: rua,
                bairro: bairro,
                cep:cep?.replace(/\D/g,''),
                numero: numero,
                complemento: complemento,
                referencia: referencia,
            })
            return data
        }, onSuccess(data) {
            client.setQueryData(["deliveryaddress-ID", params.addressID], data);
            void client.invalidateQueries({ queryKey: ['deliveryaddress-list'] });
            toast.success('Endereço editado com sucesso!')
            router.push(addressLink("/deliveryaddress"));
        }, onError: mostrarErro,

    })


    const query = useQuery<CompleteAddressForm>({
        queryKey: ['deliveryaddress-ID', params.addressID],
        queryFn: async () => (await api.get(`/endereco/${params.addressID}`)).data,
        enabled: !!params.addressID,
        refetchOnWindowFocus: false,
    });
    useEffect(() => {
        if (query.data) reset(query.data);
    }, [query.data, reset]);
    if (query.isPending) return <main className="mt-16 p-4" role="status">Carregando endereço…</main>;
    if (query.isError) return <main className="mt-16 p-4" role="alert">Não foi possível carregar o endereço. <Button onClick={() => query.refetch()}>Tentar novamente</Button></main>;


    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}>
            <div className='p-4 leading-3'>
                <h1 className="uppercase text-2xl font-bold flex items-center gap-1"><MdEditLocationAlt size={25} />edite o seu endereço</h1>
                <span className='text-[12px]'>{returnTo ? "Após salvar, selecione o endereço para atualizar a entrega deste pedido." : "Preencha todos os detalhes do seu endereço."}</span>
            </div>

            <section className="bg-white p-4">
                <form onSubmit={handleSubmit((data) => handleEditAddress(data))} className="space-y-4">
                    <div>
                        <Label className="uppercase" htmlFor="apelido">apelido</Label>
                        <Input
                            className="uppercase"
                            id="apelido" {...register('apelido')}
                            error={errors.apelido?.message}
                        />
                    </div>

                    <div>
                        <Label className="uppercase" htmlFor="rua">endereço</Label>
                        <Input
                            className="capitalize"
                            id="rua" {...register('rua')}
                            error={errors.rua?.message}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="uppercase" htmlFor="bairro">bairro</Label>
                            <Input
                                    type="text"
                                className="capitalize"
                                id="bairro" {...register('bairro')}
                                error={errors.bairro?.message}
                            />
                        </div>

                        <div>
                            <Label className="uppercase" htmlFor="cep">cep </Label>
                            <Input
                                    type="text"
                                id="cep" {...register('cep')}
                                error={errors.cep?.message}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="uppercase" htmlFor="numero">número</Label>
                            <Input
                                    type="text"
                                className="capitalize"
                                id="numero" {...register('numero')}
                                error={errors.numero?.message}
                            />
                        </div>

                        <div>
                            <Label className="uppercase" htmlFor="complemento">complemento</Label>
                            <Input
                                type="text"
                                placeholder="Ex: Bloco 1, AP 321"
                                id="complemento" {...register('complemento')}
                                error={errors.complemento?.message}
                            />
                        </div>
                    </div>

                    <div className=' '>
                        <Label className="uppercase" htmlFor="referencia">referência</Label>
                        <Textarea
                            rows={5}
                            placeholder="Digite sua mensagem aqui."
                            id="referencia" {...register('referencia')}
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
                    <Button asChild variant="outline" className="w-full"><Link href={addressLink("/deliveryaddress")}>Voltar aos endereços</Link></Button>
                </form>
            </section>
        </motion.main >
    )
}

export default function EditAddress() {
    return <Suspense fallback={<main className="mt-16 p-4" role="status">Carregando endereço…</main>}><CompleteAddress /></Suspense>;
}

