'use client'

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { STORE_PICKUP_ADDRESS } from "@/data/store";
import useCart from "@/hook/useCart";
import { toast } from "sonner";
import { FaCheckCircle } from "react-icons/fa";
import { FaMapLocationDot, FaStore } from "react-icons/fa6";

type Props = {
    open: boolean
    onClose: () => void
}

export function ModalChooseAdress({ open, onClose }: Props) {
    const { choosePickupLocation } = useCart();

    const handleChoosePickup = () => {
        choosePickupLocation();
        onClose();
        toast.success('Retirada no local selecionada.');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-11/12 max-w-[390px] rounded-md bg-white p-4">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-[18px] font-extrabold text-dark-900">
                        Como quer receber seu pedido?
                    </DialogTitle>
                    <DialogDescription className="text-[12px] leading-4 text-dark-500">
                        No momento trabalhamos apenas com retirada no estabelecimento.
                    </DialogDescription>
                </DialogHeader>

                <button
                    type="button"
                    onClick={handleChoosePickup}
                    className="mt-2 w-full rounded-md border-2 border-emerald-500 bg-white p-4 text-left"
                >
                    <div className="grid grid-cols-[32px_1fr_28px] items-center gap-3">
                        <FaStore className="text-dark-700" size={25} />
                        <div className="min-w-0">
                            <strong className="block text-[14px] font-extrabold text-dark-900">
                                Retirar na loja
                            </strong>
                            <span className="mt-1 flex items-start gap-1 text-[12px] leading-4 text-dark-500">
                                <FaMapLocationDot className="mt-0.5 shrink-0 text-[#f97316]" />
                                {STORE_PICKUP_ADDRESS.rua}, {STORE_PICKUP_ADDRESS.numero}
                            </span>
                            <span className="block text-[12px] leading-4 text-dark-500">
                                {STORE_PICKUP_ADDRESS.bairro}
                            </span>
                        </div>
                        <FaCheckCircle className="text-emerald-500" size={24} />
                    </div>
                </button>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="success"
                        className="h-11 w-full text-[14px] font-extrabold"
                        onClick={handleChoosePickup}
                    >
                        Confirmar retirada
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
