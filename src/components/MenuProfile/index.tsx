'use client'
import { CardapioDTO } from "@/dto/cardapioDTO";
import { api } from "@/service/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { FaCoffee, FaShoppingBasket } from "react-icons/fa";
import { MdSaveAlt } from "react-icons/md";
import { TbSquareRoundedPlus } from "react-icons/tb";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AxiosError } from "axios";
import React from "react";
import { Tooltip } from "react-tooltip";

const MenuProfile = () => {
    const [open, setOpen] = React.useState(false);

    const { data: cardapio } = useQuery({
        queryKey: ['list-categories-details'],
        queryFn: async () => {
            try {
                const { data } = await api.get<CardapioDTO[]>('/categoria/lista/detalhes')
                return data
            } catch (error: unknown) {
                if (error instanceof AxiosError && error.response) {
                    toast.error(error.response.data.message)

                } else {
                    toast.error('An unexpected error occurred')
                }
            }
        },
    });
    return (
        <div className="min-h-screen h-full dark:bg-dark-400 bg-white 2xl:w-64 lg:w-52 p-4">
            <div className="flex justify-between items-center p-2">
                <div className="text-start ">
                    <h1 className="text-white text-md font-bold leading-5">Cardápio</h1>
                    <p className="text-muted text-xs leading-4 italic">Natal</p>
                </div>
                <div className="flex justify-center items-center h-14">
                    <img src="https://github.com/antunesgelson.png" className="h-14 w-14 rounded-full" />
                </div>
            </div>
            <section className="mt-6">
                <div className="flex items-center justify-between">
                    <h2 className="font-sans tracking-widest">Categorias</h2>
                    <button onClick={() => setOpen(true)}>
                        <TbSquareRoundedPlus
                            size={20}
                            data-tooltip-id={`categories-tooltip`}
                            data-tooltip-content={'Adicionar nova categoria.'}
                            className=" dark:hover:text-white hover:text-black text-muted  rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 "
                        />
                        <Tooltip id={`categories-tooltip`} />
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
                                            <div className="group cursor-pointer flex justify-between items-center pb-4 -mt-1">
                                                <span className="text-xs font-sans tracking-widest  dark:text-muted group-hover:dark:text-white">Adicionar Produto</span>
                                                <button onClick={() => setOpen(true)}>
                                                    <TbSquareRoundedPlus className="group-hover:dark:text-white text-muted rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100" size={15} />
                                                </button>
                                            </div>
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

                    <Accordion type="single" collapsible className="w-full ">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="flex justify-between items-center gap-2">
                                <div className="flex items-center gap-2 font-sans tracking-widest">
                                    <FaShoppingBasket className="dark:text-white text-muted-foreground" />
                                    Ingredientes
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="group cursor-pointer flex justify-between items-center pb-4 -mt-1">
                                    <span className="text-xs font-sans tracking-widest  dark:text-muted group-hover:dark:text-white">Adicionar Ingrediente</span>
                                    <button onClick={() => setOpen(true)}>
                                        <TbSquareRoundedPlus className="group-hover:dark:text-white text-muted rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100" size={15} />
                                    </button>
                                </div>
                                <div className="  text-xs w-full h-full dark:bg-dark-400/50  ">
                                    <p className="line-clamp-1 cursor-pointer hover:text-dark-900 dark:hover:text-white hover:translate-x-1 hover:underline underline-offset-2 duration-300 text-muted py-2">ingrediente.titulo</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>
            <ModalAddCategory
                open={open}
                onClose={() => setOpen(false)} />
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