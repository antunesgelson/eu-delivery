'use client'
import useCart from "@/hook/useCart";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";

import { cardapio } from "@/data";

import { signOut, useSession } from "next-auth/react";
import { BiSolidFoodMenu } from "react-icons/bi";
import { BsPersonVcardFill } from "react-icons/bs";
import { FaMapMarkedAlt } from "react-icons/fa";
import { FaArrowRight, FaDoorOpen } from "react-icons/fa6";
import { HiHome } from "react-icons/hi";
import { PiListChecksFill } from "react-icons/pi";

type Props = {
    open: boolean
    onClose: React.Dispatch<React.SetStateAction<boolean>>
}
export function Menu({ onClose, open }: Props) {
    const pathname = usePathname()
    const { data: session } = useSession()

    const { setSelectedItemId, selectedItemId } = useCart();

    const isAuthenticate = session?.user?.name ? true : false;

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

    React.useEffect(() => {
        onClose(false)
    }, [pathname]);

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side={'left'} className="bg-primary border-0 p-4 ">
                <SheetHeader >
                    {!isAuthenticate &&
                        <Button asChild className="uppercase bg-white text-primary rounded-full my-6 font-bold text-md -mt-4">
                            <Link href={'/signin'}>
                                entre ou cadastre-se!
                            </Link>
                        </Button>
                    }
                </SheetHeader>

                <ScrollArea className="h-[80vh]  w-full rounded-md   ">
                    <nav className="space-y-4">
                        <ul className="text-white uppercase font-bold space-y-4 ">
                            <li className="flex items-center w-full h-8 hover:bg-white hover:text-primary rounded-md  duration-300 group">
                                <Link className="group-hover:translate-x-2 group-hover:underline underline-offset-4  duration-300 flex gap-2 items-center" href={'/'}><HiHome /> início</Link>
                            </li>
                            <li className="flex items-center w-full h-8 hover:bg-white hover:text-primary rounded-md  duration-300 group">

                                <Link className="group-hover:translate-x-2 group-hover:underline underline-offset-4  duration-300 flex gap-2 items-center " href={'/'}><BiSolidFoodMenu /> cardápio</Link>
                            </li>

                        </ul>
                        {pathname == '/' &&
                            <ul className=" uppercase font-semibold space-y-3  ">
                                {cardapio.map((produto, index) => (
                                    <li
                                        key={index}
                                        className="pl-5 flex items-center gap-2 text-white w-56  h-8  hover:bg-white hover:text-primary hover:translate-x-2 rounded-md  duration-300 group "
                                        onClick={() => { handleSectionClick(produto.id), onClose(false) }}>

                                        <FaArrowRight className="group-hover:translate-x-1 duration-300 before:translate-x-2" />
                                        <span>{produto.secao}</span>
                                    </li>
                                ))}
                            </ul>
                        }

                        {isAuthenticate &&
                            <ul className="text-white uppercase font-bold space-y-4 mt-4 ">
                                <li className="flex items-center w-wfull h-8 hover:bg-white hover:text-primary rounded-md  duration-300 group">
                                    <Link className="group-hover:translate-x-2 group-hover:underline underline-offset-4  duration-300 flex gap-2 items-center " href={'/profile'}><BsPersonVcardFill /> meu cadastro </Link>
                                </li>

                                {(pathname.includes('/profile') || pathname.includes('/historic') || pathname.includes('/deliveryaddress')) &&
                                    <li className=" w-full  h-8 flex items-center hover:bg-white hover:text-primary rounded-md  duration-300 group">
                                        <Link className="group-hover:translate-x-2 group-hover:underline underline-offset-4  duration-300 flex gap-2 items-center " href={'/deliveryaddress'}>    <FaMapMarkedAlt /> endereços de entrega</Link>
                                    </li>
                                }

                                <li className=" w-full  h-8 flex items-center hover:bg-white  hover:text-primary rounded-md  duration-300 group">
                                    <Link className="group-hover:translate-x-2 group-hover:underline underline-offset-4  duration-300 flex gap-2 items-center" href={'/historic'}> <PiListChecksFill />  últimos pedidos </Link>
                                </li>
                                <li onClick={() => signOut()} className="flex items-center w-full h-8 hover:bg-white hover:text-primary rounded-md  duration-300 group">
                                    <Link className="group-hover:translate-x-2 group-hover:underline underline-offset-4  duration-300 flex gap-2 items-center" href={'/'}><FaDoorOpen /> sair</Link>
                                </li>
                            </ul>
                        }
                    </nav>
                </ScrollArea>
            </SheetContent>
        </Sheet >
    )
}
