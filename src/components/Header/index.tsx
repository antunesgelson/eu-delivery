'use client'
import Link from "next/link";
import React, { memo, useEffect } from "react";

import { HiShoppingCart } from "react-icons/hi";
import { IoIosArrowRoundBack } from "react-icons/io";
import { MdOutlineRestaurantMenu } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { Menu } from "./Menu";

import { AnimatePresence, motion } from "framer-motion";

import useAuth from "@/hook/useAuth";
import useCart from "@/hook/useCart";
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from "next/navigation";


type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
}
const DefaultHeader = memo(({ open, setOpen }: Props) => {
    const { data: session } = useSession()
    const { isAuthenticated } = useAuth();
    const { cart } = useCart();

    useEffect(() => {
        console.log('cart', cart)
    }, [cart]);
    return (
        <div className="flex justify-between items-center h-14">
            <Button variant={'icon'} onClick={() => setOpen(!open)} className="-ml-4">
                <MdOutlineRestaurantMenu size={33} />
            </Button>

            {isAuthenticated && !cart?.itens && <span className="font-semibold text-lg">Olá {session?.user?.name ? session.user.name.split(' ')[0] : 'Visitante'},</span>}
            {isAuthenticated && cart?.itens && cart?.itens.length > 0 && (
                <Link href={'/checkout'}>
                    <div className="relative cursor-pointer">
                        <HiShoppingCart size={25} />
                        <div className="text-[9px] bg-red-600 flex justify-center items-center rounded-full w-4 h-4 absolute -top-2 left-5">
                            {cart?.itens.length}
                        </div>
                    </div>
                </Link>
            )}

            {!isAuthenticated &&
                <Button asChild className="font-semibold text-lg -mr-4">
                    <Link href={"/signin"}>Entrar</Link>
                </Button>}
        </div>
    )
});
// Adicionando displayName ao componente DefaultHeader
DefaultHeader.displayName = 'DefaultHeader';


const SpecialHeader = memo(() => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { cart } = useCart();
    return (
        <div className="flex justify-between items-center h-14">
            <AnimatePresence>
                <motion.div
                    // initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.4 }}>
                    <motion.span
                        className="font-semibold text-lg flex items-center"
                        whileTap={{ x: -10, scale: 0.9 }}
                        onClick={() => router.back()}>
                        <IoIosArrowRoundBack size={20} />
                        VOLTAR
                    </motion.span>
                </motion.div>
            </AnimatePresence>

            {isAuthenticated && cart?.itens && cart?.itens.length > 0 && (
                <Link href={'/checkout'}>
                    <div className="relative cursor-pointer">
                        <HiShoppingCart size={25} />
                        <div className="text-[9px] bg-red-600 flex justify-center items-center rounded-full w-4 h-4 absolute -top-2 left-5">
                            {cart?.itens.length}
                        </div>
                    </div>
                </Link>
            )}
        </div>
    );
});

// Adicionando displayName ao componente SpecialHeader
SpecialHeader.displayName = 'SpecialHeader';

const specialPaths = [
    '/productdetails',
    '/deliveryaddress/',
    '/cashback',
    '/checkout',
    '/signin',
    '/cupom',
    '/formofpayment'
];

const isSpecialPath = (pathname: string) => {
    return specialPaths.some(path => pathname.includes(path));
};

const Header = () => {
    const pathname = usePathname()
    const [open, setOpen] = React.useState(false)

    return (
        <header className="bg-primary text-white h-14 px-4  fixed top-0 bottom-0 left-0 right-0 z-10 pb-14">
            {!isSpecialPath(pathname) && <DefaultHeader open={open} setOpen={setOpen} />}
            {isSpecialPath(pathname) && <SpecialHeader />}
            <Menu open={open} onClose={setOpen} />
        </header >
    )
}

export default Header;