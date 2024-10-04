'use client'
import AddIngredients from "@/components/AddIngredients";
import MenuProfile from "@/components/MenuProfile";
import React from "react";
import Products from "./components/Products/[cateogireID]";


export default function Menu() {
    const [menu, setMenu] = React.useState('ingredients')
    const [selectedCategory, setSelectedCategory] = React.useState<{ id: string, name: string } | null>(null);

    return (
        <div className="flex justify-between px-2">
            <MenuProfile
                setMenu={setMenu}
                setSelectedCategory={setSelectedCategory}
            />
            <div className=" w-full dark:bg-dark-300 ">
                {menu === 'products' && selectedCategory && (
                    <Products
                        category={selectedCategory}
                        setMenu={setMenu}
                    />
                )}
                {menu === 'ingredients' && <AddIngredients />}
            </div>
        </div>
    )
}