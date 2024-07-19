'use client'
import { useState } from "react";

import { MdOutlineRestaurantMenu } from "react-icons/md";
import { Menu } from "./Menu";

import { Button } from "@/components/ui/button";



export default function Header() {
    const [open, setOpen] = useState(false)
    return (
        <header  className="bg-primary text-white h-14 px-4 flex justify-between items-center fixed top-0 bottom-0 left-0 right-0 z-10">
            <Button variant={'icon'} onClick={() => setOpen(!open)}>
                <MdOutlineRestaurantMenu size={33} />
            </Button>
            <span className="font-semibold text-lg">Entrar</span>

            <Menu
                open={open}
                onClose={setOpen}
            />
        </header>
    )
}