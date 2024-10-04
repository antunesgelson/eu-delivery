import React from "react"
import { PiTrash } from "react-icons/pi"
import { TbReplace } from "react-icons/tb"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import { IngredientesDTO, ProdutosDTO } from "@/dto/productDTO"
import { useQueryClient } from "@tanstack/react-query"

type Props = {
    open: boolean
    onClose: () => void
    removeProduct: IngredientesDTO
    productDetails: ProdutosDTO
    itemValueFinish: number
}
export function ModalSubstituir({ open, onClose, removeProduct, productDetails, itemValueFinish }: Props) {
    const [checked, setChecked] = React.useState<number | null>(-1);
    const [replace, setReplace] = React.useState<IngredientesDTO | null>(null);
    const queryClient = useQueryClient();

    function handleChecked(item: IngredientesDTO | null) {
        setReplace(item);
        setChecked(item ? parseInt(item.id) : -1);
    }

    function handleReplace() {
        // Recuperar o cache atual
        const cachedData = queryClient.getQueryData<ProdutosDTO>(['product-details', String(productDetails.id)]);
        if (cachedData) {
            console.log('replace:', replace);
            console.log('Cache atual antes da atualização:', cachedData);



            // Atualizar o cache com o novo ingrediente substituído e adicionar o campo replace
            const updatedIngredientes = cachedData.ingredientes.map(ingrediente =>
                ingrediente.id === removeProduct.id
                    ? { ...ingrediente, replace: replace ? replace : null }
                    : ingrediente
            );

            // Atualizar o cache
            queryClient.setQueryData(['product-details', String(productDetails.id)], {
                ...cachedData,
                ingredientes: updatedIngredientes,
                valor: itemValueFinish
            });

            const updatedCache = queryClient.getQueryData(['product-details', String(productDetails.id)]);
            console.log('Cache atualizado:', updatedCache);
        }

        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] w-11/12 mx-auto rounded-md">
                <DialogHeader>
                    <DialogTitle className=" uppercase text-xl font-bold flex justify-center items-center gap-1 line-clamp-1">
                        Substituir <strong className="underline underline-offset-2 ">{removeProduct.nome}</strong>
                    </DialogTitle>
                    <DialogDescription className="text-start text-[12px] leading-3">
                        {/* Sugestões para substituir {product}: */}
                        Selecione o item que deseja adicionar no lugar de <strong className="capitalize">{removeProduct.nome}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                    {productDetails.ingredientes.filter(ingrediente => ingrediente.valor <= removeProduct.valor).map((item, index) => (
                        <div key={index}
                            className={`flex items-center gap-2 text-sm ${checked === parseInt(item.id) && 'text-emerald-600'}`}
                            onClick={() => handleChecked(item)}>
                            <Checkbox variant='add' checked={checked === parseInt(item.id)} onChange={() => { }} />
                            <span className='capitalize'>{item.nome} </span>
                        </div>
                    ))}
                    <div
                        className={`flex items-center gap-2 text-sm ${checked === -1 && 'text-emerald-600'}`}
                        onClick={() => handleChecked(null)}>
                        <Checkbox variant='add' checked={checked === -1} onChange={() => { }} />
                        <span className='capitalize'>Nenhum</span>
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex justify-end items-center gap-2">
                        <Button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-1">
                            <PiTrash />  Cancelar
                        </Button>
                        <Button
                            variant={'success'}
                            onClick={handleReplace}
                            className="w-full flex items-center justify-center gap-1">
                            <TbReplace />  Substituir
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
