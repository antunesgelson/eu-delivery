import React from "react"
import { toast } from "sonner"

import CheckboxDefault from "@/components/CheckboxDefault"
import Select from "@/components/SelectDefault"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

import { AddressDTO } from "@/dto/addressDTO"
import { api } from "@/service/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import z from "zod"

import { HiSave } from "react-icons/hi"
import { HiTicket } from "react-icons/hi2"
type Props = {
    open: boolean
    onClose: () => void
    refetch?: () => void
    address?: AddressDTO;
}

const schemaAddCupom = z.object({
    nome: z.string().min(1, { message: 'Informe o nome do cupom' }),
    descricao: z.string().min(1, { message: 'Campo obrigatório.' }),
    valor: z.number().min(1, { message: 'Campo obrigatório.' }),
    tipo: z.string().min(1, { message: 'Informe se o cupom é fixo ou porcentagem.' }),
    quantidade: z.number().min(1, { message: 'Informe a quantidade deste cupom' }),
    validade: z.string().optional(), //opcional, mas não pode ser menor e nem igual a data de hoje.
    status: z.boolean(({ required_error: "'Informe se o cupom está ativo ou não'" })),
    valorMinimoGasto: z.number().min(1, { message: 'Informe quanto o usuario precisa gastar para utilizar este cupom' }),
    listaPublica: z.boolean(),
    unicoUso: z.boolean(),
})

type AddCupomForm = z.infer<typeof schemaAddCupom>

export function ModalAddCupom({ open, onClose, refetch, address }: Props) {
    const { register, handleSubmit, formState: { errors }, ...form } = useForm<AddCupomForm>({
        resolver: zodResolver(schemaAddCupom)
    })
    const [openModal, setOpenModal] = React.useState(false)
    const { mutateAsync: handleRemoveAddress, isPending } = useMutation({
        mutationKey: ['remove-address'],
        mutationFn: async () => {
            const { data } = await api.delete(`/endereco/${address?.id}`)
            return data
        }, onSuccess(data) {
            toast.success('Endereço excluído com sucesso')
            onClose()
        }, onError(error) {
            onClose()
            console.log(error)
            toast.error('Erro ao excluir endereço')
            throw new Error('Erro ao excluir endereço')
        },
    })
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-md">
                <DialogHeader>
                    <DialogTitle className="flex justify-center items-center gap-1 text-xl dark:text-white-off">
                        <HiTicket size={25} />
                        Adicionar Cupom
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted text-xs">
                        Certifique-se de fornecer todas as informações necessárias para que o cupom seja válido e utilizável pelos usuários.
                    </DialogDescription>
                </DialogHeader>

                <Separator className="bg-muted/20" />

                <form
                    onSubmit={handleSubmit((data) => handleRemoveAddress(data))}
                    className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                        <Input
                            label="Nome"
                            questionContent="Nome do cupom"
                            {...register('nome')}
                            error={errors.nome?.message}
                        />
                    </div>

                    <Select
                        form={form}
                        name="tipo"
                        label="Tipo"
                        options={['porcentagem', 'fixo'].map((tipo) => ({ id: tipo, nome: tipo }))}
                        placeholder="selecione"
                        questionContent="Este campo indica o tipo de desconto do cupom, porcentagem ou fixo."
                        error={errors.tipo?.message}
                    />

                    <Input
                        label="Valor"
                        questionContent="Valor que o usuário irá receber de desconto de acordo com tipo de cupom escolhido."
                        {...register('valor')}
                        error={errors.valor?.message}
                    />

                    <div className="col-span-2 flex justify-between items-center gap-2">
                        <Input
                            label="Valor mínimo"
                            questionContent="Valor necessário para utilizar este cupom."
                            {...register('valorMinimoGasto')}
                            error={errors.valorMinimoGasto?.message}
                        />

                        <Input
                            type="date"
                            label="Validade"
                            questionContent="Data em que este cupom irá expirar."
                            {...register('validade')}
                            error={errors.validade?.message}
                        />

                    </div>

                    <div className="flex justify-between gap-4 items-start col-span-2 mb-2">
                        <div className="flex w-full justify-between">
                            <CheckboxDefault
                                form={form}
                                name="status"
                                label="Status"
                                error={errors.status?.message}
                                questionContent="Indica se o cupom está ativo para o uso ou não."
                            />
                            <CheckboxDefault
                                form={form}
                                name="unicoUso"
                                label="Único"
                                error={errors.unicoUso?.message}
                                questionContent="Indica se este cupom pode ser utilizado apenas 1 vez por usuário."
                            />
                            <CheckboxDefault
                                form={form}
                                name="listaPublica"
                                label="Público"
                                error={errors.listaPublica?.message}
                                questionContent="Indica se este cupom é listado para todos os usuários ou apenas para administradores."
                            />
                        </div>
                        <Input
                            label="Quantidade"
                            questionContent="Quantidade de cupons disponíveis."
                            {...register('quantidade')}
                            error={errors.quantidade?.message}
                        />
                    </div>

                    <div className="col-span-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted">
                                Descrição
                            </Label>
                            <span className="text-xs text-muted">0/1000</span>
                        </div>
                        <Textarea
                            rows={5}
                            className="w-full"
                            {...register('descricao')}
                            error={errors.descricao?.message}
                        />
                    </div>

                    <DialogFooter className="w-full col-span-2">
                        <div className="flex items-center">
                            <Button
                                type="submit"
                                className="ml-2"
                                variant={'outline'}
                                loading={isPending}>
                                <HiSave size={20} />
                                Salvar
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
