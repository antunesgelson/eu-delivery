'use client'

import { createContext, useState } from "react";

type CartContextData = {
    selectedItemId: null | string;
    setSelectedItemId: (id: string) => void;
}

export const CartContext = createContext<CartContextData>({} as CartContextData);

type CartProviderProps = {
    children: React.ReactNode

}

export function CartProvider({ children }: CartProviderProps) {
    const [selectedItemId, setSelectedItemId] = useState<null | string>(null);

    return (
        <CartContext.Provider value={{
            selectedItemId,
            setSelectedItemId
        }}>
            {children}
        </CartContext.Provider>
    )
}