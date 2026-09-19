'use client'
import {useSearchParams} from 'next/navigation';
import {Suspense} from 'react';
import Image from "next/image";
import Link from "next/link";
import useAuth from "@/hook/useAuth";
import { mostrarErro } from "@/service/api";
import React, { useEffect } from "react";

import AssadosZaniniLogo from "@/assets/logo/assados-zanini-logo.jpg";
import AssadosZaniniSymbol from "@/assets/logo/assados-zanini-symbol.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { AnimatePresence, motion } from "framer-motion";

import { api } from "@/service/api";
import { BsWhatsapp } from "react-icons/bs";
import { FaChartLine, FaClipboardList, FaLock, FaRegCalendarCheck, FaStore } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { LuUnplug } from "react-icons/lu";
import { toast } from "sonner";

import useFormatters from "@/hook/useFormatters";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { destinoSeguro, destinoAdmin } from "@/lib/navigation";

const schemaSignIn = z.object({
    cellPhone: z.string().transform(value => value.replace(/\D/g, '')).pipe(z.string().regex(/^\d{10,11}$/, 'Informe o telefone com DDD.'))
})
type SignInForm = z.infer<typeof schemaSignIn>

const adminSchema = z.object({
    email: z.string().trim().email("Informe um e-mail válido.").max(255),
    senha: z.string().min(8, "Informe uma senha com pelo menos 8 caracteres.").max(128),
});
type AdminForm = z.infer<typeof adminSchema>;
type AdminLoginProps = {
    callbackUrl: string;
    onAdminSignIn: (values: AdminForm) => void;
    isPending: boolean;
}

const adminSummaryCards = [
    { label: 'Pedidos hoje', value: '24', Icon: FaClipboardList },
    { label: 'Agendados', value: '16', Icon: FaRegCalendarCheck },
    { label: 'Faturamento', value: 'R$ 2,8k', Icon: FaChartLine },
];

const adminMenuPreview = [
    'Meus pedidos',
    'Pedidos agendados',
    'Gestor de cardápio',
    'Relatórios',
];

