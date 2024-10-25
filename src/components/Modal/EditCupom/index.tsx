import { AxiosError } from "axios"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect } from "react"
import { toast } from "sonner"

import CheckboxDefault from "@/components/CheckboxDefault"
import Select from "@/components/SelectDefault"
import SliderDefault from "@/components/SliderDefault"
import { Button } from "@/components/ui/button"
import CurrencyField from "@/components/ui/current"
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

import { CupomDTO } from "@/dto/cupomDTO"
import { api } from "@/service/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { FormProvider, useForm } from "react-hook-form"
import z from "zod"

import { HiSave } from "react-icons/hi"
import { HiTicket } from "react-icons/hi2"


type Props = {
    open: boolean
    onClose: () => void
    onUpdate: () => void
    cupom?: CupomDTO
}
const currencyStringToNumber = (val: string) => {
    if (!val) return 0;
    // Remove any non-numeric characters and replace comma with dot
    const numericValue = val.replace(/[^\d,]/g, "").replace(",", ".");
    const parsedValue = parseFloat(numericValue);
    return isNaN(parsedValue) ? 0 : parsedValue;
};

function numberToCurrencyString(value: number): string {
    // Converte o número para o formato '40,00'
    return value?.toFixed(2).replace('.', ',');
}

const baseSchema = z.object({
    nome: z.string().min(1, { message: "Informe o nome do cupom." }),
    descricao: z.string().min(1, { message: "Campo obrigatório." }),
    quantidade: z.preprocess((val) => Number(val), z.number().min(1, { message: "Informe a quantidade deste cupom." })),
    validade: z.string().optional(),
    status: z.boolean({ required_error: "Erro." }),
    valorMinimoGasto: z
        .string({ required_error: "Informe quanto o usuário precisa gastar para utilizar este cupom." })
        .min(1, "Informe quanto o usuário precisa gastar para utilizar este cupom."),
    listaPublica: z.boolean({ required_error: "Erro." }),
    unicoUso: z.boolean({ required_error: "Erro." }),
});

const schemaAddCupom = z.discriminatedUnion('tipo', [
    baseSchema.extend({
        tipo: z.literal("porcentagem"),
        valor: z
            .number({ required_error: "Campo obrigatório." })
            .min(0, { message: "Valor deve ser maior ou igual a 0." })
            .max(100, { message: "Valor deve ser menor ou igual a 100." }),
    }),
    baseSchema.extend({
        tipo: z.literal("valor_fixo"),
        valor: z.string({ required_error: "Campo obrigatório." }).min(1, "Campo obrigatório."),
    }),
]);


type AddCupomForm = z.infer<typeof schemaAddCupom>

