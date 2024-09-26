'use client'

import { Button } from "@/components/ui/button";
import useCart from "@/hook/useCart";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";

export default function OrderSummaryBar() {
    const [showMenu, setShowMenu] = React.useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);
    const { cart } = useCart()

    const controlMenu = useCallback(() => {
        if (typeof window !== 'undefined') {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
                // If the user has reached the bottom of the page, show the menu
                setShowMenu(true);
            } else if (window.scrollY > lastScrollY) {
                // If the user is scrolling down, hide the menu
                setShowMenu(false);
            } else {
                // If the user is scrolling up, show the menu
                setShowMenu(true);
            }
            setLastScrollY(window.scrollY); // Remember current page location to use in the next move
        }
    }, [setShowMenu, setLastScrollY, lastScrollY]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', controlMenu);
            return () => {    // cleanup function
                window.removeEventListener('scroll', controlMenu);
            }
        }
    }, [lastScrollY, controlMenu]);
    return (
        <AnimatePresence>
            {showMenu &&
                <motion.div
                    className='fixed bottom-0 left-0 right-0 bg-white p-2 flex justify-between items-center border z-50'
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    transition={{ duration: 0.5 }}>

                    <Button asChild className='w-full flex justify-between p-2 text-lg h-12' variant={'success'}>
                        <Link href={'/checkout'}>
                            <span className='ml-3 flex items-center gap-2'> <IoMdCheckmarkCircleOutline size={25} /> Finalizar Pedido</span> <div className='bg-white text-primary p-1 rounded-lg text-base font-bold'> R$ {cart?.valorTotalPedido.toFixed(2)}</div>
                        </Link>
                    </Button>
                </motion.div>
            }
        </AnimatePresence>
    )
}