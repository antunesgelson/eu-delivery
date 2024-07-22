'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function Profile() {
    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        >
            <div className='p-4 leading-3'>
                <h2 className="uppercase text-2xl font-bold ">minhas informações</h2>
                <span className='text-[12px]'>Aqui você pode atualizar e corrigir suas informações sempre que precisar.</span>
            </div>

            <section className="bg-white p-4">
                <form className="space-y-4">
                    <div>
                        <Label className="uppercase" htmlFor="terms">nome</Label>
                        <Input defaultValue={'Gelson Antunes'} />
                    </div>

                    <div>
                        <Label className="uppercase" htmlFor="terms">telefone</Label>
                        <Input disabled type="tel" defaultValue={'(48) 99175-8185'} />
                    </div>

                    <div>
                        <Label className="uppercase" htmlFor="terms">email</Label>
                        <Input type="email" defaultValue={'gelsonantunesv@hotmail.com'} />
                        <p className="text-[11px] leading-3 text-muted-foreground my-2">Fique tranquilo. Não enviamos spam e nunca compartilharemos seu email com ninguém.</p>
                    </div>

                    <div>
                        <Label className="uppercase" htmlFor="terms">aniversário <span className="text-muted">(opicional)</span></Label>
                        <Input type="date" placeholder="DD/MM/AAAA" />
                        <p className="text-[11px] leading-3 text-muted-foreground my-2">Quem sabe você recebe um presentinho da gente! =]</p>
                    </div>

                    <div>
                        <Label className="uppercase" htmlFor="terms">cpf/cnpj <span className="text-muted">(opicional)</span></Label>
                        <Input placeholder="000.000.000-00" />
                        <p className="text-[11px] leading-3 text-muted-foreground my-2">Utilizamos para emitir cupom fiscal.</p>
                    </div>

                    <Button className="w-full" variant={'success'}>
                        Salvar Alterações
                    </Button>
                </form>
            </section>
        </motion.main>
    )
}