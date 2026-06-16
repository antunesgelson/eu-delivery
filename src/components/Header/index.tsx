'use client'
import Image from "next/image";
import Link from "next/link";
import React, { memo } from "react";

import { HiShoppingCart } from "react-icons/hi";
import { IoIosArrowRoundBack } from "react-icons/io";
import { MdMenu } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { Menu } from "./Menu";

import { AnimatePresence, motion } from "framer-motion";

import useAuth from "@/hook/useAuth";
import useCart from "@/hook/useCart";
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from "next/navigation";
import AssadosZaniniSymbol from "@/assets/logo/assados-zanini-symbol.jpg";


type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
}
const DefaultHeader = memo(({ open, setOpen }: Props) => {
    const { data: session } = useSession()
    const { isAuthenticated } = useAuth();
    const { cart } = useCart();
    const cartItemCount = cart?.itens.reduce((total, item) => total + item.quantidade, 0) ?? 0;

    return (
        <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
                <Image
                    src={AssadosZaniniSymbol}
                    alt="Assados Zanini"
                    className="h-11 w-11 shrink-0 rounded-full border border-white/40 bg-[#f4d7a8] object-contain"
                    width={44}
                    height={44}
                    priority
                />
                <div className="min-w-0">
                    <h1 className="truncate text-[16px] font-extrabold leading-5 text-white">Assados Zanini</h1>
                    {isAuthenticated && (
                        <span className="block truncate text-[10px] font-medium text-white/85">
                            Olá {session?.user?.name ? session.user.name.split(' ')[0] : 'Visitante'}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
                {cartItemCount > 0 && (
                    <Link href={'/cart'}>
                        <div className="relative cursor-pointer">
                            <HiShoppingCart size={25} />
                            <div className="text-[9px] bg-[#f97316] flex justify-center items-center rounded-full min-w-4 h-4 px-1 absolute -top-2 left-5">
                                {cartItemCount}
                            </div>
                        </div>
                    </Link>
                )}

                <Button
                    variant={'icon'}
                    onClick={() => setOpen(!open)}
                    aria-label="Abrir menu"
                    className="-mr-2 h-12 w-12 text-white"
                >
                    <MdMenu size={40} />
                </Button>
            </div>

            {!isAuthenticated &&
                <Button asChild variant="ghost" className="hidden font-semibold text-sm text-white hover:bg-white/10 hover:text-white">
                    <Link href={"/signin"}>Entrar</Link>
                </Button>}
        </div>
    )
});
// Adicionando displayName ao componente DefaultHeader
DefaultHeader.displayName = 'DefaultHeader';


const SpecialHeader = memo(() => {
    const router = useRouter();
    const { cart } = useCart();
    const cartItemCount = cart?.itens.reduce((total, item) => total + item.quantidade, 0) ?? 0;
    return (
        <div className="flex justify-between items-center h-14">
            <AnimatePresence>
                <motion.div
                    // initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.4 }}>
                    <motion.span
                        className="font-semibold text-sm flex items-center"
                        whileTap={{ x: -10, scale: 0.9 }}
                        onClick={() => router.back()}>
                        <IoIosArrowRoundBack size={20} />
                        Voltar
                    </motion.span>
                </motion.div>
            </AnimatePresence>

            {cartItemCount > 0 && (
                <Link href={'/cart'}>
                    <div className="relative cursor-pointer">
                        <HiShoppingCart size={25} />
                        <div className="text-[9px] bg-[#f97316] flex justify-center items-center rounded-full min-w-4 h-4 px-1 absolute -top-2 left-5">
                            {cartItemCount}
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
    '/orderstatus',
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
        <header className="bg-primary text-white h-14 px-3 fixed top-0 left-0 right-0 z-30 shadow-sm">
            {!isSpecialPath(pathname) && <DefaultHeader open={open} setOpen={setOpen} />}
            {isSpecialPath(pathname) && <SpecialHeader />}
            <Menu open={open} onClose={setOpen} />
        </header >
    )
}

export default Header;
