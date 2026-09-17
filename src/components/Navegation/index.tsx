'use client'
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { CategoriaCardapioDTO } from "@/dto/cardapioDTO";
import { useCardapio } from "@/hook/useLoja";
import useCart from "@/hook/useCart";
import { AnimatePresence, motion } from "framer-motion";

import { BsSearch } from "react-icons/bs";
import { IoIosCloseCircle } from "react-icons/io";

type NavegationProps = {
    isSearchOpen: boolean;
    searchTerm: string;
    onSearchOpenChange: (open: boolean) => void;
    onSearchTermChange: (value: string) => void;
}

export default function Navegation({
    isSearchOpen,
    searchTerm,
    onSearchOpenChange,
    onSearchTermChange,
}: NavegationProps) {
    const { setSelectedItemId, selectedItemId } = useCart();
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        }
    }, [isSearchOpen]);

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

    const cardapio=(useCardapio().data??[]).map(c=>({id:String(c.id),titulo:c.titulo}));
    const handleCancelSearch = () => {
        onSearchTermChange('');
        onSearchOpenChange(false);
    };

    return (
        <div className="sticky top-14 z-20 flex items-center w-full bg-white border-b lg:w-6/12 mx-auto">
            <Button
                variant={'icon'}
                className="h-12 w-12 shrink-0 rounded-none bg-white"
                onClick={() => {
                    onSearchOpenChange(true);
                    searchInputRef.current?.focus();
                }}>
                <BsSearch className={`duration-300 ${isSearchOpen ? 'text-neutral-400' : 'text-[#474747]'}`} size={20} />
            </Button>

            <div className="border-r border-[#e5e5e5] h-7" />

            {isSearchOpen &&  // Barra de pesquisa
                <AnimatePresence>
                    <motion.div
                        className="flex h-12 min-w-0 flex-1 items-center"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}>
                        <div className="min-w-0 flex-1">
                            <Input
                                ref={searchInputRef}
                                value={searchTerm}
                                onChange={(event) => onSearchTermChange(event.target.value)}
                                placeholder="Buscar"
                                className="h-12 rounded-none border-0 bg-white px-5 text-[16px] font-semibold text-dark-900 shadow-none placeholder:text-neutral-400 focus-visible:ring-0"
                            />
                        </div>

                        <Button
                            variant={'icon'}
                            aria-label="Cancelar busca"
                            className="h-12 w-12 shrink-0 rounded-none bg-white"
                            onClick={handleCancelSearch} >
                            <IoIosCloseCircle className="text-[#474747]" size={30} />
                        </Button>
                    </motion.div>
                </AnimatePresence>
            }

            {!isSearchOpen && // Navegação do cardápio
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
