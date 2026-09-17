'use client'
import axios, { AxiosError } from "axios";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { enderecoSchema } from '@/lib/endereco';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { IoIosArrowRoundForward } from "react-icons/io";
import { MdEditLocationAlt } from "react-icons/md";

import { LocationDTO } from "@/dto/addressDTO";
import { api, mostrarErro } from "@/service/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import zod, { z } from "zod";

const CompleteAddressSchema = enderecoSchema;

export type CompleteAddressForm = z.infer<typeof CompleteAddressSchema>

type Props = {
    location: LocationDTO;
}

const CompleteAddress = ({ location }: Props) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string;
    const router = useRouter();
    const client = useQueryClient();
    const [address, setAddress] = useState('');
    const { handleSubmit, register, reset, formState: { errors } } = useForm<CompleteAddressForm>({
        resolver: zodResolver(CompleteAddressSchema)
    })

    const { mutate: handleCompletAddress, isPending } = useMutation({
        mutationKey: ['completeAddress'],
        mutationFn: async ({ apelido, bairro, cep, complemento, numero, referencia, rua }: CompleteAddressForm) => {
            const { data } = await api.post('/endereco', {
                apelido: apelido,
                bairro: bairro,
                cep: cep?.replace(/\D/g,''),
                complemento: complemento,
                numero: numero,
                referencia: referencia,
                rua: rua,
            })
            return data
        }, onSuccess() {
            void client.invalidateQueries({ queryKey: ['deliveryaddress-list'] });
            toast.success('Endereço cadastrado com sucesso!')
            router.push(`/deliveryaddress`);
        }, onError: mostrarErro,

    })



    const handleReverseGeocode = useCallback(async (lat: number, lng: number) => {
        try {
            const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`);
            if (data.status === 'OK') {
                const address = data.results[0]?.formatted_address;
                setAddress(address);
                return address;
            } else {
                console.log("Erro =>", data)
                console.error('Erro na geocodificação reversa:', data.status);
                return null;
            }
        } catch (error) {
            console.error('Erro ao converter lat/lng em endereço:', error);
            throw error;
        }
    }, [key]);



    const parseAddress = useCallback((address: string) => {
        const addressParts = address.split(',');
        const numberAndNeighborhood = addressParts[1]?.split('-')
        const cityAndState = addressParts[2]?.split('-')

        const rua = addressParts[0]?.trim();
        const numero = numberAndNeighborhood?.[0]?.trim();
        const bairro = numberAndNeighborhood?.[1]?.trim();
        const cidade = cityAndState?.[0]?.trim()
        const estado = cityAndState?.[1]?.trim()
        const cep = addressParts[3]?.trim()
        return {
            rua,
            numero,
            bairro,
            cidade,
            estado,
            cep
        }
    }, []);

    React.useEffect(() => {
        const { lat, lng } = location;
        if (lat && lng) {
            void handleReverseGeocode(lat, lng).catch(() => toast.error("Não foi possível localizar o endereço. Preencha os campos manualmente."));
        }
    }, [handleReverseGeocode, location]);

    useEffect(() => {
        if (address) {
            const parsed = parseAddress(address);
            reset({
                rua: parsed.rua ?? '',
                numero: parsed.numero ?? '',
                bairro: parsed.bairro ?? '',
                cep: parsed.cep ?? '',

            })
        }
    }, [address, reset, parseAddress]);

    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}>
            <div className='p-4 leading-3'>
                <h2 className="uppercase text-xl font-bold flex items-center gap-1 "><MdEditLocationAlt size={25} />complete o seu endereço</h2>
                <span className='text-[12px] '>
                    Complete o endereço com informações adicionais.
                </span>
            </div>

            <section className="bg-white p-4">
                <form onSubmit={handleSubmit((data) => handleCompletAddress(data))} className="space-y-4">
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
                        className="w-full"
                        variant={'success'}>
                        Continuar
                        <IoIosArrowRoundForward size={18} />
                    </Button>
                </form>
            </section>
        </motion.main >
    )
}

export default CompleteAddress;