export function ModalEditCupom({ open, onClose, onUpdate, cupom }: Props) {
    const methods = useForm<AddCupomForm>({
        resolver: zodResolver(schemaAddCupom),

    })
    const { register, handleSubmit, watch, reset, setValue, formState: { errors }, ...form } = methods
    const tipo = watch('tipo');
    const valor = watch('valor');

    const { mutateAsync: handleEditCupom, isPending } = useMutation({
        mutationKey: ['edit-cupom'],
        mutationFn: async ({ nome, descricao, valor, tipo, quantidade, validade, status, valorMinimoGasto, listaPublica, unicoUso }: AddCupomForm) => {

            // Transforme os valores conforme o tipo
            const parsedValorMinimoGasto = currencyStringToNumber(valorMinimoGasto);
            const parsedValor = tipo === 'valor_fixo' ? currencyStringToNumber(valor) : valor;

            const { data } = await api.put('/cupom', {
                id: cupom?.id,
                nome,
                descricao,
                valor: parsedValor,
                tipo,
                quantidade,
                validade, //opcional
                status,
                valorMinimoGasto: parsedValorMinimoGasto,
                listaPublica,
                unicoUso,
            })
            return data
        }, onSuccess(data) {
            toast.success('Cupom editado com sucesso!')
            onUpdate()
            onClose()
        }, onError(error: unknown) {
            console.log(error)
            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Erro inesperado, tente novamente mais tarde.')
            }
        }
    })

    useEffect(() => {
        if (tipo === 'valor_fixo') {
            if (typeof valor === 'number') {
                // Converte número para string de moeda
                const valorString = numberToCurrencyString(valor);
                setValue('valor', valorString);
            }
        } else if (tipo === 'porcentagem') {
            if (typeof valor === 'string' && valor !== '') {
                // Converte string de moeda para número
                const valorNumber = currencyStringToNumber('10');
                setValue('valor', valorNumber);
            }
        }
    }, [valor, tipo, setValue]);

    useEffect(() => {
        if (!cupom) return;
        if (cupom.tipo === 'porcentagem') {
            reset({
                nome: cupom.nome,
                descricao: cupom.descricao,
                valor: cupom.valor, // valor é number
                quantidade: cupom.quantidade,
                validade: cupom.validade,
                status: cupom.status,
                valorMinimoGasto: numberToCurrencyString(cupom.valorMinimoGasto),
                listaPublica: cupom.listaPublica,
                unicoUso: cupom.unicoUso,
                tipo: 'porcentagem',
            });
        } else if (cupom.tipo === 'valor_fixo') {
            reset({
                nome: cupom.nome,
                descricao: cupom.descricao,
                valor: numberToCurrencyString(cupom.valor), // valor é string
                quantidade: cupom.quantidade,
                validade: cupom.validade,
                status: cupom.status,
                valorMinimoGasto: numberToCurrencyString(cupom.valorMinimoGasto),
                listaPublica: cupom.listaPublica,
                unicoUso: cupom.unicoUso,
                tipo: 'valor_fixo',
            });
        }
    }, [cupom, reset]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className=" rounded-md">
                <DialogHeader>
                    <DialogTitle className="flex justify-center items-center gap-1 text-xl dark:text-white-off">
                        <HiTicket size={25} />
                        Editar Cupom
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted text-xs">
                        Certifique-se de fornecer todas as informações necessárias para que o cupom seja válido e utilizável pelos usuários.
                    </DialogDescription>
                </DialogHeader>

                <Separator className="bg-muted/20" />
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit((data) => handleEditCupom(data))} className="grid grid-cols-2 gap-2">
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
                            options={['porcentagem', 'valor_fixo'].map((tipo) => ({ id: tipo, nome: tipo }))}
                            placeholder="selecione"
                            questionContent="Este campo indica o tipo de desconto do cupom, porcentagem ou fixo."
                            error={errors.tipo?.message}
                        />

                        <CurrencyField
                            name="valorMinimoGasto"
                            label="Valor mínimo"
                            questionContent="Esse campo indica o valor mínimo que o usuário precisa gastar para utilizar este cupom."
                            error={errors.valorMinimoGasto?.message}
                        />

                        <AnimatePresence mode="popLayout">
                            {tipo === 'porcentagem' &&
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}>
                                    <SliderDefault
                                        name="valor"
                                        label="Porcentagem"
                                        questionContent="Porcentagem que o usuário irá receber de desconto."
                                        error={errors.valor?.message}
                                    />
                                </motion.div>
                            }
                        </AnimatePresence>
                        <AnimatePresence mode="popLayout">
                            {tipo === 'valor_fixo' &&
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}>
                                    <CurrencyField
                                        name="valor"
                                        label="Valor"
                                        questionContent="Valor que o usuário irá receber de desconto."
                                        error={errors.valor?.message}
                                    />
                                </motion.div>
                            }
                        </AnimatePresence>
                        <Input
                            type="number"
                            label="Quantidade"
                            questionContent="Quantidade de cupons disponíveis."
                            {...register('quantidade')}
                            error={errors.quantidade?.message}
                        />
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
                                    questionContent="Indica se este cupom é listado para todos os usuários."
                                />
                            </div>
                            <Input
                                type="date"
                                label="Validade"
                                questionContent="Data em que este cupom irá expirar."
                                {...register('validade')}
                                error={errors.validade?.message}
                            />
                        </div>
                        <div className="col-span-2">
                            <div className="flex items-center justify-between py-1">
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
                </FormProvider>
            </DialogContent>
        </Dialog>
    )
}
