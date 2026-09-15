'use client'
import React from "react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Navegation from "@/components/Navegation";
import MobileBottomNav from "@/components/MobileBottomNav";
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
import { promoNotificationCount } from "@/data/promos";

import useCart from "@/hook/useCart";
import { FaRegClock } from "react-icons/fa";
import { FaCircleQuestion, FaPiggyBank, FaStore } from "react-icons/fa6";
import Link from "next/link";

type Props = {
  searchParams?: { firstLogin?: string }
}

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function Home({ searchParams }: Props) {
  const router = useRouter();
  const { data: session } = useSession()
  const { cart, configData } = useCart();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const userName = session?.user?.name ? session?.user?.name : 'Visitante'
  const cardapio = localCardapio;
  const featuredProducts = cardapio.flatMap((categoria) => categoria.produtos).slice(0, 4);
  const cartItemCount = cart?.itens.reduce((total, item) => total + item.quantidade, 0) ?? 0;
  const cashbackPercent = configData?.find((item: any) => item.chave.toUpperCase() === 'CASHBACK')?.valor ?? '3';
  const normalizedSearchTerm = React.useMemo(() => normalizeSearchValue(searchTerm), [searchTerm]);
  const isSearching = isSearchOpen;
  const filteredCardapio = React.useMemo(() => {
    if (!normalizedSearchTerm) {
      return cardapio;
    }

    return cardapio
      .map((categoria) => {
        const categoryMatches = normalizeSearchValue(categoria.titulo).includes(normalizedSearchTerm);
        const produtos = categoryMatches
          ? categoria.produtos
          : categoria.produtos.filter((produto) => {
            const searchableText = normalizeSearchValue(`${produto.titulo} ${produto.descricao}`);
            return searchableText.includes(normalizedSearchTerm);
          });

        return {
          ...categoria,
          produtos,
        };
      })
      .filter((categoria) => categoria.produtos.length > 0);
  }, [cardapio, normalizedSearchTerm]);
  const visibleCardapio = normalizedSearchTerm ? filteredCardapio : cardapio;


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

      <section className="bg-white px-3 py-3 lg:mx-auto lg:w-6/12">
        <Link
          href="/cashback"
          className="flex items-center justify-between gap-3 rounded-md border-2 border-dashed border-neutral-300 bg-white px-3 py-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center text-dark-800">
            <FaPiggyBank size={27} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[13px] font-extrabold leading-4 text-dark-900">Programa de Cashback:</h2>
            <p className="mt-0.5 text-[12px] leading-4 text-dark-500">
              Receba <strong>{cashbackPercent}%</strong> de volta em suas compras!
            </p>
          </div>
          <FaCircleQuestion className="shrink-0 text-red-600" size={16} />
        </Link>
      </section>

      <Navegation
        isSearchOpen={isSearchOpen}
        searchTerm={searchTerm}
        onSearchOpenChange={setIsSearchOpen}
        onSearchTermChange={setSearchTerm}
      />

      {!isSearching && (
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
      )}

      <section className="px-4 lg:mx-auto lg:w-6/12">
        {normalizedSearchTerm && visibleCardapio.length === 0 && (
          <div className="mt-4 rounded-md bg-white p-5 text-center shadow-sm">
            <strong className="text-[15px] text-dark-900">Nenhum item encontrado</strong>
            <p className="mt-1 text-[12px] leading-5 text-dark-500">
              Tente buscar por frango, costelinha, maionese, arroz ou bebida.
            </p>
          </div>
        )}

        {visibleCardapio?.map((produto: CardapioDTO) => (
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
      <MobileBottomNav
        activeItem="home"
        cartItemCount={cartItemCount}
        promoNotificationCount={promoNotificationCount}
      />
    </main>
  );
}
