'use client'
import axios from "axios";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { IoIosArrowRoundForward } from "react-icons/io";
import { MdEditLocationAlt } from "react-icons/md";

import { LocationDTO } from "@/dto/addressDTO";
import { api } from "@/service/api";
import { useMutation } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import zod, { z } from "zod";

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

type Props = {
    location: LocationDTO;
}

const CompleteAddress = ({ location }: Props) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string;
    const router = useRouter();
    const [address, setAddress] = useState('');
    const { handleSubmit, register, reset, formState: { errors } } = useForm<CompleteAddressForm>({
        resolver: zodResolver(CompleteAddressSchema)
    })

    const { mutateAsync: handleCompletAddress, isPending } = useMutation({
        mutationKey: ['completeAddress'],
        mutationFn: async ({ apelido, bairro, cep, complemento, numero, referencia, rua }: CompleteAddressForm) => {
            const { data } = await api.post('/endereco', {
                apelido: apelido,
                bairro: bairro,
                cep: cep,
                complemento: complemento,
                numero: numero,
                referencia: referencia,
                rua: rua,
            })
            return data
        }, onSuccess(data) {
            toast.success('Endereço cadastrado com sucesso!')
            router.push(`/deliveryaddress`);
        }, onError(error: any) {
            console.error('Erro ao completar endereço:', error);
            toast.error(error.response.data.message)
            throw error;
        },
    })

    async function handleReverseGeocode(lat: number, lng: number) {
        try {
            const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`);
            if (data.status === 'OK') {
                const address = data.results[0]?.formatted_address;
                setAddress(address);
                return address;
            } else {
                console.error('Erro na geocodificação reversa:', data.status);
                return null;
            }
        } catch (error) {
            console.error('Erro ao converter lat/lng em endereço:', error);
            throw error;
        }
    };


    function parseAddress(address: string) {
        const addressParts = address.split(',');
        const numberAndNeighborhood = addressParts[1]?.split('-')
        const cityAndState = addressParts[2]?.split('-')

        const rua = addressParts[0]?.trim();
        const numero = numberAndNeighborhood[0]?.trim();
        const bairro = numberAndNeighborhood[1]?.trim();
        const cidade = cityAndState[0]?.trim()
        const estado = cityAndState[1]?.trim()
        const cep = addressParts[3]?.trim()

        return {
            rua,
            numero,
            bairro,
            cidade,
            estado,
            cep
        }
    }

    useEffect(() => {
        const { lat, lng } = location;
        if (lat && lng) {
            handleReverseGeocode(lat, lng);
        }
    }, []);

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
    }, [address]);

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
