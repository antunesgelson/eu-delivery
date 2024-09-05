'use client'
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { CategoriaCardapioDTO } from "@/dto/cardapioDTO";
import useCart from "@/hook/useCart";
import { api } from "@/service/api";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BsSearch } from "react-icons/bs";
import { IoIosCloseCircle } from "react-icons/io";
import { toast } from "sonner";

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



    const { data: cardapio } = useQuery({
        queryKey: ['list-categories'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/categoria/listar')
                return data
            } catch (error: any) {
                console.log(error)
                toast.error(error.response.data.message)
            }
        },
    });

    return (
        <div className="flex items-center w-full bg-white">
            <Button
                variant={'icon'}
                className="bg-white rounded-none  h-14 "
                onClick={() => setShowSearch(true)}>
                <BsSearch className={`duration-300 ${showSearch ? 'text-muted' : 'text-[#474747]'}`} size={20} />
            </Button>

            <div className="border-r-2 border-[#909090] h-10" />

            {showSearch &&  // Barra de pesquisa
                <AnimatePresence>
                    <motion.div
                        className="relative w-full "
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}>
                        <Input
                            placeholder="Buscar.."
                            className="bg-white placeholder:text-muted rounded-none border-0 w-full h-14 px-4 "
                        />

                        <Button
                            variant={'icon'}
                            className="absolute right-3 top-1/2 transform translate-y-[-50%] "
                            onClick={() => setShowSearch(false)} >
                            <IoIosCloseCircle className="text-[#474747] " size={26} />
                        </Button>
                    </motion.div>
                </AnimatePresence>
            }

            {!showSearch && // Navegação do cardápio
                <AnimatePresence>
                    <ScrollArea scrollY={false} className=" whitespace-nowrap rounded-none bg-white h-14   ">
                        <motion.div
                            initial={{ opacity: 0, }}
                            animate={{ opacity: 1, }}
                            transition={{ duration: 0.5 }}>
                            <nav>
                                <ul className="flex w-max space-x-10 px-10 p-4 uppercase text-muted">
                                    {cardapio?.map((categoria: CategoriaCardapioDTO) => (
                                        <li key={categoria.id}
                                            className={`cursor-pointer duration-300 lg:hover:text-primary border-b-2  lg:hover:border-primary ${selectedItemId === categoria.id ? 'border-primary text-primary' : 'border-transparent'}`}
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