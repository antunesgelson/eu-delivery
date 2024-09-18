'use client'
import AddIngredients from "@/components/AddIngredients";
import MenuProfile from "@/components/MenuProfile";
import { useState } from "react";
import Products from "../menu/components/Products";


export default function Menu() {
    const [menu, setMenu] = useState('products')
    return (
        <div className="flex justify-between px-2">
            <MenuProfile />
            <div className=" w-full dark:bg-dark-300 ">
                {menu === 'products' && <Products />}
                {menu === 'ingredients' && <AddIngredients />}
            </div>
        </div>
    )
}