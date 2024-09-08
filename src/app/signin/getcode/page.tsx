'use client'
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot, } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

import { api } from "@/service/api";
import { useMutation } from "@tanstack/react-query";

import { motion } from "framer-motion";
import { JwtPayload, decode } from 'jsonwebtoken';
import { setCookie } from "nookies";
import { toast } from "sonner";

export type DecodedToken = JwtPayload & {
    sub: number,
    email: string,
    nome: string,
    tel: string,
    isAdmin: boolean,
    iat: number,
    exp: number
}

type Props = {
    searchParams?: { tel?: string }
}
export default function GetCode({ searchParams }: Props) {
    const [code, setCode] = useState('');
    const [time, setTime] = useState(60);  // Começa com 60 segundos
    const router = useRouter();

    const { mutateAsync: handleVerifyCode } = useMutation({
        mutationKey: ['auth-verifyCode'],
        mutationFn: async () => {
            const { data } = await api.post('/auth/verify', {
                code: parseInt(code),
            });
            setTime(60)  // Reinicia o cronômetro
            return data;
        },
        onSuccess(data, variables, context) {
            const userToken = decode(data.token) as DecodedToken;
            const maxAgeToken = userToken?.exp - userToken?.iat

            const maxAge = [{ name: '@eu:token', maxAge: maxAgeToken, token: data.token }]
            maxAge.map(({ name, maxAge, token }) => (
                setCookie(undefined, name, token, {
                    maxAge: maxAge,
                    path: "/",

                })
            ))
            toast.success('Código verificado com sucesso!');
            window.location.href = '/?firstLogin=true';
            // router.push(`/?firstLogin=true`);
        },

        onError(error: any) {
            console.log(error)
            toast.error(error.response.data.message)
        },
    })

    const { mutateAsync: handleGetCodeWP, isPending } = useMutation({
        mutationKey: ['auth-wp'],
        mutationFn: async () => {
            const { data } = await api.post('/auth/wp', {
                tel: `55${searchParams?.tel}`
            })
            setTime(60)  // Reinicia o cronômetro
            return data
        },
        onSuccess: (data) => {
            toast.success(data.message)
            setCode('')
        },
        onError(error: any) {
            console.log(error.response.data.message)
            toast.error(error.response.data.message)
        }
    })

    useEffect(() => {// useEffect para começar a contagem regressiva
        let timer: NodeJS.Timeout | null = null;
        if (time > 0) timer = setInterval(() => setTime(prev => prev - 1), 1000);

        // Limpar o timer quando o tempo chegar a 0 ou o componente for desmontado
        return () => { if (timer) clearInterval(timer); };
    }, [time]);

    useEffect(() => {
        if (code.length === 6) handleVerifyCode();
    }, [code]);

    return (
        <motion.div
            className="mt-14"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3 text-center '>
                <h1 className="uppercase text-2xl font-bold ">código de acesso </h1>
                <span className='text-[12px]'>Digite o código que enviamos para o seu número.</span>

                <div className=" flex justify-center my-3">
                    <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={(value) => setCode(value)}
                        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <span className='text-[11px] text-muted'>
                        Você poderá solicitar um novo código em {time} segundos
                    </span>
                    <Button
                        className={time == 0 ? 'animate-pulse' : ''}
                        loading={isPending}
                        disabled={time > 0}
                        onClick={() => handleGetCodeWP()}>
                        Reenviar código
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}
