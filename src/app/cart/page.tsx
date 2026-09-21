'use client'

import { observacaoDoItem } from "@/lib/item-observacao";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { useCardapio } from "@/hook/useLoja";
import {useBeneficios} from "@/hook/useLoja";
import { ProdutosDTO } from "@/dto/productDTO";
import useCart from "@/hook/useCart";

import Thumb from "@/assets/products/box.png";
import { FaPiggyBank } from "react-icons/fa";
import { HiTicket } from "react-icons/hi2";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoAdd, IoChevronBack, IoClose } from "react-icons/io5";
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
    const {cashbackBalance}=useBeneficios();
    const {
        cart, isLoading, isError, handleUpdateCart, isPending,
        addItemToCart,
        increaseItemQuantity,
        removeItemFromCart,
        clearCart,
        cupom,
        removeCoupon,
        setCashbackUsage,
    } = useCart();
    const itens = React.useMemo(() => cart?.itens ?? [], [cart?.itens]);
    const hasItems = itens.length > 0;
    const allProducts = (useCardapio().data??[]).flatMap((categoria)=>categoria.produtos);
    const productsInCart = React.useMemo(() => new Set(itens.map((item) => item.produto.id)), [itens]);
    const recommendedProducts = React.useMemo(() => {
        const productsOutsideCart = allProducts.filter((produto) => !productsInCart.has(produto.id));
        return (productsOutsideCart.length > 0 ? productsOutsideCart : allProducts).slice(0, 6);
    }, [allProducts, productsInCart]);
    const total = cart?.valorTotalPedido ?? 0;
    const couponDiscount = cart?.descontoCupom ?? 0;
    const totalAfterCoupon = Math.max(total - couponDiscount, 0);
    const maxCashbackForOrder = Math.min(cashbackBalance, totalAfterCoupon);
    const selectedCashback = Math.min(cart?.cashBack ?? 0, maxCashbackForOrder);
    const isUsingCashback = selectedCashback > 0;
    const hasCoupon = !!cupom;
    const finalTotal=cart?.valorFinal??0;
    const itemCount = itens.reduce((sum, item) => sum + item.quantidade, 0);



    const handleAddSuggestedProduct = async(produto: ProdutosDTO) => {
        try{await addItemToCart(produto, 1);}catch{return;}
        toast.success('Produto adicionado ao carrinho.');
    };

    const handleCashbackToggle = (checked: boolean) => {
        void setCashbackUsage(checked ? maxCashbackForOrder : 0).catch(()=>{});
    };

    const handleChooseCoupon = () => {
        router.push('/cupom');
    };

    if (isLoading) return <main className="mt-16 p-4" role="status">Carregando carrinho…</main>;
    if (isError) return <main className="mt-16 p-4" role="alert">Não foi possível carregar o carrinho. <Button onClick={handleUpdateCart}>Tentar novamente</Button></main>;

    return (
        <main className="mt-14 min-h-screen bg-[#f7f7f7] pb-24">
            <div className="mx-auto max-w-[430px]">
                <section className="bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            aria-label="Voltar"
                            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-dark-800"
                        >
                            <IoChevronBack size={22} />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-[20px] font-extrabold leading-6 text-dark-900">Carrinho</h1>
                            <p className="mt-0.5 text-[12px] leading-4 text-dark-500">Revise seu pedido antes de continuar.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { void clearCart().catch(() => {}); }}
                            disabled={!hasItems || isPending}
                            className="flex h-9 shrink-0 items-center gap-1 rounded-md px-2 text-[12px] font-extrabold text-red-600 disabled:opacity-35"
                        >
                            <PiTrash size={16} />
                            Limpar
                        </button>
                    </div>

                    {hasItems && (
                        <div className="mt-4 rounded-md bg-[#111111] px-3 py-3 text-white">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <span className="block text-[11px] font-extrabold uppercase text-white/60">Total do carrinho</span>
                                    <strong className="mt-0.5 block text-[20px] leading-6">{formatCurrency(finalTotal)}</strong>
                                    {couponDiscount > 0 && (
                                        <span className="mt-0.5 block text-[11px] font-semibold text-white/55">
                                            Subtotal {formatCurrency(total)}
                                        </span>
                                    )}
                                </div>
                                <span className="rounded-full bg-[#f97316] px-3 py-1 text-[11px] font-extrabold">
                                    {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                                </span>
                            </div>

                            <div className="mt-3 border-t border-white/10 pt-3">
                                {couponDiscount > 0 && (
                                    <div className="flex items-center justify-between gap-2 text-[12px]">
                                        <span className="text-white/65">Cupom {cupom?.nome}</span>
                                        <strong className="text-emerald-300">- {formatCurrency(couponDiscount)}</strong>
                                    </div>
                                )}
                                {hasCoupon && couponDiscount === 0 && (
                                    <div className="flex items-center justify-between gap-2 text-[12px]">
                                        <span className="text-white/65">Cupom {cupom?.nome}</span>
                                        <strong className="text-white/80">Abaixo do mínimo</strong>
                                    </div>
                                )}
                                {isUsingCashback && (
                                    <div className="mt-1 flex items-center justify-between gap-2 text-[12px]">
                                        <span className="text-white/65">Cashback usado</span>
                                        <strong className="text-[#f97316]">- {formatCurrency(selectedCashback)}</strong>
                                    </div>
                                )}
                                {!hasCoupon && !isUsingCashback && (
                                    <div className="flex items-center justify-between gap-2 text-[12px]">
                                        <span className="text-white/65">Benefícios</span>
                                        <strong className="text-white/80">Disponíveis abaixo</strong>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                <section className="px-4 py-4">
                    <h2 className="mb-3 text-[17px] font-extrabold text-dark-800">Itens do pedido</h2>

                    {!hasItems && (
                        <div className="flex min-h-[120px] flex-col items-center justify-center rounded-md bg-white p-5 text-center shadow-sm">
                            <strong className="text-[15px] text-dark-800">Seu carrinho está vazio</strong>
                            <span className="mt-1 text-[12px] text-dark-500">Adicione um assado para continuar seu pedido.</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        {itens.map((item) => (
                            <article key={item.id} className="rounded-md bg-white p-3 shadow-sm">
                                <div className="grid grid-cols-[64px_1fr] gap-3">
                                    <Image
                                        src={Thumb}
                                        alt={item.produto.titulo}
                                        width={64}
                                        height={64}
                                        className="h-16 w-16 shrink-0 rounded-md object-cover"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="line-clamp-2 text-[13px] font-extrabold uppercase leading-4 text-dark-900">
                                            {item.produto.titulo}
                                        </h3>
                                        <p className="mt-1 text-[12px] font-semibold leading-4 text-dark-500">
                                            Quantidade: {item.quantidade}
                                        </p>
                                        {observacaoDoItem(item) && (
                                            <p className="mt-1 text-[11px] italic leading-4 text-dark-500">
                                                {observacaoDoItem(item)}
                                            </p>
                                        )}
                                        <strong className="mt-2 block text-[14px] font-extrabold text-[#f97316]">
                                            {formatCurrency(item.valor)}
                                        </strong>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t pt-3">
                                    <button
                                        type="button"
                                        onClick={() => { void removeItemFromCart(item.id).catch(() => {}); }}
                                        className="flex h-9 items-center gap-1 rounded-md px-1 text-[12px] font-extrabold text-red-600"
                                    >
                                        <PiTrash size={16} />
                                        Remover
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { void increaseItemQuantity(item.id).catch(() => {}); }}
                                        className="flex h-9 items-center gap-1 rounded-md bg-[#fff7f1] px-3 text-[12px] font-extrabold text-[#f97316]"
                                    >
                                        <IoAdd size={19} />
                                        Adicionar +1
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {hasItems && (
                    <section className="px-4 pb-4">
                        <div className="mb-3">
                            <h2 className="text-[17px] font-extrabold text-dark-800">Benefícios</h2>
                            <p className="mt-0.5 text-[12px] leading-4 text-dark-500">
                                Escolha entre cupom ou cashback. Eles não acumulam neste pedido.
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-md bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 p-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff7f1] text-[#f97316]">
                                        <HiTicket size={20} />
                                    </div>
                                    <div className="min-w-0 leading-4">
                                        <span className="block text-[13px] font-extrabold text-dark-900">Cupom de desconto</span>
                                        <p className="mt-0.5 text-[12px] leading-4 text-dark-500">
                                            {hasCoupon
                                                ? couponDiscount > 0
                                                    ? `${cupom.nome} aplicado: - ${formatCurrency(couponDiscount)}`
                                                    : `${cupom.nome}: pedido abaixo do valor mínimo`
                                                : isUsingCashback
                                                    ? 'Troque o cashback por um cupom, se preferir.'
                                                    : 'Escolha um cupom disponível para este pedido.'}
                                        </p>
                                    </div>
                                </div>

                                {hasCoupon ? (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try { await removeCoupon(); toast.success('Cupom removido.'); } catch {}
                                        }}
                                        aria-label="Remover cupom"
                                        disabled={isPending}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7f7f7] text-dark-700"
                                    >
                                        <IoClose size={21} />
                                    </button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleChooseCoupon}
                                        disabled={isPending}
                                        className="h-9 shrink-0 px-3 text-[12px] font-extrabold"
                                    >
                                        {isUsingCashback ? 'Trocar' : 'Escolher'}
                                    </Button>
                                )}
                            </div>

                            <div className="border-t p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff7f1] text-[#f97316]">
                                            <FaPiggyBank size={21} />
                                        </div>
                                        <div className="min-w-0 leading-4">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-[13px] font-extrabold text-dark-900">Cashback disponível</span>
                                                <span className="rounded-full bg-[#fff7f1] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#f97316]">
                                                    {formatCurrency(cashbackBalance)}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-[12px] leading-4 text-dark-500">
                                                {isUsingCashback
                                                    ? `Você está usando ${formatCurrency(selectedCashback)} neste pedido.`
                                                    : hasCoupon
                                                        ? 'Remova o cupom para usar cashback.'
                                                        : 'Ative para abater seu saldo neste pedido.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <Switch
                                            aria-label="Utilizar cashback"
                                            checked={isUsingCashback}
                                            disabled={isPending || hasCoupon || maxCashbackForOrder <= 0}
                                            onCheckedChange={handleCashbackToggle}
                                        />
                                        <span className="text-[10px] font-bold uppercase text-dark-500">Usar</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <section className="bg-white px-4 py-4 shadow-sm">
                    <div className="mb-3">
                        <h2 className="text-[17px] font-extrabold text-dark-800">Peça também</h2>
                        <p className="mt-0.5 text-[12px] leading-4 text-dark-500">Itens que combinam com seu pedido.</p>
                    </div>
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {recommendedProducts.map((produto) => (
                                <CarouselItem key={produto.id} className="basis-[32%]">
                                    <article className="min-w-0">
                                        <div className="relative h-[88px] overflow-hidden rounded-md bg-[#f7f7f7]">
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
                        className="flex h-12 w-full justify-between p-2 text-[15px]"
                    >
                        <Link href={hasItems ? "/checkout" : "/"}>
                            <span className="ml-3 flex items-center gap-2">
                                <IoMdCheckmarkCircleOutline size={23} />
                                {hasItems ? 'Continuar para checkout' : 'Adicionar produtos'}
                            </span>
                            <strong className="rounded-lg bg-white p-1 text-base font-bold text-primary">
                                {formatCurrency(finalTotal)}
                            </strong>
                        </Link>
                    </Button>
                </div>
            </footer>
        </main>
    );
}
