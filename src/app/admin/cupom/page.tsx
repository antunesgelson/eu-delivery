'use client'
import { motion } from "framer-motion";
import { useState } from "react";

import { CupomDTO } from "@/dto/cupomDTO";
import { api } from "@/service/api";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { Tooltip } from "react-tooltip";

import { HiTicket } from "react-icons/hi2";
import { MdLibraryAdd, MdOutlineUpdate } from "react-icons/md";
import { TiEdit } from "react-icons/ti";

import { ModalAddCupom } from "@/components/Modal/AddCupom";
import { ModalEditCupom } from "@/components/Modal/EditCupom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";




const Cupom = () => {
    const [open, setOpen] = useState(false)
    const [openModalEditar, setOpenModalEditar] = useState(false)
    const [cupom, setCupom] = useState<CupomDTO>({} as CupomDTO)
    const [filter, setFilter] = useState('')

    const { data: cupons, refetch: handleUpdateListCupom } = useQuery({
        queryKey: ['list-cupom-admin', filter],
        queryFn: async () => {
            try {
                const { data } = await api.get<CupomDTO[]>('/cupom/buscar', {
                    params: {
                        nome: filter
                    }
                })
                return data
            } catch (error: unknown) {
                if (error instanceof AxiosError || error instanceof Error) {
                    console.log(error.message)
                }
            }
        }
    })

    return (
        <div className="p-6  mx-auto  -mt-16 min-h-screen h-fit ">
            <div className="flex justify-between items-center border-white-off/20 border-b pb-4 mb-6 relative z-50 ">
                <h1 className="text-3xl flex items-center gap-2 font-sans tracking-widest text-white-off  ">
                    <HiTicket />
                    Cupom
                </h1>
                <div className="flex items-center ">
                    <Input
                        type="search"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                    <Button
                        size={'icon'}
                        variant={'icon'}
                        className="group hover:bg-dark-300 rounded-full duration-300"
                        onClick={() => setOpen(true)}
                        data-tooltip-id={`adicionar-tooltip`}
                        data-tooltip-content={`Adicionar`}>
                        <MdLibraryAdd size={23} className="group-hover:scale-90 duration-150 " />
                    </Button>

                    <Tooltip id={`adicionar-tooltip`} />
                </div>
            </div>

            <section className="grid grid-cols-3 gap-3">
                {cupons?.map((cupom, index) => (
                    <motion.div
                        layout
                        key={cupom.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ delay: index * 0.1, duration: 0.7 }}>
                        <CardCupom
                            cupom={cupom}
                            setCupom={setCupom}
                            open={open}
                            openModalEditar={setOpenModalEditar}
                        />
                    </motion.div >
                ))}
            </section>

            <ModalEditCupom
                cupom={cupom}
                open={openModalEditar}
                onClose={() => setOpenModalEditar(false)}
                onUpdate={handleUpdateListCupom}
            />
            <ModalAddCupom
                open={open}
                onClose={() => setOpen(!open)}
                onUpdate={handleUpdateListCupom}
            />

        </div>
    )
}

type CardCupomProps = {
    open: boolean;
    openModalEditar: (open: boolean) => void;
    cupom: CupomDTO;
    setCupom: (cupom: CupomDTO) => void;
}


const CardCupom = ({ cupom, openModalEditar, setCupom }: CardCupomProps) => {

    function handleOpenModalEdit() {
        setCupom(cupom)
        openModalEditar(true)
    }
    return (
        <div className={`bg-dark-300 h-44 w-full rounded-md px-4 py-3 relative border-[0.1px]  ${cupom.status ? '  border-emerald-500' : '  border-red-600'} `}>
            <div className="flex items-center justify-between my-2">
                <h2>{cupom.nome}</h2>
                <span className="text-xs flex items-center gap-1 "><MdOutlineUpdate size={14} />{new Date(cupom.validade)?.toLocaleDateString('pt-br')}</span>
            </div>
            <Separator className="w-full bg-muted/20 mb-2" />
            <div className="text-xs text-muted flex flex-col justify-between  ">
                <p className="line-clamp-3 h-12">{cupom.descricao}</p>
                <div className="grid grid-cols-3 gap-1 text-white-off">
                    <span
                        data-tooltip-id={`tipo-tooltip`}
                        data-tooltip-content={'Este campo indica o tipo do cupom, porcentagem ou fixo.'}>
                        Tipo: {cupom.tipo}
                    </span>
                    <span
                        data-tooltip-id={`valor-tooltip`}
                        data-tooltip-content={cupom.tipo === 'porcentagem'
                            ? `Usuário irá receber um desconto de ${cupom.valor}%.`
                            : `Usuário irá receber um desconto de R$${cupom.valor}.`
                        }>
                        Valor: {cupom.tipo === 'valor_fixo' && 'R$'}{cupom.valor}{cupom.tipo === 'porcentagem' && '%'}
                    </span>
                    <span
                        data-tooltip-id={`quantia-tooltip`}
                        data-tooltip-content={'Quantia do cupom disponível para uso.'}>
                        Quantidade: {cupom.quantidade}
                    </span>
                    <span
                        data-tooltip-id={`valorMinimo-tooltip`}
                        data-tooltip-content={'Valor necessário para utilizar este cupom.'}>
                        Valor minímo: R$ {cupom.valorMinimoGasto?.toFixed(2)}
                    </span>
                    <RadioGroup defaultValue="comfortable">
                        <div
                            className="flex items-center gap-2"
                            data-tooltip-id={`unico-tooltip`}
                            data-tooltip-content={'Indica se este cupom pode ser utilizado apenas 1 vez.'}>
                            Único:
                            <RadioGroupItem value="default" id="r1" checked={cupom.unicoUso} />
                        </div>
                    </RadioGroup>
                    <RadioGroup defaultValue="comfortable">
                        <div
                            className="flex items-center gap-2"
                            data-tooltip-id={`publico-tooltip`}
                            data-tooltip-content={'Indica se este cupom é listado para todos os usuários ou apenas para administradores.'}>
                            Público:
                            <RadioGroupItem value="default" id="r2" checked={cupom.listaPublica} />
                        </div>
                    </RadioGroup>
                    <Tooltip id={`publico-tooltip`} />
                    <Tooltip id={`unico-tooltip`} />
                    <Tooltip id={`valorMinimo-tooltip`} />
                    <Tooltip id={`valor-tooltip`} />
                    <Tooltip id={`quantia-tooltip`} />
                    <Tooltip id={`tipo-tooltip`} />
                </div>
            </div>

            <div className={`w-3 h-3 rounded-full absolute top-1.5 right-1 ${cupom.status ? 'bg-emerald-500' : 'bg-red-600'}`}
                data-tooltip-id={`status-tooltip`}
                data-tooltip-content={cupom.status ? 'Ativo' : 'Desativado'}>
                <Tooltip id={`status-tooltip`} />
            </div>

            <button
                onClick={handleOpenModalEdit}
                className="hover:scale-150 duration-200 absolute top-1 right-5"
                data-tooltip-id="editar-tooltip"
                data-tooltip-content="Editar">
                <TiEdit className="   hover:text-blue-500" />
            </button>
            <Tooltip id="editar-tooltip" />
        </div>
    )
}

export default Cupom;