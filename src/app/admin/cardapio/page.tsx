'use client'
import React from "react";
import { toast } from "sonner";

import MenuProfile from "@/components/MenuProfile";
import Ingredients from "./components/Ingredients";
import Products from "./components/Products/[cateogireID]";
import EditProduct from "./components/Products/Edit";

import { CardapioDTO } from "@/dto/cardapioDTO";
import { CategoriaDTO } from "@/dto/categoriaDTO";
import { api } from "@/service/api";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";


export default function Menu() {
    const [menu, setMenu] = React.useState('ingredients')
    const [selectedCategory, setSelectedCategory] = React.useState<CategoriaDTO>({} as CategoriaDTO);
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
        <div className="flex justify-between ">
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
                        category={selectedCategory}
                        setMenu={setMenu}
                    />
                )}
                {menu === 'ingredients' && <Ingredients />}
            </div>
        </div>
    )
}