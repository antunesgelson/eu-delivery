'use client'
import Link from "next/link";
import { memo, useState } from "react";

import { IoIosArrowRoundBack } from "react-icons/io";
import { MdOutlineRestaurantMenu } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { Menu } from "./Menu";

import { AnimatePresence, motion } from "framer-motion";

import useAuth from "@/hook/useAuth";
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from "next/navigation";


type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
}
const DefaultHeader = memo(({ open, setOpen }: Props) => {
    const { data: session } = useSession()
    const { isAuthenticated } = useAuth();
    return (
        <div className="flex justify-between items-center h-14">
            <Button variant={'icon'} onClick={() => setOpen(!open)} className="-ml-4">
                <MdOutlineRestaurantMenu size={33} />
            </Button>

            {isAuthenticated && <span className="font-semibold text-lg">Olá {session?.user?.name ? session.user.name.split(' ')[0] : 'Visitante'},</span>}
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
    return (
        <AnimatePresence>
            <motion.div
                className="flex justify-between items-center h-14"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}>

                <span className="font-semibold text-lg flex items-center"
                    onClick={() => router.back()}>
                    <IoIosArrowRoundBack size={20} />
                    VOLTAR
                </span>
            </motion.div>
        </AnimatePresence>
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
    const [open, setOpen] = useState(false)

    return (
        <header className="bg-primary text-white h-14 px-4  fixed top-0 bottom-0 left-0 right-0 z-10 pb-14">
            {!isSpecialPath(pathname) && <DefaultHeader open={open} setOpen={setOpen} />}
            {isSpecialPath(pathname) && <SpecialHeader />}
            <Menu open={open} onClose={setOpen} />
        </header >
    )
}

export default Header;