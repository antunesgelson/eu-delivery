'use client'
import { useState } from "react";

import { MdOutlineRestaurantMenu } from "react-icons/md";
import { Menu } from "./Menu";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

import { IoIosArrowRoundBack } from "react-icons/io";



export default function Header() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    return (
        <header className="bg-primary text-white h-14 px-4  fixed top-0 bottom-0 left-0 right-0 z-10">

            {pathname === '/' &&
                <div className="flex justify-between items-center  h-14">
                    <Button variant={'icon'} onClick={() => setOpen(!open)}>
                        <MdOutlineRestaurantMenu size={33} />
                    </Button>
                    <span className="font-semibold text-lg">Entrar</span>
                </div>
            }

            {pathname !== '/' &&
                <AnimatePresence>
                    <motion.div
                        className="flex justify-between items-center  h-14"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4 }}>
                        <span
                            className="font-semibold text-lg flex items-center "
                            onClick={() => router.back()}>
                            <IoIosArrowRoundBack size={20}/>
                            VOLTAR
                        </span>
                    </motion.div>
                </AnimatePresence>
            }

            <Menu
                open={open}
                onClose={setOpen}
            />
        </header >
    )
}