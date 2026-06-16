'use client'

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { localCardapio } from "@/data/menu";
import { ProdutosDTO } from "@/dto/productDTO";
import useCart from "@/hook/useCart";

import Thumb from "@/assets/products/box.png";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoAdd, IoChevronBack } from "react-icons/io5";
import { PiTrash } from "react-icons/pi";

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function getProductValue(produto: ProdutosDTO) {
    return Number(produto.valorPromocional > 0 ? produto.valorPromocional : produto.valor);
}

export default function CartPage() {
    const router = useRouter();
    const {
        cart,
        addItemToCart,
        increaseItemQuantity,
        removeItemFromCart,
        clearCart,
    } = useCart();
    const itens = React.useMemo(() => cart?.itens ?? [], [cart?.itens]);
    const hasItems = itens.length > 0;
    const allProducts = React.useMemo(() => localCardapio.flatMap((categoria) => categoria.produtos), []);
    const productsInCart = React.useMemo(() => new Set(itens.map((item) => item.produto.id)), [itens]);
    const recommendedProducts = React.useMemo(() => {
        const productsOutsideCart = allProducts.filter((produto) => !productsInCart.has(produto.id));
        return (productsOutsideCart.length > 0 ? productsOutsideCart : allProducts).slice(0, 6);
    }, [allProducts, productsInCart]);
    const total = cart?.valorTotalPedido ?? 0;

    const handleAddSuggestedProduct = (produto: ProdutosDTO) => {
        addItemToCart(produto, 1);
        toast.success('Produto adicionado ao carrinho.');
    };

    return (
        <main className="mt-14 min-h-screen bg-[#f7f7f7] pb-24">
            <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-[430px] bg-white">
                <header className="sticky top-14 z-20 flex h-12 items-center justify-between border-b bg-white px-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        aria-label="Voltar"
                        className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-dark-800"
                    >
                        <IoChevronBack size={22} />
                    </button>
                    <h1 className="text-[15px] font-extrabold text-dark-800">Carrinho</h1>
                    <button
                        type="button"
                        onClick={clearCart}
                        disabled={!hasItems}
                        className="flex h-10 items-center gap-1 rounded-md px-1 text-[12px] font-extrabold text-red-600 disabled:opacity-35"
                    >
                        <PiTrash size={17} />
                        Limpar
                    </button>
                </header>

                <section className="bg-white px-4 py-3">
                    {!hasItems && (
                        <div className="flex min-h-[92px] flex-col items-center justify-center text-center">
                            <strong className="text-[15px] text-dark-800">Seu carrinho está vazio</strong>
                            <span className="mt-1 text-[12px] text-dark-500">Adicione um assado para continuar seu pedido.</span>
                        </div>
                    )}

                    {itens.map((item) => (
                        <article key={item.id} className="flex items-start gap-3 py-2">
                            <Image
                                src={Thumb}
                                alt={item.produto.titulo}
                                width={64}
                                height={64}
                                className="h-14 w-14 shrink-0 rounded-md object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <h2 className="line-clamp-2 text-[13px] font-extrabold leading-4 text-dark-900">
                                    {item.quantidade}x {item.produto.titulo}
                                </h2>
                                <strong className="mt-1 block text-[13px] font-extrabold text-[#f97316]">
                                    {formatCurrency(item.valor)}
                                </strong>
                                {item.obs && (
                                    <p className="mt-1 line-clamp-2 text-[11px] italic leading-4 text-dark-500">
                                        Obs: {item.obs}
                                    </p>
                                )}
                            </div>
                            <div className="flex h-9 shrink-0 items-center rounded-md border border-neutral-200 bg-white text-dark-800">
                                <button
                                    type="button"
                                    onClick={() => removeItemFromCart(item.id)}
                                    aria-label={`Remover ${item.produto.titulo}`}
                                    className="flex h-9 w-9 items-center justify-center text-dark-500"
                                >
                                    <PiTrash size={18} />
                                </button>
                                <span className="w-6 text-center text-[13px] font-bold">{item.quantidade}</span>
                                <button
                                    type="button"
                                    onClick={() => increaseItemQuantity(item.id)}
                                    aria-label={`Adicionar mais ${item.produto.titulo}`}
                                    className="flex h-9 w-9 items-center justify-center text-[#f97316]"
                                >
                                    <IoAdd size={23} />
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="bg-[#eeeeee] px-4 py-4">
                    <h2 className="mb-3 text-[17px] font-extrabold text-dark-800">Peça também</h2>
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {recommendedProducts.map((produto) => (
                                <CarouselItem key={produto.id} className="basis-[31%]">
                                    <article className="min-w-0">
                                        <div className="relative h-[88px] overflow-hidden rounded-md bg-white">
                                            <Image
                                                src={Thumb}
                                                alt={produto.titulo}
                                                width={112}
                                                height={94}
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleAddSuggestedProduct(produto)}
                                                aria-label={`Adicionar ${produto.titulo}`}
                                                className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#f97316] text-white shadow-sm"
                                            >
                                                <IoAdd size={22} />
                                            </button>
                                        </div>
                                        <h3 className="mt-1 line-clamp-3 min-h-[42px] text-[12px] font-extrabold leading-[14px] text-dark-800">
                                            {produto.titulo}
                                        </h3>
                                        <strong className="block text-[12px] font-extrabold leading-4 text-[#f97316]">
                                            {formatCurrency(getProductValue(produto))}
                                        </strong>
                                    </article>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>

                    <Button
                        asChild
                        variant="outline"
                        className="mt-4 h-10 w-full border-[#f97316] bg-white text-[13px] font-extrabold text-[#c65a10] hover:bg-[#fff4ec]"
                    >
                        <Link href="/">Adicionar mais produtos</Link>
                    </Button>
                </section>
            </div>

            <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 px-3 py-2 backdrop-blur">
                <div className="mx-auto max-w-[430px]">
                    <Button
                        asChild
                        variant="success"
                        className="flex h-12 w-full justify-between p-2 text-lg"
                    >
                        <Link href={hasItems ? "/checkout" : "/"}>
                            <span className="ml-3 flex items-center gap-2">
                                <IoMdCheckmarkCircleOutline size={25} />
                                {hasItems ? 'Avançar' : 'Adicionar produtos'}
                            </span>
                            <strong className="rounded-lg bg-white p-1 text-base font-bold text-primary">
                                {formatCurrency(total)}
                            </strong>
                        </Link>
                    </Button>
                </div>
            </footer>
        </main>
    );
}
