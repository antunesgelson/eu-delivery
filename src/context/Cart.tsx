'use client'

import { CartDTO } from "@/dto/cartDTO";
import { CupomDTO } from "@/dto/cupomDTO";
import useAuth from "@/hook/useAuth";
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
    cuponsFree: CupomDTO[] | undefined;
    handleUpdateCuponsFree: () => void;
    cupom?: CupomDTO | undefined;
    handleUpdateCupom: () => void;
}

export const CartContext = createContext<CartContextData>({} as CartContextData);

type CartProviderProps = {
    children: React.ReactNode

}

export function CartProvider({ children }: CartProviderProps) {
    const { isAuthenticated } = useAuth()
    const [selectedItemId, setSelectedItemId] = React.useState<null | string>(null);

    const { data: cart, refetch: handleUpdateCart } = useQuery({
        queryKey: ['list-cart-details'],
        queryFn: async () => {
            try {
                const { data } = await api.get<CartDTO>('/pedido/carrinho')
                return data
            } catch (error: unknown) {
                if (error instanceof AxiosError && error.response) {
                    // toast.error(error.response.data.message)
                    console.log('error ->', console.log(error.response.data.message))

                } else {
                    console.log('error ->', console.log(error))
                    toast.error('Erro inesperado, tente novamente mais tarde.')
                }
            }
        }, enabled: !!isAuthenticated
    });

    const { data: cupom, refetch: handleUpdateCupom } = useQuery({
        queryKey: ['list-cupom-id', cart?.cupomId],
        queryFn: async () => {
            try {
                const { data } = await api.get<CupomDTO>(`/cupom/${cart?.cupomId}`)
                return data
            } catch (error: unknown) {
                console.log(error)
                if (error instanceof AxiosError && error.response) {
                    toast.error(error.response.data.message)
                } else {
                    toast.error('Erro inesperado, tente novamente mais tarde.')
                }
            }
        }, enabled: !!cart?.cupomId
    })



    const { data: cuponsFree, refetch: handleUpdateCuponsFree } = useQuery({
        queryKey: ['list-cupons-free'],
        queryFn: async () => {
            try {
                const { data } = await api.get<CupomDTO[]>('/cupom/free')
                return data
            } catch (error: unknown) {
                console.error(error)
                throw error
            }
        }, enabled: !!isAuthenticated
    })

    React.useEffect(() => {
        console.log('cart', cart)
    }, [cart]);

    return (
        <CartContext.Provider value={{
            selectedItemId,
            setSelectedItemId,
            cart,
            handleUpdateCart,
            cuponsFree,
            handleUpdateCuponsFree,
            cupom,
            handleUpdateCupom
        }}>
            {children}
        </CartContext.Provider>
    )
}