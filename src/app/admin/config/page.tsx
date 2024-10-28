'use client'
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import ViewConfig from "./components";

import { Tooltip } from "react-tooltip";

import { IoMdSettings } from "react-icons/io";
import { IoEyeOutline, IoEyeSharp } from "react-icons/io5";
import { RiMarkPenFill, RiMarkPenLine } from "react-icons/ri";


export type DiasState = {
    [key: string]: {
        abertura: string;
        fechamento: string;
        inicio_intervalo: string;
        fim_intervalo: string;
    };
}
const Config = () => {
    const [menu, setMenu] = React.useState('editar');
    const [hasInterval, setHasInterval] = useState(false);
    const [dias, setDias] = useState({
        seg: {
            abertura: '08:00',
            fechamento: '19:00',
            inicio_intervalo: '',
            fim_intervalo: ''
        },
        ter: {
            abertura: '08:00',
            fechamento: '12:00',
            inicio_intervalo: '14:00',
            fim_intervalo: '18:00'
        },
        qua: {
            abertura: '08:00',
            fechamento: '19:00',
            inicio_intervalo: '',
            fim_intervalo: ''
        },
        qui: {
            abertura: '08:00',
            fechamento: '19:00',
            inicio_intervalo: '',
            fim_intervalo: ''
        },
        sex: {
            abertura: '08:00',
            fechamento: '19:00',
            inicio_intervalo: '',
            fim_intervalo: ''
        },
        sab: {
            abertura: '',
            fechamento: '',
            inicio_intervalo: '',
            fim_intervalo: ''
        },
        dom: {
            abertura: '',
            fechamento: '',
            inicio_intervalo: '',
            fim_intervalo: ''
        }
    });



    React.useEffect(() => {
        console.log('dias de funcinamento:', dias);
    }, [dias]);

    return (
        <div className="p-6  mx-auto  -mt-16 min-h-screen h-fit ">
            <div className="flex justify-between items-center border-white-off/20 border-b pb-4 mb-6 relative z-50 ">
                <h1 className="text-3xl flex items-center gap-2 font-sans tracking-widest text-white-off  ">
                    <IoMdSettings />
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

            {menu === 'editar' && <ViewConfig />}
        </div>
    );
};

export default Config;
