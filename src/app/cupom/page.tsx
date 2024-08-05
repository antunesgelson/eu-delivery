
'use client'

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { HiTicket } from "react-icons/hi2";

export default function Cupom() {
    const [checked, setChecked] = useState<number | null>(null);

    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3'>
                <h1 className="uppercase text-base font-bold -mb-5 mt-3 text-center"> escola um dos cupons disponíveis:</h1>
            </div>

            <section className=" p-4 text-sm space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index}
                        className={`border  rounded-lg p-4 bg-white relative duration-300 ${checked === index && 'border-emerald-500'}`}
                        onClick={() => setChecked(index)}>
                        <div className=" flex items-center gap-1">
                            <HiTicket size={25} className="text-muted-foreground" />
                            <span className="font-semibold uppercase">Cupom de desconto</span>
                            <Checkbox className="absolute right-4 top-1/2 transform -translate-y-[50%]" checked={checked === index} onChange={() => { }} variant={`add`} />
                        </div>
                        <div className="flex flex-col text-muted-foreground text-[12px] leading-4">
                            <span>10% de desconto em todo o site</span>
                            <span className="">Validade: 30/12/2022</span>
                            <Link href={'/cashback'} className="font-bold cursor-pointer">VER REGRAS</Link>
                        </div>
                    </div>
                ))}
            </section>

            <div className='p-4 leading-3'>
                <h2 className="uppercase text-base text-center my-1 font-bold"> ou informe o código do seu cupom:</h2>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="código do cupom"
                        className="bg-white border-[2px] border-dashed uppercase text-muted"
                    />
                    <Button variant={'success'}>
                        Aplicar
                    </Button>
                </div>
            </div>
        </motion.main>
    )
}