function AdminLogin({ onAdminSignIn, isPending, callbackUrl }: AdminLoginProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<AdminForm>({ resolver: zodResolver(adminSchema), defaultValues: { email: "", senha: "" } });
    return (
        <motion.section
            className="grid min-h-screen bg-[#f3f5f8] text-dark-900 lg:grid-cols-[minmax(0,1fr)_440px]"
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.35 }}
        >
            <section className="hidden min-h-screen overflow-hidden bg-[#143d60] px-8 py-8 text-white lg:flex lg:flex-col xl:px-12">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Image
                            src={AssadosZaniniSymbol}
                            alt="Assados Zanini"
                            width={46}
                            height={46}
                            className="h-[46px] w-[46px] rounded-full border border-white/25 bg-[#f4d7a8] object-contain"
                            priority
                        />
                        <div>
                            <strong className="block text-[15px] leading-5">Assados Zanini</strong>
                            <span className="text-[11px] font-semibold text-white/55">Painel operacional</span>
                        </div>
                    </div>

                    <span className="inline-flex h-8 items-center rounded-md bg-white/10 px-3 text-[11px] font-extrabold uppercase text-white/80">
                        Admin
                    </span>
                </div>

                <div className="mt-12 max-w-[660px]">
                    <span className="inline-flex rounded-md bg-[#f97316] px-3 py-1 text-[11px] font-extrabold uppercase text-white">
                        Dashboard da loja
                    </span>
                    <h1 className="mt-4 max-w-[560px] text-[42px] font-extrabold leading-[1.05] text-white">
                        Acesso centralizado para a operação da Assados Zanini.
                    </h1>
                    <p className="mt-4 max-w-[520px] text-[14px] leading-6 text-white/68">
                        Pedidos, agenda, cardápio, cupons e relatórios ficam no mesmo ambiente de gestão.
                    </p>
                </div>

                <div className="mt-8 grid max-w-[720px] grid-cols-3 gap-3">
                    {adminSummaryCards.map(({ label, value, Icon }) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.07] p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#f97316] text-white">
                                <Icon size={15} />
                            </div>
                            <strong className="mt-4 block text-[24px] leading-none">{value}</strong>
                            <span className="mt-2 block text-[11px] font-bold uppercase text-white/52">{label}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-auto grid max-w-[780px] grid-cols-[208px_minmax(0,1fr)] overflow-hidden rounded-lg border border-white/10 bg-white shadow-2xl shadow-black/20">
                    <aside className="bg-[#143d60] p-3">
                        <div className="flex h-10 items-center gap-2 rounded-md bg-white/10 px-2">
                            <Image
                                src={AssadosZaniniSymbol}
                                alt="Assados Zanini"
                                width={28}
                                height={28}
                                className="h-7 w-7 rounded-full bg-[#f4d7a8] object-contain"
                            />
                            <div className="min-w-0">
                                <strong className="block truncate text-[11px] leading-4 text-white">Assados Zanini</strong>
                                <span className="text-[9px] font-bold uppercase text-white/48">Loja principal</span>
                            </div>
                        </div>

                        <div className="mt-4 space-y-1">
                            {adminMenuPreview.map((item, index) => (
                                <div
                                    key={item}
                                    className={`flex h-8 items-center rounded-md px-2 text-[11px] font-bold ${index === 0 ? 'bg-[#f97316] text-white' : 'text-white/58'}`}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </aside>

                    <div className="min-w-0 bg-[#f3f5f8] p-4">
                        <div className="flex items-center justify-between gap-3 border-b border-[#e6eaf0] bg-white px-4 py-3">
                            <div>
                                <span className="text-[9px] font-extrabold uppercase text-[#f97316]">Gestão de pedidos</span>
                                <strong className="block text-[15px] leading-5 text-dark-900">Meus pedidos</strong>
                            </div>
                            <div className="flex h-8 items-center gap-2 rounded-full border bg-white px-3 text-[11px] font-bold text-dark-700">
                                <FaStore size={12} />
                                Aberto
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-md border bg-white p-3">
                                <span className="text-[10px] font-bold uppercase text-dark-400">Em preparo</span>
                                <strong className="mt-2 block text-[24px] leading-none text-dark-900">08</strong>
                            </div>
                            <div className="rounded-md border bg-white p-3">
                                <span className="text-[10px] font-bold uppercase text-dark-400">Entrega hoje</span>
                                <strong className="mt-2 block text-[24px] leading-none text-dark-900">19</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
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
                            <h2 className="mt-2 text-[24px] font-extrabold leading-7 text-dark-900">Entrar no admin</h2>
                        </div>
                    </div>

                    <p className="mt-4 text-[13px] leading-5 text-dark-500">
                        Use seu e-mail e senha para abrir o dashboard administrativo da loja.
                    </p>

                    <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit(onAdminSignIn)}>
                        <Input
                            label="E-mail"
                            aria-label="E-mail"
                            {...register("email")}
                            error={errors.email?.message}
                            disabled={isPending}
                            type="email"
                            autoComplete="email"
                            className="h-11 rounded-md bg-[#f8fafc] text-[15px]"
                            placeholder="admin@assadoszanini.com.br"
                        />

                        <Input
                            label="Senha"
                            aria-label="Senha"
                            {...register("senha")}
                            error={errors.senha?.message}
                            disabled={isPending}
                            type="password"
                            autoComplete="current-password"
                            className="h-11 rounded-md bg-[#f8fafc] text-[15px]"
                            placeholder="Digite sua senha"
                        />

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="flex h-11 w-full items-center gap-2 bg-[#f97316] text-[13px] font-extrabold uppercase text-white hover:bg-[#ea6409]"
                        >
                            <FaLock size={14} />
                            {isPending ? "Entrando…" : "Entrar"}
                        </Button>
                    </form><Link href={`/signin/redefinir?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="mt-3 block text-center text-sm text-orange-600">Esqueci minha senha</Link>

                    <div className="mt-5 border-l-2 border-[#f97316] pl-3">
                        <div className="flex items-center gap-2 text-[12px] font-extrabold text-dark-800">
                            <FaLock className="text-[#f97316]" size={12} />
                            Acesso administrativo
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-dark-500">
                            O acesso ao painel exige uma conta com permissão administrativa.
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
            </section>
        </motion.section>
    );
}


type Props = {
    searchParams?: { error?: string; callbackUrl?: string }
}
function SigninContent() {
 const search=useSearchParams();const searchParams=React.useMemo(()=>Object.fromEntries(search.entries()),[search]);
    const { watch, setValue, register, handleSubmit, formState: { errors } } = useForm<SignInForm>({
        resolver: zodResolver(schemaSignIn),
        defaultValues: { cellPhone: "" }
    })
    const router = useRouter()
    const { cellPhoneFormat } = useFormatters()
    const cellPhone = watch('cellPhone');
    const callbackUrl = destinoSeguro(searchParams?.callbackUrl ?? "/?firstLogin=true");
    const isAdminAccess = destinoAdmin(callbackUrl);
    const adminDestination = callbackUrl === '/admin' ? '/admin/dashboard' : callbackUrl;
    const handleGoogleSignIn = React.useCallback(() => {
        if (!searchParams?.callbackUrl) {
            window.location.href='/api/auth/google';
            return;
        }

        window.location.href=`/api/auth/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    }, [callbackUrl, searchParams?.callbackUrl]);
    const { atualizar } = useAuth();
    const adminLogin = useMutation({mutationFn: async (data: {email:string;senha:string}) => (await api.post('/auth/login',data)).data});
    const adminLock = React.useRef(false);
    const handleAdminSignIn = React.useCallback(async (values: AdminForm) => {
        if (adminLock.current) return;
        adminLock.current = true;
        try {
            const data = await adminLogin.mutateAsync(values);
            await atualizar();
            if (!data.user.isAdmin) { toast.error('Sua conta não tem acesso administrativo.'); return; }
            router.replace(adminDestination);
        } catch (error) { mostrarErro(error); }
        finally { adminLock.current = false; }
    }, [adminDestination, router, atualizar, adminLogin]);

    const phoneLock = React.useRef(false);
    const { mutate: handleGetCodeWP, isPending } = useMutation({
        mutationKey: ['auth-wp'],
        mutationFn: async ({ cellPhone: tel }: SignInForm) => {
            const { data } = await api.post('/auth/wp', {
                tel: `55${tel}`
            })
            return data
        },
        onSuccess: (data, values) => {
            toast.success(data.message); if(data.developmentCode) toast.info(`Código de desenvolvimento: ${data.developmentCode}`,{duration:20000})
            const getCodeParams = new URLSearchParams({
                tel: values.cellPhone, desafioId: data.desafioId, reenviarEm: String(Date.now() + 60000)
            });

            if (callbackUrl) getCodeParams.set('callbackUrl', callbackUrl);

            router.push(`/signin/getcode?${getCodeParams.toString()}`);
        },
        onError: mostrarErro,
        onSettled: () => { phoneLock.current = false; },
    })


    React.useEffect(() => {
        setValue('cellPhone', cellPhoneFormat(cellPhone));
    }, [cellPhone, setValue, cellPhoneFormat]);

    useEffect(() => {
        if (searchParams?.error === 'google-unavailable') toast.error('O login com Google ainda não está disponível. Entre pelo telefone.');
        if (searchParams?.error === 'google') toast.error('Não foi possível entrar com Google. Tente novamente ou entre pelo telefone.');
        if (searchParams?.error === 'permissions') {
            setTimeout(() => {
                toast.warning("Conexão Necessária!", {
                    description: "Para uma melhor experiência, conecte-se ao Google Calendário receber notificações de entrega.",
                    descriptionClassName: 'text-muted-foreground text-[11px]',
                    actionButtonStyle: { backgroundColor: '#141414', color: '#fff' },
                    duration: 9000, // Duração da notificação em milissegundos
                    action: {
                        label: <div className="flex items-center gap-1"><LuUnplug /> Conectar</div>,
                        onClick: handleGoogleSignIn,
                    },
                })
            }, 50);
        }
    }, [searchParams, handleGoogleSignIn]);

    if (isAdminAccess) {
        return (
            <AdminLogin
                callbackUrl={adminDestination}
                onAdminSignIn={handleAdminSignIn}
                isPending={adminLogin.isPending}
            />
        );
    }

    return (
        <motion.div
            className="mt-14"
            initial={{ opacity: 0, y: -100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3 text-center '>
                <h1 className="uppercase text-2xl font-bold ">faça login </h1>
                <span className='text-[12px]'>Cadastre-se e aproveite a melhor experiência.</span> <br />
                <span className='text-[10px] text-muted-foreground '>Entre para salvar seu carrinho e acompanhar seus pedidos.</span>
                <Button
                    className="font-semibold text-lg w-full mt-4 mb-1 flex items-center gap-2 bg-white"
                    variant={'outline'}
                    size={'lg'}
                    onClick={handleGoogleSignIn}>
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

            <form noValidate onSubmit={handleSubmit(values => {
                if (phoneLock.current) return;
                phoneLock.current = true;
                handleGetCodeWP(values);
            })}>
            <div className="px-4 py-6">
                <Input
                    className="bg-white h-10 rounded-md "
                    disabled={isPending}
                    maxLength={15}
                    aria-label="Telefone com DDD"
                    autoComplete="tel-national"
                    inputMode="tel"
                    placeholder="Digite seu telefone."
                    {...register('cellPhone')}
                    error={errors.cellPhone?.message}
                />
            </div>


            <AnimatePresence>
                {
                    <motion.div
                        className="px-4"
                        initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4 }}>
                        <h3 className="text-[10px] text-muted-foreground text-center">
                            Escolha a melhor forma para você receber o código de autenticação.
                        </h3>
                        <div className="flex gap-2 items-center justify-center  py-2">
                            <Button
                                variant={'success'}
                                loading={isPending}
                                className="w-full flex gap-1 items-center uppercase"
                                type="submit">
                                <BsWhatsapp size={15} />
                                whatsapp
                            </Button>
                        </div>
                    </motion.div>
                }
            </AnimatePresence>
            </form>
        </motion.div>
    )
}

export default function Signin(){return <Suspense fallback={<p>Carregando…</p>}><SigninContent/></Suspense>;}
