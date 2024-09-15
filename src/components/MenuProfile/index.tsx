'use client'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { CardapioDTO } from "@/dto/cardapioDTO";
import { api } from "@/service/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { FaCoffee } from "react-icons/fa";
import { MdSaveAlt } from "react-icons/md";
import { TbSquareRoundedPlus } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useState } from "react";

const MenuProfile = () => {
    const [open, setOpen] = useState(false);
    const { data: cardapio } = useQuery({
        queryKey: ['list-categories-details'],
        queryFn: async () => {
            try {
                const { data } = await api.get<CardapioDTO[]>('/categoria/lista/detalhes')
                return data
            } catch (error: any) {
                console.log(error)
                toast.error(error.response.data.message)
            }
        },
    });


    return (
        <div className="min-h-screen h-full dark:bg-dark-400 bg-white 2xl:w-64 lg:w-52 fixed top-0 bottom-0 ml-0.5 p-4">

            <div className="flex justify-between items-center p-2">
                <div className="text-start ">
                    <h1 className="text-white text-md font-bold leading-5">Cardápio</h1>
                    <p className="text-muted text-xs leading-4 italic">Natal</p>
                </div>
                <div className="flex justify-center items-center h-14">
                    <img src="https://www.tailwind-kit.com/images/person/1.jpg" className="h-14 w-14 rounded-full" />
                </div>
            </div>

            <section className="mt-6">
                <div className="flex items-center justify-between">
                    <h2 className=" font-sans tracking-widest">Categorias</h2>
                    <button onClick={() => setOpen(true)}>
                        <TbSquareRoundedPlus className=" dark:hover:text-white hover:text-black text-muted  rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 " size={20} />
                    </button>
                </div>
                <div className="mt-3">
                    {cardapio?.map((item, index) => {
                        return (
                            <div key={index} className="flex justify-between items-center p-2 ">
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger className="flex justify-between items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <FaCoffee className="dark:text-white text-muted-foreground" />
                                                {item.titulo}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            {item.produtos.map((produto, index) => (
                                                <div key={index} className="  text-xs w-full h-full dark:bg-dark-400/50  ">
                                                    <p className="line-clamp-1 cursor-pointer hover:text-dark-900 dark:hover:text-white hover:translate-x-1 hover:underline underline-offset-2 duration-300 text-muted py-2">{produto.titulo}</p>
                                                </div>
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        )
                    })}
                </div>
            </section>

            <ModalAddCategory open={open} onClose={() => setOpen(false)} />
        </div>
    );
}

const ModalAddCategory = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Categoria</DialogTitle>
                    <DialogDescription >
                        Insira os detalhes da nova categoria e clique em salvar.
                    </DialogDescription>
                </DialogHeader>
                <div className="">
                    <Label htmlFor="name" className="text-right text-dark-900">
                        Titulo
                    </Label>
                    <Input id="name" value="Frios P" className="text-dark-900 bg-white-off border-muted" />
                </div>
                <DialogFooter>
                    <Button className="flex items-center gap-1" variant={'outline'} type="submit"><MdSaveAlt /> Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
export default MenuProfile;