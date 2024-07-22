'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { IoMdLocate } from "react-icons/io";

export default function AddAdress() {
    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        >
            <div className='p-4 leading-3'>
                <h2 className="uppercase text-2xl font-bold ">cadastrar endereço </h2>
                <span className='text-[12px]'>Busque o endereço já com o número junto para obter um resultado mais preciso.</span>
            </div>

            <section className="bg-white p-4 h-[30dvh] flex flex-col justify-between">
                <div>
                    <Label className="uppercase" htmlFor="terms">buscar endereço e número</Label>
                    <Input type="search" placeholder="Ex: Rua sete de Setembro, 332, Centro" />
                </div>

                <div className="flex justify-center my-4">
                    <Button className="w-full flex items-center gap-1" variant={'success'}>
                        <IoMdLocate size={20} />
                        Usar minha localização atual
                    </Button>
                </div>
            </section>
        </motion.main>
    )
}