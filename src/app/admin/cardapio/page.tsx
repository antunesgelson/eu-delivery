'use client'
import React from "react";

import MenuProfile from "@/components/MenuProfile";
import Ingredients from "./components/Ingredients";
import Products from "./components/Products/[cateogireID]";
import EditProduct from "./components/Products/Edit";


export default function Menu() {
    const [menu, setMenu] = React.useState('ingredients')
    const [selectedCategory, setSelectedCategory] = React.useState<{ id: string, name: string } | null>(null);
    const [productID, setProductID] = React.useState<number | null>(null)

    return (
        <div className="flex justify-between px-2">
            <MenuProfile
                setMenu={setMenu}
                setSelectedCategory={setSelectedCategory}
                productID={productID}
                setProductID={setProductID}
            />
            <div className=" w-full dark:bg-dark-300 ">
                {menu === 'products' && selectedCategory && (
                    <Products
                        category={selectedCategory}
                        setMenu={setMenu}
                    />
                )}

                {menu === 'edit-products' && productID && (
                    <EditProduct
                        productID={productID}
                        setMenu={setMenu}
                    />
                )}
                {menu === 'ingredients' && <Ingredients />}
            </div>
        </div>
    )
}