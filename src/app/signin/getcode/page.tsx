'use client'
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import AssadosZaniniLogo from "@/assets/logo/assados-zanini-logo.jpg";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot, } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

import { api } from "@/service/api";
import { useMutation } from "@tanstack/react-query";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { decodeJwtPayload, DecodedToken } from "@/utils/jwt";
import { setClientCookie } from "@/utils/cookies";
import { BsWhatsapp } from "react-icons/bs";
import { FaLock, FaStore } from "react-icons/fa6";

function getSafeCallbackUrl(callbackUrl?: string) {
    if (!callbackUrl || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
        return null;
    }

    return callbackUrl;
}

function isAdminCallback(callbackUrl: string | null) {
    return callbackUrl === '/admin' || Boolean(callbackUrl?.startsWith('/admin/'));
}

type AdminGetCodeProps = {
    code: string;
    isPending: boolean;
    onCodeChange: (value: string) => void;
    onResendCode: () => void;
    time: number;
}

function AdminGetCode({ code, isPending, onCodeChange, onResendCode, time }: AdminGetCodeProps) {
    return (
        <motion.section
            className="flex min-h-screen items-center justify-center bg-[#f3f5f8] px-4 py-8 text-dark-900"
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.35 }}
        >
            <div className="w-full max-w-[430px] rounded-lg border border-[#e6eaf0] bg-white p-5 shadow-xl shadow-[#143d60]/10 sm:p-7">
                <div className="flex items-center gap-3">
                    <Image
                        src={AssadosZaniniLogo}
                        alt="Assados Zanini"
                        width={58}
                        height={58}
                        className="h-[58px] w-[58px] rounded-full bg-[#f4d7a8] object-cover"
                        priority
                    />
                    <div className="min-w-0">
                        <span className="inline-flex rounded-md bg-[#fff3ea] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#f97316]">
                            Acesso restrito
                        </span>
                        <h1 className="mt-2 text-[24px] font-extrabold leading-7 text-dark-900">Código admin</h1>
                    </div>
                </div>

                <p className="mt-4 text-[13px] leading-5 text-dark-500">
                    Digite o código enviado para validar a conta antes de abrir o dashboard.
                </p>

                <div className="my-6 flex justify-center">
                    <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={onCodeChange}
                        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                    >
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
                        className={`flex h-10 w-full items-center gap-2 text-[12px] font-extrabold uppercase ${time == 0 ? 'animate-pulse' : ''}`}
                        loading={isPending}
                        disabled={time > 0}
                        variant={'success'}
                        onClick={onResendCode}
                    >
                        <BsWhatsapp size={15} />
                        Reenviar no WhatsApp
                    </Button>
                </div>

                <div className="mt-5 border-l-2 border-[#f97316] pl-3">
                    <div className="flex items-center gap-2 text-[12px] font-extrabold text-dark-800">
                        <FaLock className="text-[#f97316]" size={12} />
                        Permissão de administrador
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-dark-500">
                        Após a validação, o acesso ao painel depende da permissão admin no token.
                    </p>
                </div>

                <Link
                    href="/"
                    className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-white text-[13px] font-extrabold text-dark-700 hover:bg-[#f7f7f7]"
                >
                    <FaStore size={13} />
                    Voltar para a loja
                </Link>
            </div>
        </motion.section>
    );
}

type Props = {
    searchParams?: { tel?: string; callbackUrl?: string }
}
export default function GetCode({ searchParams }: Props) {
    const [code, setCode] = useState('');
    const [time, setTime] = useState(60);  // Começa com 60 segundos
    const callbackUrl = getSafeCallbackUrl(searchParams?.callbackUrl);
    const isAdminAccess = isAdminCallback(callbackUrl);

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
            const userToken = decodeJwtPayload<DecodedToken>(data.token);
            if (!userToken) {
                toast.error('Não foi possível validar o token de acesso.');
                return;
            }
            const maxAgeToken = userToken?.exp - userToken?.iat

            const cookiesToPersist = [{ name: '@eu:token', maxAge: maxAgeToken, token: data.token }]
            cookiesToPersist.forEach(({ name, maxAge, token }) => {
                setClientCookie(name, token, {
                    maxAge: maxAge,
                    path: "/",

                })
            })
            toast.success('Código verificado com sucesso!');
            if (isAdminCallback(callbackUrl) && !userToken.isAdmin) {
                toast.error('Este usuário não tem permissão para acessar o painel.');
                window.location.href = '/';
                return;
            }

            window.location.href = callbackUrl ?? '/?firstLogin=true';
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
    }, [code, handleVerifyCode]);

    if (isAdminAccess) {
        return (
            <AdminGetCode
                code={code}
                isPending={isPending}
                onCodeChange={setCode}
                onResendCode={() => handleGetCodeWP()}
                time={time}
            />
        );
    }

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
