import { Button } from "@/components/ui/button"
import CurrencyField from "@/components/ui/current"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { IngredientesDTO } from "@/dto/productDTO"
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



function numberToCurrencyString(value: number): string {
    // Converte o número para o formato '40,00'
    return value?.toFixed(2).replace('.', ',');
}
const schemaEditIngredient = z.object({
    title: z.string().min(3, 'O título deve conter no mínimo 3 caracteres.'),
    valor: z
        .string({ message: 'Por favor, forneça o valor deste produto.' })
        .min(1, 'Por favor, forneça o valor deste produto.')

})

type schemaEditIngredientForm = z.infer<typeof schemaEditIngredient>

type ModalProps = {
    open: boolean
    onClose: () => void
    handleUpdateIngredients: () => void
    ingredientEdit: IngredientesDTO
}
const ModalEditIngredient = ({ open, onClose, handleUpdateIngredients, ingredientEdit }: ModalProps) => {
    const methods = useForm<schemaEditIngredientForm>({
        resolver: zodResolver(schemaEditIngredient)
    })
    const { handleSubmit, register, reset, formState: { errors } } = methods;

    const { mutateAsync: handleEditIngredient, isPending } = useMutation({
        mutationKey: ['edit-ingrediente'],
        mutationFn: async ({ title, valor }: schemaEditIngredientForm) => {
            const { data } = await api.put('/ingredientes', {
                id: ingredientEdit.id,
                nome: title,
                valor: valor
            })
            return data
        }, onSuccess() {
            toast.success('Ingrediente editado com sucesso.')
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
        if (!ingredientEdit) return
        reset({
            title: ingredientEdit.nome,
            valor: numberToCurrencyString(ingredientEdit.valor)
        })
    }, [ingredientEdit, reset]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <FormProvider {...methods}>
                    <form className="space-y-3" onSubmit={handleSubmit((data) => handleEditIngredient(data))}>
                        <DialogHeader>
                            <DialogTitle className="dark:text-white-off flex items-center gap-2 text-2xl">
                                <GiCampCookingPot size={24} />
                                Editar Ingrediente
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

export default ModalEditIngredient;