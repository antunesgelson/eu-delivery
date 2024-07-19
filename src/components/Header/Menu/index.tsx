import * as React from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";

import { cardapio } from "@/data";
import useCart from "@/hook/useCart";

import { FaArrowRight } from "react-icons/fa6";

type Props = {
    open: boolean
    onClose: React.Dispatch<React.SetStateAction<boolean>>
}


export function Menu({ onClose, open }: Props) {
    const { setSelectedItemId, selectedItemId } = useCart();

    const handleSectionClick = (secaoId: string) => {
        setSelectedItemId(secaoId);
        const sectionElement = document.querySelector(`#section-${secaoId}`);
        const headerHeight = 80;
        if (sectionElement instanceof HTMLElement) { // Assegura o tipo aqui
            window.scrollTo({
                top: sectionElement.offsetTop - headerHeight, // Posição da seção menos a altura do cabeçalho
                behavior: 'smooth', // Desliza suavemente até a seção
            });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side={'left'} className="bg-primary border-0  ">
                <SheetHeader >
                    <Button className="uppercase bg-white text-primary rounded-full my-4 font-bold text-md">
                        entre ou cadastre-se!
                    </Button>
                </SheetHeader>

                <nav className="space-y-4">
                    <ul className="text-white uppercase font-bold space-y-4 ">
                        <li>início</li>
                        <li>cardápio</li>
                    </ul>

                    <ScrollArea className="h-[450px] w-full  rounded-md  ">
                        <ul className=" uppercase font-semibold space-y-3  ">
                            {cardapio.map((produto, index) => (
                                <li
                                    key={index}
                                    className="pl-5 flex items-center gap-2 text-white  h-8  hover:bg-white hover:text-primary hover:translate-x-2 rounded-md  duration-300 group "
                                    onClick={() => { handleSectionClick(produto.id), onClose(false) }}>

                                    <FaArrowRight className="group-hover:translate-x-1 duration-300 before:translate-x-2" />
                                    <span>{produto.secao}</span>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                </nav>
            </SheetContent>
        </Sheet>
    )
}
