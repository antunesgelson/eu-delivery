'use client'
import { Button } from "@/components/ui/button";

import React, { useState } from "react";
import { Tooltip } from "react-tooltip";

import { IoMdSettings } from "react-icons/io";
import { IoEyeOutline, IoEyeSharp } from "react-icons/io5";
import { RiMarkPenFill, RiMarkPenLine } from "react-icons/ri";
import ViewConfig from "./components";


export type DiasState = {
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

            {menu === 'editar' &&
                <ViewConfig
                    dias={dias}
                    hasInterval={hasInterval}
                    setHasInterval={setHasInterval}
                    handleCheckboxChange={handleCheckboxChange}
                />
            }



        </div>
    );
};

export default Config;
