import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"


type Props = {
    open: boolean
    onClose: () => void
    addressTitle: string
}
export function ModalRemove({ open, onClose, addressTitle }: Props) {
    return (
        <Dialog open={open} onOpenChange={onClose}>

            <DialogContent className="sm:max-w-[425px] w-11/12 mx-auto rounded-md">
                <DialogHeader>
                    <DialogTitle className="text-center ">
                        Excluir
                    </DialogTitle>
                    <DialogDescription className="text-start">
                        Você tem certeza que deseja excluir o endereço <strong className="uppercase">{addressTitle}</strong>?
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <div className="flex justify-end items-center gap-2">
                        <Button className="w-full" onClick={onClose} >
                            Não
                        </Button>
                        <Button className="w-full" onClick={onClose} variant={'destructive'}>
                            Sim
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
