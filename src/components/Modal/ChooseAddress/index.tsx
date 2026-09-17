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
import Link from "next/link";
import {useQuery} from "@tanstack/react-query";
import {api} from "@/service/api";
import {AddressDTO} from "@/dto/addressDTO";
import { STORE_PICKUP_ADDRESS } from "@/data/store";
import { lerConfiguracao } from "@/hook/useAgendamento";
import useCart from "@/hook/useCart";
import { toast } from "sonner";
import { FaCheckCircle } from "react-icons/fa";
import { FaMapLocationDot, FaStore } from "react-icons/fa6";

type Props = {
    open: boolean
    onClose: () => void
}

export function ModalChooseAdress({ open, onClose }: Props) {
    const { choosePickupLocation,chooseDeliveryAddress,configData,isPending,cart } = useCart();
    const addresses=useQuery<AddressDTO[]>({queryKey:['deliveryaddress-list'],queryFn:async()=>(await api.get('/endereco/todos')).data,enabled:open});
    const pickupAddress = lerConfiguracao(configData, 'ENDERECO', STORE_PICKUP_ADDRESS);
    const delivery=(()=>{try{return JSON.parse(configData.find(c=>c.chave==='ENTREGA')?.valor??'{}');}catch{return {};}})();

    const handleChoosePickup = async () => {
        try{await choosePickupLocation();}catch{return;}
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
                        Escolha retirada gratuita ou entrega na área atendida.
                    </DialogDescription>
                </DialogHeader>

                <button
                    type="button"
                    disabled={isPending} onClick={handleChoosePickup}
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
                                {pickupAddress.rua}, {pickupAddress.numero}
                            </span>
                            <span className="block text-[12px] leading-4 text-dark-500">
                                {pickupAddress.bairro}
                            </span>
                        </div>
                        {cart?.tipoRecebimento === 'pickup' && <FaCheckCircle className="text-emerald-500" size={24} />}
                    </div>
                </button>

                {delivery.habilitada&&<section className="space-y-2"><h3 className="font-bold">Entrega — {Number(delivery.taxa).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</h3><p className="text-xs">CEPs: {delivery.faixasCep?.map((f:any)=>f.inicio===f.fim?f.inicio:`${f.inicio} a ${f.fim}`).join(', ')}{delivery.bairros?.join(', ')}</p>{addresses.isPending&&<p>Carregando endereços…</p>}{addresses.isError&&<button onClick={()=>addresses.refetch()}>Tentar carregar endereços novamente</button>}<div className="max-h-40 space-y-2 overflow-y-auto">{addresses.data?.map(a=><button disabled={isPending} key={a.id} className="w-full rounded border p-3 text-left text-sm" onClick={async()=>{try{await chooseDeliveryAddress(a.id);onClose();toast.success('Endereço de entrega selecionado.');}catch{}}}>{a.apelido}: {a.rua}, {a.numero} — {a.cep}</button>)}</div><Link href="/deliveryaddress/add" className="block text-sm font-bold text-orange-600">Cadastrar endereço</Link></section>}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="success"
                        className="h-11 w-full text-[14px] font-extrabold"
                        disabled={isPending} onClick={handleChoosePickup}
                    >
                        Confirmar retirada
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
