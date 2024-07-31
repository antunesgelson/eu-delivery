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
import { cardapio } from "@/data"
import { useState } from "react"
import { PiTrash } from "react-icons/pi"
import { TbReplace } from "react-icons/tb"
type Props = {
    open: boolean
    onClose: () => void
    product: string
    items: string[]
}
export function ModalSubstituir({ open, onClose, product }: Props) {
    const [checked, setChecked] = useState();

    return (
        <Dialog open={open} onOpenChange={onClose}>

            <DialogContent className="sm:max-w-[425px] w-11/12 mx-auto rounded-md">
                <DialogHeader>
                    <DialogTitle className=" uppercase text-xl font-bold flex justify-center items-center gap-1 line-clamp-1">
                        Substituir <strong className="underline underline-offset-2 ">{product}</strong>
                    </DialogTitle>
                    <DialogDescription className="text-start text-[12px] leading-3">
                        {/* Sugestões para substituir {product}: */}
                        Selecione o item que deseja adicionar no lugar de <strong className="capitalize">{product}</strong>.
                    </DialogDescription>
                </DialogHeader>


                <div className="grid grid-cols-2 gap-4">
                    {cardapio[9].itens[0]?.igredientes.map((item, index) => (
                        <div key={index} className={`flex items-center gap-2 text-sm ${checked === index && 'text-emerald-600'}`} onClick={() => setChecked(index)}>
                            <Checkbox variant='add' checked={checked === index} onChange={() => { }} />
                            <span className='capitalize'>{item.nome} </span>
                        </div>
                    ))}</div>


                <DialogFooter>
                    <div className="flex justify-end items-center gap-2">
                        <Button className="w-full flex items-center justify-center gap-1" onClick={onClose} >
                            <PiTrash />  Cancelar
                        </Button>
                        <Button className="w-full flex items-center justify-center gap-1" onClick={onClose} variant={'success'}>
                            <TbReplace />  Substituir
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
