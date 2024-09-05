'use client'
import { signIn } from "next-auth/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { AnimatePresence, motion } from "framer-motion";

import { api } from "@/service/api";
import { BsWhatsapp } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { LuUnplug } from "react-icons/lu";
import { toast } from "sonner";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";


const schemaSignIn = z.object({
    cellPhone: z.string().min(8, { message: 'Telefone inválido' }).max(11, { message: 'Telefone inválido' })
})
type SignInForm = z.infer<typeof schemaSignIn>


type Props = {
    searchParams?: { error?: string }
}
export default function Signin({ searchParams }: Props) {
    const { watch, setValue, register, formState: { errors } } = useForm<SignInForm>({
        resolver: zodResolver(schemaSignIn)
    })
    const router = useRouter()
    const cellPhone = watch('cellPhone');

    const cellPhoneFormat = (phone: string) => {
        if (!phone) return phone;
        const cleaned = phone.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length > 0) {
            formatted = `(${cleaned.substring(0, 2)}`;
        }
        if (cleaned.length >= 3) {
            formatted += `) ${cleaned.substring(2, 7)}`;
        }
        if (cleaned.length >= 8) {
            formatted += `-${cleaned.substring(7, 11)}`;
        }
        return formatted;
    };

    const { mutateAsync: handleGetCodeWP, isPending } = useMutation({
        mutationKey: ['auth-wp'],
        mutationFn: async () => {
            const tel = cellPhone.replace(/\D/g, '');
            const { data } = await api.post('/auth/wp', {
                tel: `55${tel}`
            })
            return data
        },
        onSuccess: (data) => {
            toast.success(data.message)
            router.push(`/signin/getcode?tel=${cellPhone.replace(/\D/g, '')}`);
        },
        onError(error: any) {
            console.log(error.response.data.message)
            toast.error(error.response.data.message)
        }
    })


    useEffect(() => {
        setValue('cellPhone', cellPhoneFormat(cellPhone));
    }, [cellPhone, setValue]);

    useEffect(() => {
        if (searchParams?.error === 'permissions') {
            setTimeout(() => {
                toast.warning("Conexão Necessária!", {
                    description: "Para uma melhor experiência, conecte-se ao Google Calendário receber notificações de entrega.",
                    descriptionClassName: 'text-muted-foreground text-[11px]',
                    actionButtonStyle: { backgroundColor: '#141414', color: '#fff' },
                    duration: 9000, // Duração da notificação em milissegundos
                    action: {
                        label: <div className="flex items-center gap-1"><LuUnplug /> Conectar</div>,
                        onClick: () => signIn('google'),
                    },
                })
            }, 50);
        }
    }, [searchParams]);
    return (
        <motion.div
            className="mt-14"
            initial={{ opacity: 0, y: -100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3 text-center '>
                <h1 className="uppercase text-2xl font-bold ">faça login </h1>
                <span className='text-[12px]'>Cadastre-se e aproveite a melhor experiência.</span> <br />
                <span className='text-[10px] text-muted-foreground '>Ao fazer login com o  <strong>Google</strong> e realizar um pedido, <strong>agendaremos automaticamente</strong>  no seu <strong>calendario</strong>  a entrega para o dia escolhido.</span>
                <Button
                    className="font-semibold text-lg w-full mt-4 mb-1 flex items-center gap-2"
                    variant={'outline'}
                    size={'lg'}
                    onClick={() => signIn('google')}>
                    <FcGoogle size={22} />
                    Entrar com Google
                </Button>
                <span className='text-[11px] text-muted'>Fique tranquilo, nunca vamos publicar nada em seu nome.</span>
            </div>

            <div className="grid grid-cols-6 items-center">
                <Separator className="col-span-2" />
                <span className="uppercase text-sm text-center col-span-2">ou se preferir</span>
                <Separator className="col-span-2" />
            </div>

            <div className="px-4 py-6">
                <Input
                    className="bg-white h-10 rounded-md "
                    maxLength={15}
                    placeholder="Digite seu telefone."
                    {...register('cellPhone')}
                    error={errors.cellPhone?.message}
                />
            </div>


            <AnimatePresence>
                {cellPhone?.length == 15 &&
                    <motion.div
                        className="px-4"
                        initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4 }}>
                        <h3 className="text-[10px] text-muted-foreground text-center">
                            Escola a melhor forma para você receber o código de autenticação.
                        </h3>
                        <div className="flex gap-2 items-center justify-center  py-2">
                            <Button
                                variant={'success'}
                                loading={isPending}
                                className="w-full flex gap-1 items-center uppercase"
                                onClick={() => handleGetCodeWP()}>
                                <BsWhatsapp size={15} />
                                whatsapp
                            </Button>
                        </div>
                    </motion.div>
                }
            </AnimatePresence>
        </motion.div>
    )
}


