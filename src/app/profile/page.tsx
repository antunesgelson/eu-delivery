'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { api } from "@/service/api";
import { useMutation, useQuery } from "@tanstack/react-query";

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
    nome: z.string().min(1, 'Informe seu nome.'),
    telefone: z.string().min(15, 'Informe seu telefone.'),
    email: z.string().email('Informe um email válido.'),
    aniversario: z.string().optional(),
    cpf: z.string().optional(),
})

export type ProfileForm = z.infer<typeof ProfileSchema>

export default function Profile() {
    const { cpfFormat, cellPhoneFormat } = useFormatters()
    const { handleSubmit, reset, register, setValue, watch, formState: { errors } } = useForm<ProfileForm>({
        resolver: zodResolver(ProfileSchema)
    })
    const cpf = watch('cpf');
    const tel = watch('telefone');

    const { mutateAsync: handleEditUser, isPending } = useMutation({
        mutationKey: ['editProfile'],
        mutationFn: async ({ email, nome, telefone, aniversario, cpf }: ProfileForm) => {
            const { data } = await api.put('/usuario', {
                nome: nome,
                cpf: cpf,
                // tel: telefone,
                dataDeNascimento: aniversario
            })
            return data
        }, onSuccess(data) {
            console.log("sucesso", data)
            toast.success('Perfil atualizado com sucesso.')
        }, onError(error) {
            console.log(error)
            toast.error('Não foi possível atualizar suas informações.')
        },
    })

    const { data } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/usuario')
                return data
            } catch (error: any) {
                console.error(error)
                toast.error('Não foi possível carregar suas informações.')
                throw new Error('Não foi possível carregar suas informações.')
            }
        }
    })

    useEffect(() => {
        if (!data) return
        data.map((item: UserDTO) => {
            reset({
                nome: item.nome,
                telefone: item.tel,
                email: item.email,
                aniversario: item.dataDeNascimento,
                cpf: item.cpf,
            })
        })
    }, [data, reset]);

    useEffect(() => {
        if (!cpf) return;
        setValue('cpf', cpfFormat(cpf));
    }, [cpf, setValue, cpfFormat]);

    useEffect(() => {
        if (!tel) return;
        setValue('telefone', cellPhoneFormat(tel));
        console.log(tel?.length)
    }, [tel, setValue, cellPhoneFormat]);

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
                        <Label className="uppercase">nome</Label>
                        <Input
                            {...register('nome')}
                            error={errors.nome?.message}
                        />
                    </div>
                    <div>
                        <Label className="uppercase">telefone</Label>
                        <Input
                            disabled
                            type="tel"
                            placeholder="(00) 00000-0000"
                            {...register('telefone')}
                            error={errors.telefone?.message}
                        />
                        <p className="text-[11px] leading-3 text-muted-foreground my-1">Seu número de telefone será usado apenas para contato relacionado ao serviço.</p>
                    </div>
                    <div>
                        <Label className="uppercase">email</Label>
                        <Input
                            type="email"
                            {...register('email')}
                            error={errors.email?.message}
                        />
                        <p className="text-[11px] leading-3 text-muted-foreground my-1">Fique tranquilo. Não enviamos spam e nunca compartilharemos seu email com ninguém.</p>
                    </div>
                    <div>
                        <Label className="uppercase" >aniversário <span className="text-muted">(opicional)</span></Label>
                        <Input
                            type="date"
                            placeholder="DD/MM/AAAA"
                            {...register('aniversario')}
                            error={errors.aniversario?.message}
                        />
                        <p className="text-[11px] leading-3 text-muted-foreground my-1">Quem sabe você recebe um presentinho da gente! =]</p>
                    </div>
                    <div>
                        <Label className="uppercase" >cpf/cnpj <span className="text-muted">(opicional)</span></Label>
                        <Input
                            placeholder="000.000.000-00"
                            {...register('cpf')}
                            error={errors.cpf?.message}
                        />
                        <p className="text-[11px] leading-3 text-muted-foreground my-1">Utilizamos para emitir cupom fiscal.</p>
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