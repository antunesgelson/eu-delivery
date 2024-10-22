'use client'
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import React, { useState } from "react";
import { Tooltip } from "react-tooltip";

import { BiSolidPhoneCall } from "react-icons/bi";
import { FaPiggyBank } from "react-icons/fa6";
import { IoMdOptions } from "react-icons/io";
import { MdUpdate } from "react-icons/md";

import { RiMarkPenFill, RiMarkPenLine } from "react-icons/ri";

import { IoEyeOutline, IoEyeSharp } from "react-icons/io5";
interface DiasState {
    [key: string]: boolean;
}
const Config = () => {
    const [menu, setMenu] = React.useState('visualizar');
    const [hasInterval, setHasInterval] = useState(false);
    const [dias, setDias] = useState<DiasState>({
        Segunda: true,
        Quinta: true,
        Sábado: false,
        Terça: true,
        Sexta: true,
        Domingo: false,
        Quarta: true,
    });

    const handleCheckboxChange = (dia: string) => {
        setDias((prevDias) => ({
            ...prevDias,
            [dia]: !prevDias[dia],
        }));
    };

    React.useEffect(() => {
        console.log('dias de funcinamento:', dias);
    }, [dias]);

    return (
        <div className="p-6  mx-auto  -mt-16 min-h-screen h-fit space-y-2">
            <div className="flex justify-between items-center border-white-off/20 border-b pb-4 mb-6 relative z-50 ">
                <h1 className="text-3xl flex items-center gap-2 font-sans tracking-widest text-white-off  ">
                    <IoMdOptions />
                    Configurações do Estabelecimento
                </h1>
                <div className="flex items-center ">
                    <Button
                        size={'icon'}
                        variant={'icon'}
                        className="group hover:bg-dark-300 rounded-full duration-300"
                        onClick={() => setMenu('visualizar')}
                        data-tooltip-id={`visualizar-tooltip`}
                        data-tooltip-content={`Visualizar`}>
                        {menu === 'visualizar'
                            ? <IoEyeSharp size={23} className="group-hover:scale-90 duration-150 " />
                            : <IoEyeOutline size={23} className="group-hover:scale-90 duration-150 " />}
                    </Button>
                    <Button
                        size={'icon'}
                        variant={'icon'}
                        className="group hover:bg-dark-300 rounded-full duration-300"
                        onClick={() => setMenu('editar')}
                        data-tooltip-id={`editar-tooltip`}
                        data-tooltip-content={`Editar`}>
                        {menu === 'editar'
                            ? <RiMarkPenFill size={23} className="group-hover:scale-90 duration-150 " />
                            : <RiMarkPenLine size={23} className="group-hover:scale-90 duration-150 " />}
                    </Button>
                    <Tooltip id={`visualizar-tooltip`} />
                    <Tooltip id={`editar-tooltip`} />
                </div>
            </div>
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
            <div className="grid grid-cols-2">
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
                    <div className=" flex flex-col mb-2 gap-1 ">
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
        </div>
    );
};

export default Config;
