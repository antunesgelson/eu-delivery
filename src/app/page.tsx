'use client'
import React from "react";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import Banner from "@/components/Banner";
import Footer from "@/components/Footer";
import Navegation from "@/components/Navegation";
import OrderSummaryBar from "@/components/OrderSummaryBar";
import ProductCard from "@/components/ProductCard";
import PromoSection from "@/components/PromoSection";

import { motion } from "framer-motion";
import { toast } from "sonner";

import Background from "@/assets/background/background.jpg";
import Logotipo from "@/assets/logo/logotipo.jpg";

import { CardapioDTO } from "@/dto/cardapioDTO";
import useAuth from "@/hook/useAuth";

import useCart from "@/hook/useCart";
import { api } from "@/service/api";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

type Props = {
  searchParams?: { firstLogin?: string }
}
const background = {
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${Background.src})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};
export default function Home({ searchParams }: Props) {
  const router = useRouter();
  const { data: session } = useSession()
  const { isAuthenticated } = useAuth();
  const { cart } = useCart();
  const userName = session?.user?.name ? session?.user?.name : 'Visitante'

  const { data: cardapio } = useQuery({
    queryKey: ['list-categories-details'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/categoria/lista/detalhes')
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
    <main className="overflow-x-hidden mt-14 ">
      <section
        style={background}
        className="flex flex-col justify-center items-center h-[40vh] ">
        <motion.div
          initial={{ opacity: 0, scale: 0.2, rotate: '100deg', filter: 'blur(20px)' }}
          animate={{ opacity: 1, scale: 1, rotate: '0deg', filter: 'blur(0px)' }}
          whileTap={{ scale: 1.2 }}
          exit={{ opacity: 0, scale: 0.2, rotate: '100deg', filter: 'blur(20px)' }}
          transition={{ duration: 0.8 }} >
          <Image
            src={Logotipo}
            alt="Emporio Urubici"
            className="rounded-full  drop-shadow-2xl  shadow-2xl brightness-90  "
            width={200}
            height={200}
          />
        </motion.div>
      </section>

      {isAuthenticated && <PromoSection />}
      <Navegation />
      <Banner />

      <section className="w-11/12 mx-auto">
        {cardapio?.map((produto: CardapioDTO) => (
          <div id={`section-${produto.id}`} key={produto.titulo}>
            <h2 className="uppercase text-2xl font-bold mt-6 mb-2">
              {produto.titulo}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {produto.produtos.map((item) => (
                <ProductCard key={item.id} {...item} />
              ))}
            </div>
          </div>
        ))}
      </section>
      {cart?.itens && <OrderSummaryBar />}
      <Footer />
    </main>
  );
}
