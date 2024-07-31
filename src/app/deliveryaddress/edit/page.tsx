'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useState } from "react";
export default function EditAddress() {
    const [favorite, setFavorite] = useState(false);
    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        >
            <div className='p-4 leading-3'>
                <h1 className="uppercase text-2xl font-bold whitespace-nowrap ">complete o seu endereço</h1>
                <span className='text-[12px]'>Preencha todos os detalhes do seu endereço para garantir que seu pedido chegue rapidinho!</span>
            </div>


            <section className="bg-white p-4">
                <form className="space-y-4">
                    <div>
                        <Label className="uppercase" htmlFor="terms">apelido</Label>
                        <Input className="uppercase" defaultValue={'casa'} />
                    </div>

                    <div>
                        <Label className="uppercase" htmlFor="terms">endereço</Label>
                        <Input disabled className="capitalize" defaultValue={'rua vani correa'} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="uppercase" htmlFor="terms">bairro</Label>
                            <Input disabled type="text" className="capitalize" defaultValue={'bom viver'} />
                        </div>

                        <div>
                            <Label className="uppercase" htmlFor="terms">cep </Label>
                            <Input disabled type="text" defaultValue={'88162213'} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="uppercase" htmlFor="terms">número</Label>
                            <Input disabled type="text" className="capitalize" defaultValue={'bom viver'} />
                        </div>

                        <div>
                            <Label className="uppercase" htmlFor="terms">complemento</Label>
                            <Input type="text" placeholder="Ex: Bloco 1, AP 321" />
                        </div>
                    </div>

                    <div className=' '>
                        <Label className="uppercase" htmlFor="terms">referência</Label>
                        <Textarea rows={5} placeholder="Digite sua mensagem aqui." />
                    </div>


                    <Button className="w-full" variant={'success'}>
                        Salvar Alterações
                    </Button>
                </form>
            </section>
        </motion.main>
    )
}