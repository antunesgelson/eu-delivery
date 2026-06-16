'use client'
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { CategoriaCardapioDTO } from "@/dto/cardapioDTO";
import { localCategorias } from "@/data/menu";
import useCart from "@/hook/useCart";
import { AnimatePresence, motion } from "framer-motion";

import { BsSearch } from "react-icons/bs";
import { IoIosCloseCircle } from "react-icons/io";

export default function Navegation() {
    const { setSelectedItemId, selectedItemId } = useCart();
    const [showSearch, setShowSearch] = useState(false);

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

    const cardapio = localCategorias;

    return (
        <div className="sticky top-14 z-20 flex items-center w-full bg-white border-b lg:w-6/12 mx-auto">
            <Button
                variant={'icon'}
                className="bg-white rounded-none h-11 w-12 shrink-0"
                onClick={() => setShowSearch(true)}>
                <BsSearch className={`duration-300 ${showSearch ? 'text-muted' : 'text-[#474747]'}`} size={18} />
            </Button>

            <div className="border-r border-[#e5e5e5] h-7" />

            {showSearch &&  // Barra de pesquisa
                <AnimatePresence>
                    <motion.div
                        className="relative w-full "
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}>
                        <Input
                            placeholder="Buscar.."
                            className="bg-white placeholder:text-muted rounded-none border-0 w-full h-11 px-4 text-sm"
                        />

                        <Button
                            variant={'icon'}
                            className="absolute right-2 top-1/2 transform translate-y-[-50%] h-8 w-8"
                            onClick={() => setShowSearch(false)} >
                            <IoIosCloseCircle className="text-[#474747] " size={22} />
                        </Button>
                    </motion.div>
                </AnimatePresence>
            }

            {!showSearch && // Navegação do cardápio
                <AnimatePresence>
                    <ScrollArea scrollY={false} className="whitespace-nowrap rounded-none bg-white h-11">
                        <motion.div
                            initial={{ opacity: 0, }}
                            animate={{ opacity: 1, }}
                            transition={{ duration: 0.5 }}>
                            <nav>
                                <ul className="flex w-max items-center gap-5 px-4 py-3 text-[13px] font-bold text-dark-700">
                                    {cardapio?.map((categoria: CategoriaCardapioDTO) => (
                                        <li key={categoria.id}
                                            className={`cursor-pointer duration-300 border-b-2 pb-1 hover:text-[#f97316] hover:border-[#f97316] ${selectedItemId === categoria.id ? 'border-[#f97316] text-[#f97316]' : 'border-transparent'}`}
                                            onClick={() => handleSectionClick(categoria.id)}>
                                            <span>{categoria.titulo}</span>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </motion.div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </AnimatePresence>
            }
        </div>
    )
}
