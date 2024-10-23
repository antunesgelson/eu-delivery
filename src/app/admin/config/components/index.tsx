'use client'
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";


import { BiSolidPhoneCall } from "react-icons/bi";
import { FaPiggyBank } from "react-icons/fa6";
import { MdUpdate } from "react-icons/md";
import { DiasState } from "../page";

type Props = {
    dias: DiasState;
    hasInterval: boolean;
    setHasInterval: (value: boolean) => void;
    handleCheckboxChange: (dia: string) => void;
}
export default function ViewConfig({ dias, hasInterval, setHasInterval, handleCheckboxChange }: Props) {
    return (
        <section className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
                {/* Cashback Section */}
                <div className="bg-dark-300 p-4  rounded-md">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <FaPiggyBank />
                        Cashback
                    </h2>
                    <div className="relative">
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            defaultValue="20"
                            label="Defina a porcentagem de Cashback:"
                        />
                        <span className="absolute left-9 top-1/2 transform ">
                            %
                        </span>
                    </div>
                </div>
                {/* Informações de Contato Section */}
                <div className="bg-dark-300 p-4 rounded-md flex flex-col">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <BiSolidPhoneCall />
                        Informações de Contato
                    </h2>
                    <div className="flex flex-col justify-center">
                        <Input label="Telefone:" type="tel" defaultValue="48991758185" />
                        <Input label="Facebook:" type="tel" defaultValue="@antunesgelson" />
                        <Input label="Instagram:" type="tel" defaultValue="@antunesgelson" />
                    </div>
                </div>
            </div>
            <div className="grid ">
                {/* Horário de Atendimento Section */}
                <div className="bg-dark-300 p-4  rounded-md ">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <MdUpdate />
                        Horário de Atendimento
                    </h2>
                    <div className="grid grid-cols-2 gap-2 items-center">
                        <Input label="Abertura" type="time" />
                        <Input label="Fechamento" type="time" />
                    </div>
                    <h3 className="font-semibold my-2">Dias de Funcionamento</h3>
                    <div className="grid grid-cols-3  gap-2 ">
                        {Object.keys(dias).map((dia) => (
                            <div key={dia} className="flex items-center gap-2">
                                <Checkbox
                                    id={dia}
                                    className="w-5 h-5"
                                    checked={dias[dia]}
                                    onCheckedChange={() => handleCheckboxChange(dia)}
                                />
                                <label className="cursor-pointer" htmlFor={dia}>{dia}</label>
                            </div>
                        ))}
                    </div>
                    <div className=" flex flex-col my-3 gap-1 ">
                        <label className="cursor-pointer" htmlFor="temIntervalo">Possui intervalo?</label>
                        <div className="flex items-center gap-2">
                            <Button
                                size={'sm'}
                                variant={hasInterval ? 'outline' : 'default'}
                                className={`${hasInterval ? ' ' : 'text-white-off'}`}
                                onClick={() => setHasInterval(true)}>
                                NÃO
                            </Button>
                            <Button
                                size={'sm'}
                                variant={hasInterval ? 'default' : 'outline'}
                                className={`${hasInterval ? ' text-white-off' : ''}`}
                                onClick={() => setHasInterval(false)} >
                                SIM
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-center">
                        <Input
                            type="time"
                            disabled={hasInterval}
                            label="Início do Intervalo:"
                        />
                        <Input
                            type="time"
                            disabled={hasInterval}
                            label="Fim do Intervalo:"
                        />
                    </div>
                    <Button className="w-full mt-4" variant={'outline'}>Salvar Horário</Button>
                </div>
            </div>
            <div className="w-full flex justify-end mt-4">
                {/* Save Button */}
                <Button variant={'outline'}>
                    Salvar Configurações
                </Button>
            </div>
        </section>
    )
}