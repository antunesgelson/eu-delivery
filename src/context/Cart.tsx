'use client'

import { CartDTO } from "@/dto/cartDTO";
import { CupomDTO } from "@/dto/cupomDTO";
import { localCoupons } from "@/data/coupons";
import { localConfigData } from "@/data/menu";
import React, { createContext } from "react";
import { ProdutosDTO } from "@/dto/productDTO";
import { STORE_PICKUP_ADDRESS } from "@/data/store";
import {
    ADMIN_CATEGORIES_STORAGE_KEY,
    buildInitialAdminCategories,
    consumeCartStock,
    hydrateAdminCategories,
} from "@/lib/menu-stock";

type SendLocalOrderResult = {
    ok: boolean;
    errors: string[];
}

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
    setCashbackUsage: (cashBack: number) => void;
    sendLocalOrder: () => SendLocalOrderResult;
    cuponsFree: CupomDTO[] | undefined;
    handleUpdateCuponsFree: () => void;
    cupom?: CupomDTO | undefined;
    handleUpdateCupom: () => void;
    applyCoupon: (cupom: CupomDTO) => void;
    removeCoupon: () => void;
    configData: any;
}

export const CartContext = createContext<CartContextData>({} as CartContextData);

type CartProviderProps = {
    children: React.ReactNode

}

export function CartProvider({ children }: CartProviderProps) {
    const [selectedItemId, setSelectedItemId] = React.useState<null | string>(null);
    const [cart, setCart] = React.useState<CartDTO | undefined>(undefined);
    const [cupom, setCupom] = React.useState<CupomDTO | undefined>(undefined);
    const cuponsFree = localCoupons;
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
                cashBack: nextItems.length > 0 ? currentCart.cashBack : 0,
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
                cashBack: nextItems.length > 0 ? currentCart.cashBack : 0,
                cupomId: nextItems.length > 0 ? currentCart.cupomId : '',
                valorTotalPedido: sumCartValue(nextItems),
            });
        });
    };
    const clearCart = () => {
        setCupom(undefined);
        setCart((currentCart) => {
            if (!currentCart) {
                return currentCart;
            }

            return buildCart(currentCart, {
                itens: [],
                cashBack: 0,
                cupomId: '',
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
    const setCashbackUsage = (cashBack: number) => {
        setCart((currentCart) => buildCart(currentCart, {
            cashBack,
        }));
    };
    const applyCoupon = (coupon: CupomDTO) => {
        setCupom(coupon);
        setCart((currentCart) => buildCart(currentCart, {
            cupomId: coupon.id,
            cashBack: 0,
        }));
    };
    const removeCoupon = () => {
        setCupom(undefined);
        setCart((currentCart) => buildCart(currentCart, {
            cupomId: '',
        }));
    };
    const sendLocalOrder = () => {
        if (!cart || cart.itens.length === 0) {
            return {
                ok: false,
                errors: ['Adicione produtos ao carrinho antes de enviar o pedido.'],
            };
        }

        let adminCategories = buildInitialAdminCategories();

        try {
            const storedCategories = window.localStorage.getItem(ADMIN_CATEGORIES_STORAGE_KEY);

            if (storedCategories) {
                const parsedCategories = JSON.parse(storedCategories);

                if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
                    adminCategories = hydrateAdminCategories(parsedCategories);
                }
            }
        } catch {
            adminCategories = buildInitialAdminCategories();
        }

        const stockResult = consumeCartStock(adminCategories, cart.itens, cart.dataEntrega);

        if (!stockResult.ok) {
            return {
                ok: false,
                errors: stockResult.errors,
            };
        }

        try {
            window.localStorage.setItem(ADMIN_CATEGORIES_STORAGE_KEY, JSON.stringify(stockResult.nextCategories));
        } catch {
            return {
                ok: false,
                errors: ['Não foi possível atualizar o estoque neste navegador.'],
            };
        }

        setCart((currentCart) => buildCart(currentCart, {
            status: 'Pedido recebido',
        }));

        return {
            ok: true,
            errors: [],
        };
    };

    React.useEffect(() => {
        if (cart && cart.itens.length === 0 && cupom) {
            setCupom(undefined);
        }
    }, [cart, cupom]);

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
            setCashbackUsage,
            sendLocalOrder,
            cuponsFree,
            handleUpdateCuponsFree,
            cupom,
            handleUpdateCupom,
            applyCoupon,
            removeCoupon,
            configData
        }}>
            {children}
        </CartContext.Provider>
    )
}
