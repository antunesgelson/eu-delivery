import { Button } from "@/components/ui/button"
import CurrencyField from "@/components/ui/current"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { api } from "@/service/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import React from "react"
import { FormProvider, useForm } from "react-hook-form"
import { GiCampCookingPot } from "react-icons/gi"
import { MdSaveAlt } from "react-icons/md"
import { toast } from "sonner"
import { z } from "zod"


const currencyStringToNumber = (val: string) => {
    if (!val) return 0;
    // Remove o prefixo 'R$ ', espaços, pontos e outros caracteres não numéricos
    const numericValue = val.replace(/[^\d,]/g, '').replace(',', '.');
    const parsedValue = parseFloat(numericValue);
    return isNaN(parsedValue) ? 0 : parsedValue;
};
const schemaAddCategory = z.object({
    title: z.string().min(3, 'O título deve conter no mínimo 3 caracteres.'),
    valor: z
        .string({ message: 'Por favor, forneça o valor deste produto.' })
        .min(1, 'Por favor, forneça o valor deste produto.')
        .transform(currencyStringToNumber)
        .refine((val) => !isNaN(val), {
            message: 'Por favor, forneça um valor numérico válido.',
        }),
})

type schemaAddCategoryForm = z.infer<typeof schemaAddCategory>

type ModalProps = {
    open: boolean
    onClose: () => void
    handleUpdateIngredients: () => void
}
const ModalAddIngredient = ({ open, onClose, handleUpdateIngredients }: ModalProps) => {
    const methods = useForm<schemaAddCategoryForm>({
        resolver: zodResolver(schemaAddCategory)
    })
    const { handleSubmit, register, formState: { errors } } = methods;

    const { mutateAsync: handleAddIngredient, isPending } = useMutation({
        mutationKey: ['add-ingrediente'],
        mutationFn: async ({ title, valor }: schemaAddCategoryForm) => {
            const { data } = await api.post('/ingredientes/cadastrar', {
                nome: title,
                valor: valor
            })
            return data
        }, onSuccess() {
            toast.success('Ingrediente adicionado com sucesso.')
            handleUpdateIngredients()
            setTimeout(() => {
                onClose()
            }, 200);
        }, onError(error: unknown) {
            console.log(error)

            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Erro inesperado, tente novamente mais tarde.')
            }
        }
    })

    React.useEffect(() => {

    }, []);
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <FormProvider {...methods}>
                    <form className="space-y-3" onSubmit={handleSubmit((data) => handleAddIngredient(data))}>
                        <DialogHeader>
                            <DialogTitle className="dark:text-white-off flex items-center gap-2 text-2xl">
                                <GiCampCookingPot size={24} />
                                Adicionar Ingrediente
                            </DialogTitle>
                            <DialogDescription >
                                Insira o título e valor do novo ingrediente e clique em salvar.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-2">
                            <Input
                                label="Nome"
                                placeholder="Nome do ingrediente."
                                questionContent="Insira o nome do ingrediente"
                                {...register('title')}
                                error={errors.title?.message}
                            />
                            <CurrencyField
                                name="valor"
                                label='Valor'
                                questionContent="Insira o valor do ingrediente"
                                error={errors.valor?.message}
                            />

                        </div>
                        <DialogFooter>
                            <Button
                                loading={isPending}
                                className="flex items-center gap-1"
                                variant={'outline'}
                                type="submit">
                                <MdSaveAlt />
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog >
    )
}

export default ModalAddIngredient;