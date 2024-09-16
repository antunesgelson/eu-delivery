'use client'
import AddIngredients from "@/components/AddIngredients";
import AddProducts from "@/components/AddProducts";
import MenuProfile from "@/components/MenuProfile";
import { Button } from "@/components/ui/button";
import { useState } from "react";

import { MdOutlineAddCircle } from "react-icons/md";

export default function Menu() {
    const [menu, setMenu] = useState('products')
    return (
        <div>
            <div className="flex justify-between px-2">
                <MenuProfile />
                <div className=" w-full dark:bg-dark-300">
                    <div className="flex justify-start w-full items-center gap-2 p-2">
                        <Button
                            className="flex items-center gap-1 rounded-full"
                            variant={'outline'}>
                            <MdOutlineAddCircle size={15} />
                            Categoria
                        </Button>
                        <Button
                            onClick={() => setMenu('products')}
                            className="flex items-center gap-1 rounded-full"
                            variant={'outline'}>
                            <MdOutlineAddCircle size={15} />
                            Produto
                        </Button>
                        <Button
                            onClick={() => setMenu('ingredients')}
                            className="flex items-center gap-1 rounded-full "
                            variant={'outline'}>
                            <MdOutlineAddCircle size={15} />
                            Ingrediente
                        </Button>
                    </div>


                    {menu === 'products' && <AddProducts />}
                    {menu === 'ingredients' && <AddIngredients />}
                </div>
            </div>
        </div>
    )
}