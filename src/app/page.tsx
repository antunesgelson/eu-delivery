'use client'
import React from "react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Banner from "@/components/Banner";
import Navegation from "@/components/Navegation";
import OrderSummaryBar from "@/components/OrderSummaryBar";
import ProductCard from "@/components/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { toast } from "sonner";

import { CardapioDTO } from "@/dto/cardapioDTO";
import { localCardapio } from "@/data/menu";

import useCart from "@/hook/useCart";
import { FaGift, FaHome, FaRegClock } from "react-icons/fa";
import { FaStore } from "react-icons/fa6";
import { HiShoppingCart } from "react-icons/hi";
import Link from "next/link";

type Props = {
  searchParams?: { firstLogin?: string }
}

export default function Home({ searchParams }: Props) {
  const router = useRouter();
  const { data: session } = useSession()
  const { cart } = useCart();
  const userName = session?.user?.name ? session?.user?.name : 'Visitante'
  const cardapio = localCardapio;
  const featuredProducts = cardapio.flatMap((categoria) => categoria.produtos).slice(0, 4);
  const cartItemCount = cart?.itens.reduce((total, item) => total + item.quantidade, 0) ?? 0;


  React.useEffect(() => {
    if (searchParams?.firstLogin) {
      setTimeout(() => {
        toast.success(`Bem-Vindo(a) ${userName} 🥰`, {
          description: "Estamos felizes em tê-lo conosco! Para aproveitar ao máximo nossos serviços, conecte-se ao Google Calendário e receba notificações de entrega diretamente em sua agenda.",
          descriptionClassName: 'text-muted-foreground text-[11px]',
          actionButtonStyle: { backgroundColor: '#141414', color: '#fff' },
          duration: 9000, // Duração da notificação em milissegundos
          action: {
            label: 'Ok!',
            onClick: () => {
              // Remover o parâmetro ?firstLogin=true da URL
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('firstLogin');
              router.replace(newUrl.toString());
            },
          },
        });
      }, 50);
    }
  }, [searchParams, session, router, userName]);

  return (
    <main className="mt-14 min-h-screen overflow-x-hidden bg-[#f7f7f7] pb-20">
      <section className="bg-[#fff2ea] px-4 py-3 text-[11px] font-semibold text-dark-800 lg:mx-auto lg:w-6/12">
        Apenas pedidos agendados. Faça já o seu!
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-b bg-white px-4 py-3 text-[11px] text-dark-500 lg:mx-auto lg:w-6/12">
        <div className="flex min-w-0 items-center gap-2">
          <FaRegClock className="shrink-0 text-[#f97316]" />
          <span className="truncate">A partir das 11h30</span>
        </div>
        <div className="flex items-center gap-2 text-right">
          <span className="whitespace-nowrap">Mín. R$ 35,00</span>
          <FaStore className="shrink-0 text-[#f97316]" />
        </div>
      </section>

      <section className="bg-white px-4 py-3 lg:mx-auto lg:w-6/12">
        <div className="rounded-md bg-gradient-to-r from-[#7315f5] to-[#5900d9] px-4 py-3 text-white">
          <div className="text-center">
            <strong className="block text-[18px] leading-5">3% cashback</strong>
            <span className="block text-[12px] leading-4">compre e ganhe na hora</span>
            <span className="mt-1 block text-[12px] font-extrabold">Aproveite já!</span>
          </div>
        </div>
      </section>

      <Navegation />
      <Banner />

      <section className="bg-white px-4 pb-4 lg:mx-auto lg:w-6/12">
        <h2 className="mb-2 text-[17px] font-extrabold text-dark-800">Os mais pedidos</h2>
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {featuredProducts.map((item) => (
              <CarouselItem key={item.id} className="basis-[39%] sm:basis-1/4">
                <ProductCard {...item} variant="compact" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-auto right-10 -top-9 hidden border-dark-200 text-dark-700 shadow-sm disabled:opacity-30 sm:inline-flex" />
          <CarouselNext className="right-0 -top-9 hidden border-dark-200 text-dark-700 shadow-sm disabled:opacity-30 sm:inline-flex" />
        </Carousel>
      </section>

      <section className="px-4 lg:mx-auto lg:w-6/12">
        {cardapio?.map((produto: CardapioDTO) => (
          <div id={`section-${produto.id}`} key={produto.titulo} className="pt-5">
            <h2 className="mb-2 text-[20px] font-extrabold text-dark-800">
              {produto.titulo}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {produto.produtos.map((item) => (
                <ProductCard key={item.id} {...item} />
              ))}
            </div>
          </div>
        ))}
      </section>
      {cartItemCount > 0 && <OrderSummaryBar />}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white lg:hidden">
        <ul className="grid h-14 grid-cols-4 text-[10px] text-dark-500">
          <li className="flex flex-col items-center justify-center gap-1 border-t-2 border-[#f97316] text-[#f97316]">
            <FaHome size={18} />
            Início
          </li>
          <li className="flex flex-col items-center justify-center gap-1">
            <FaStore size={17} />
            Pedidos
          </li>
          <li className="flex flex-col items-center justify-center gap-1">
            <FaGift size={17} />
            Promos
          </li>
          <li>
            <Link href="/cart" className="flex h-full flex-col items-center justify-center gap-1">
              <span className="relative">
                <HiShoppingCart size={18} />
                {cartItemCount > 0 && (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f97316] px-1 text-[9px] font-extrabold leading-none text-white">
                    {cartItemCount}
                  </span>
                )}
              </span>
              Carrinho
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
