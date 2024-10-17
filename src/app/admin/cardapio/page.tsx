'use client'
import React from "react";

import MenuProfile from "@/components/MenuProfile";
import { CardapioDTO } from "@/dto/cardapioDTO";
import { api } from "@/service/api";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import Ingredients from "./components/Ingredients";
import Products from "./components/Products/[cateogireID]";
import EditProduct from "./components/Products/Edit";


export default function Menu() {
    const [menu, setMenu] = React.useState('ingredients')
    const [selectedCategory, setSelectedCategory] = React.useState<{ id: string, name: string } | null>(null);
    const [productID, setProductID] = React.useState<number | null>(null)

    const { data: cardapio, refetch: handleUpdateCategory } = useQuery({
        queryKey: ['list-categories-details'],
        queryFn: async () => {
            try {
                const { data } = await api.get<CardapioDTO[]>('/categoria/lista/detalhes')
                return data
            } catch (error: unknown) {
                if (error instanceof AxiosError && error.response) {
                    toast.error(error.response.data.message)

                } else {
                    toast.error('Erro inesperado, tente novamente mais tarde.')
                }
            }
        },
    });
    
    return (
        <div className="flex justify-between px-2">
            <MenuProfile
                setMenu={setMenu}
                setSelectedCategory={setSelectedCategory}
                productID={productID}
                setProductID={setProductID}
                handleUpdateCategory={handleUpdateCategory}
                cardapio={cardapio}
            />
            <div className=" w-full dark:bg-dark-300 ">
                {menu === 'products' && selectedCategory && (
                    <Products
                        category={selectedCategory}
                        setMenu={setMenu}
                        handleUpdateCategory={handleUpdateCategory}
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