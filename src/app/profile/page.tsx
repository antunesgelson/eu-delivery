'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { api, mostrarErro } from "@/service/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { MdSaveAlt } from "react-icons/md";
import { toast } from "sonner";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

import { UserDTO } from "@/dto/userDTO";
import useFormatters from "@/hook/useFormatters";

const ProfileSchema = z.object({
    nome: z.string().trim().min(1, 'Informe seu nome.').max(150),
    telefone: z.string(),
    email: z.string().trim().email('Informe um email válido.').or(z.literal('')),
    aniversario: z.string().optional(),
    cpf: z.string().refine(v => !v || v.replace(/\D/g, '').length === 11, 'Informe os 11 dígitos do CPF.').optional(),
})

export type ProfileForm = z.infer<typeof ProfileSchema>

export default function Profile() {
    const { cpfFormat, cellPhoneFormat, homePhoneFormat } = useFormatters();
    const client = useQueryClient();
    const { handleSubmit, reset, register, setValue, watch, formState: { errors } } = useForm<ProfileForm>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: { nome: '', telefone: '', email: '', aniversario: '', cpf: '' },
    });
    const cpf = watch('cpf');
    const profile = useQuery<UserDTO>({
        queryKey: ['profile'],
        queryFn: async () => (await api.get('/usuario')).data,
    });
    const { mutate: handleEditUser, isPending } = useMutation({
        mutationFn: async ({ email, nome, aniversario, cpf }: ProfileForm) =>
            (await api.put<UserDTO>('/usuario', {
                nome: nome.trim(),
                cpf: cpf?.replace(/\D/g, '') ?? '',
                email: email.trim() || null,
                dataDeNascimento: aniversario || null,
            })).data,
        onSuccess: async (data) => {
            client.setQueryData(['profile'], data);
            await client.invalidateQueries({ queryKey: ['sessao'] });
            toast.success('Perfil atualizado com sucesso.');
        },
        onError: mostrarErro,
    });
    useEffect(() => {
        if (!profile.data) return;
        const user = profile.data;
        const phone = (user.tel ?? '').replace(/^55(?=\d{10,11}$)/, '');
        reset({
            nome: user.nome ?? '',
            telefone: phone.length === 10 ? homePhoneFormat(phone) : cellPhoneFormat(phone),
            email: user.email ?? '',
            aniversario: user.dataDeNascimento?.slice(0, 10) ?? '',
            cpf: cpfFormat(user.cpf ?? ''),
        });
    }, [profile.data, reset, cellPhoneFormat, homePhoneFormat, cpfFormat]);
    useEffect(() => {
        if (cpf) setValue('cpf', cpfFormat(cpf));
    }, [cpf, setValue, cpfFormat]);
    if (profile.isPending) return <main className="mt-16 p-4" role="status">Carregando perfil…</main>;
    if (profile.isError) return <main className="mt-16 p-4" role="alert">Não foi possível carregar seu perfil. <Button onClick={() => profile.refetch()}>Tentar novamente</Button></main>;

    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>
            <div className='p-4 leading-3'>
                <h2 className="uppercase text-2xl font-bold ">minhas informações</h2>
                <span className='text-[12px]'>Aqui você pode atualizar e corrigir suas informações sempre que precisar.</span>
            </div>

            <section className="bg-white p-4">
                <form onSubmit={handleSubmit((data) => handleEditUser(data))} className="space-y-3">
                    <div>
                        <Label htmlFor="nome" className="uppercase">nome</Label>
                        <Input
                            id="nome" {...register('nome')}
                            error={errors.nome?.message}
                        />
                    </div>
                    <div>
                        <Label htmlFor="telefone" className="uppercase">telefone</Label>
                        <Input
                            type="tel" readOnly
                            placeholder="(00) 00000-0000"
                            id="telefone" {...register('telefone')}
                            error={errors.telefone?.message}
                        />
                        <p className="text-[11px] leading-3 text-muted-foreground my-1">Este é o número verificado no login.</p>
                    </div>
                    <div>
                        <Label htmlFor="email" className="uppercase">email</Label>
                        <Input
                            type="email"
                            id="email" {...register('email')}
                            error={errors.email?.message}
                        />
                        <p className="text-[11px] leading-3 text-muted-foreground my-1">Fique tranquilo. Não enviamos spam e nunca compartilharemos seu email com ninguém.</p>
                    </div>
                    <div>
                        <Label htmlFor="aniversario" className="uppercase" >aniversário <span className="text-muted">(opcional)</span></Label>
                        <Input
                            type="date"
                            placeholder="DD/MM/AAAA"
                            id="aniversario" {...register('aniversario')}
                            error={errors.aniversario?.message}
                        />
                        <p className="text-[11px] leading-3 text-muted-foreground my-1">Quem sabe você recebe um presentinho da gente! =]</p>
                    </div>
                    <div>
                        <Label htmlFor="cpf" className="uppercase" >cpf <span className="text-muted">(opcional)</span></Label>
                        <Input
                            placeholder="000.000.000-00"
                            id="cpf" {...register('cpf')}
                            error={errors.cpf?.message}
                        />
                        <p className="text-[11px] leading-3 text-muted-foreground my-1">Informe apenas se desejar associar o CPF ao cadastro.</p>
                    </div>
                    <Button
                        type="submit"
                        loading={isPending}
                        className="w-full flex items-center gap-1"
                        variant={'success'}>
                        Salvar Alterações
                        <MdSaveAlt size={20} />
                    </Button>
                </form>
            </section>
        </motion.main>
    )
}
