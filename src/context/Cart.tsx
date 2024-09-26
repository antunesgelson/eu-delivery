'use client'

import { CartDTO } from "@/dto/cartDTO";
import { api } from "@/service/api";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import React, { createContext } from "react";
import { toast } from "sonner";

type CartContextData = {
    selectedItemId: null | string;
    setSelectedItemId: (id: string) => void;
    cart: CartDTO | undefined;
    handleUpdateCart: () => void;
}

export const CartContext = createContext<CartContextData>({} as CartContextData);

type CartProviderProps = {
    children: React.ReactNode

}

export function CartProvider({ children }: CartProviderProps) {
    const [selectedItemId, setSelectedItemId] = React.useState<null | string>(null);

    const { data: cart, refetch: handleUpdateCart } = useQuery({
        queryKey: ['list-cart-details'],
        queryFn: async () => {
            try {
                const { data } = await api.get<CartDTO>('/pedido/carrinho')
                return data
            } catch (error: unknown) {
                console.log(error)
                if (error instanceof AxiosError && error.response) {
                    toast.error(error.response.data.message)
                } else {
                    toast.error('An unexpected error occurred')
                }
            }
        },
    });

    React.useEffect(() => {
        console.log('cart', cart)
    }, [cart]);

    return (
        <CartContext.Provider value={{
            selectedItemId,
            setSelectedItemId,
            cart,
            handleUpdateCart
        }}>
            {children}
        </CartContext.Provider>
    )
}