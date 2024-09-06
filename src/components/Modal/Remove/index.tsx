import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import { AddressDTO } from "@/dto/addressDTO"
import { api } from "@/service/api"
import { useMutation } from "@tanstack/react-query"
import { MdOutlineLocationOff } from "react-icons/md"

type Props = {
    open: boolean
    onClose: () => void
    refetch: () => void
    address: AddressDTO;
}
export function ModalRemove({ open, onClose, refetch, address }: Props) {
    const { mutateAsync: handleRemoveAddress, isPending } = useMutation({
        mutationKey: ['remove-address'],
        mutationFn: async () => {
            const { data } = await api.delete(`/endereco/${address.id}`)
            return data
        }, onSuccess(data) {
            toast.success('Endereço excluído com sucesso')
            refetch()
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
            <DialogContent className="sm:max-w-[425px] w-11/12 mx-auto rounded-md">
                <DialogHeader>
                    <DialogTitle className="flex justify-center items-center gap-1 text-xl "><MdOutlineLocationOff size={25} /> Excluir </DialogTitle>
                    <DialogDescription className="text-start">
                        Você tem certeza que deseja excluir o endereço <strong className="uppercase">{address.apelido}</strong>?
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <div className="flex justify-end items-center gap-2">
                        <Button
                            variant={'outline'}
                            className="w-full"
                            onClick={onClose} >
                            Não
                        </Button>
                        <Button
                            loading={isPending}
                            className="w-full"
                            onClick={() => handleRemoveAddress()} >
                            Sim
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
