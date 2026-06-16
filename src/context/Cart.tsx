'use client'

import { CartDTO } from "@/dto/cartDTO";
import { CupomDTO } from "@/dto/cupomDTO";
import { localConfigData } from "@/data/menu";
import React, { createContext } from "react";
import { ProdutosDTO } from "@/dto/productDTO";
import { STORE_PICKUP_ADDRESS } from "@/data/store";

type CartContextData = {
    selectedItemId: null | string;
    setSelectedItemId: (id: string) => void;
    cart: CartDTO | undefined;
    handleUpdateCart: () => void;
    addItemToCart: (produto: ProdutosDTO, quantidade: number, obs?: string) => void;
    increaseItemQuantity: (itemID: number) => void;
    removeItemFromCart: (itemID: number) => void;
    clearCart: () => void;
    choosePickupLocation: () => void;
    setCartSchedule: (dataEntrega: string) => void;
    setPaymentMethod: (formaPagamento: string) => void;
    sendLocalOrder: () => void;
    cuponsFree: CupomDTO[] | undefined;
    handleUpdateCuponsFree: () => void;
    cupom?: CupomDTO | undefined;
    handleUpdateCupom: () => void;
    configData: any;
}

export const CartContext = createContext<CartContextData>({} as CartContextData);

type CartProviderProps = {
    children: React.ReactNode

}

export function CartProvider({ children }: CartProviderProps) {
    const [selectedItemId, setSelectedItemId] = React.useState<null | string>(null);
    const [cart, setCart] = React.useState<CartDTO | undefined>(undefined);
    const cuponsFree = [] as CupomDTO[];
    const cupom = undefined as CupomDTO | undefined;
    const configData = localConfigData;
    const handleUpdateCart = () => { };
    const handleUpdateCuponsFree = () => { };
    const handleUpdateCupom = () => { };
    const getProductValue = (produto: ProdutosDTO) => Number(produto.valorPromocional > 0 ? produto.valorPromocional : produto.valor);
    const sumCartValue = (itens: CartDTO['itens']) => itens.reduce((total, item) => total + item.valor, 0);
    const buildCart = (currentCart: CartDTO | undefined, updates: Partial<CartDTO> = {}) => {
        const itens = updates.itens ?? currentCart?.itens ?? [];

        return {
            id: currentCart?.id ?? 1,
            status: currentCart?.status ?? 'local',
            itens,
            cupomId: currentCart?.cupomId ?? '',
            cashBack: currentCart?.cashBack ?? 0,
            dataEntrega: currentCart?.dataEntrega ?? null,
            endereco: currentCart?.endereco ?? {},
            obs: currentCart?.obs ?? '',
            valorTotalPedido: sumCartValue(itens),
            tipoRecebimento: currentCart?.tipoRecebimento,
            formaPagamento: currentCart?.formaPagamento,
            ...updates,
        } as CartDTO;
    };

    const addItemToCart = (produto: ProdutosDTO, quantidade: number, obs = '') => {
        const productValue = getProductValue(produto);
        const itemValue = productValue * quantidade;

        setCart((currentCart) => {
            const currentItems = currentCart?.itens ?? [];
            const nextItemId = currentItems.length > 0
                ? Math.max(...currentItems.map((item) => item.id)) + 1
                : 1;
            const nextItems = [
                ...currentItems,
                {
                    id: nextItemId,
                    adicionais: [],
                    ingredientes: produto.ingredientes,
                    obs,
                    quantidade,
                    valor: itemValue,
                    valorAdicionais: 0,
                    produto,
                },
            ];
            const valorTotalPedido = sumCartValue(nextItems);

            return buildCart(currentCart, {
                itens: nextItems,
                valorTotalPedido,
            });
        });
    };
    const increaseItemQuantity = (itemID: number) => {
        setCart((currentCart) => {
            if (!currentCart) {
                return currentCart;
            }

            const nextItems = currentCart.itens.map((item) => {
                if (item.id !== itemID) {
                    return item;
                }

                const quantidade = item.quantidade + 1;
                return {
                    ...item,
                    quantidade,
                    valor: getProductValue(item.produto) * quantidade + item.valorAdicionais,
                };
            });

            return buildCart(currentCart, {
                itens: nextItems,
                valorTotalPedido: sumCartValue(nextItems),
            });
        });
    };
    const removeItemFromCart = (itemID: number) => {
        setCart((currentCart) => {
            if (!currentCart) {
                return currentCart;
            }

            const nextItems = currentCart.itens.filter((item) => item.id !== itemID);

            return buildCart(currentCart, {
                itens: nextItems,
                valorTotalPedido: sumCartValue(nextItems),
            });
        });
    };
    const clearCart = () => {
        setCart((currentCart) => {
            if (!currentCart) {
                return currentCart;
            }

            return buildCart(currentCart, {
                itens: [],
                valorTotalPedido: 0,
            });
        });
    };
    const choosePickupLocation = () => {
        setCart((currentCart) => buildCart(currentCart, {
            endereco: STORE_PICKUP_ADDRESS,
            tipoRecebimento: 'pickup',
        }));
    };
    const setCartSchedule = (dataEntrega: string) => {
        setCart((currentCart) => buildCart(currentCart, {
            dataEntrega,
        }));
    };
    const setPaymentMethod = (formaPagamento: string) => {
        setCart((currentCart) => buildCart(currentCart, {
            formaPagamento,
        }));
    };
    const sendLocalOrder = () => {
        setCart((currentCart) => buildCart(currentCart, {
            status: 'Pedido recebido',
        }));
    };

    return (
        <CartContext.Provider value={{
            selectedItemId,
            setSelectedItemId,
            cart,
            handleUpdateCart,
            addItemToCart,
            increaseItemQuantity,
            removeItemFromCart,
            clearCart,
            choosePickupLocation,
            setCartSchedule,
            setPaymentMethod,
            sendLocalOrder,
            cuponsFree,
            handleUpdateCuponsFree,
            cupom,
            handleUpdateCupom,
            configData
        }}>
            {children}
        </CartContext.Provider>
    )
}
