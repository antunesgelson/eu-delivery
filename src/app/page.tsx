'use client'
import Banner from "@/components/Banner";
import Footer from "@/components/Footer";
import Navegation from "@/components/Navegation";
import OrderSummaryBar from "@/components/OrderSummaryBar";
import ProductCard from "@/components/ProductCard";
import PromoSection from "@/components/PromoSection";
import { cardapio } from "@/data";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { toast } from "sonner";

type Props = {
  searchParams?: { firstLogin?: string }
}
export default function Home({ searchParams }: Props) {
  const { data: session } = useSession()
  const isAutenticate = session?.user?.name ? true : false


  useEffect(() => {
    if (searchParams?.firstLogin === 'true') {
      setTimeout(() => {
        toast.success(`Bem-Vindo(a) ${session?.user?.name} 🥰`, {
          description: "Estamos felizes em tê-lo conosco! Para aproveitar ao máximo nossos serviços, conecte-se ao Google Calendário e receba notificações de entrega diretamente em sua agenda.",
          descriptionClassName: 'text-muted-foreground text-[11px]',
          actionButtonStyle: { backgroundColor: '#141414', color: '#fff' },
          duration: 9000, // Duração da notificação em milissegundos
          action: {
            label: 'Ok!',
            onClick: () => { },
          },
        })
      }, 50);
    }
  }, [searchParams]);
  return (
    <main className="overflow-x-hidden mt-14">

      <section className="flex flex-col justify-center items-center h-[50vh] bg-white bg-custom ">
        <h1>Emporio Urubici</h1>
        <h2>abriremos as 18:30</h2>
      </section>

      {isAutenticate && <PromoSection />}
      <Navegation />
      <Banner />

      <section className="w-11/12 mx-auto">
        {cardapio.map((produto) => (
          <div id={`section-${produto.id}`} key={produto.secao}>
            <h2 className="uppercase text-2xl font-bold mt-6 mb-2">
              {produto.secao}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {produto.itens.map((item) => (
                <ProductCard key={item.titulo} {...item} />
              ))}
            </div>
          </div>
        ))}
      </section>
      <OrderSummaryBar />
      <Footer />
    </main>
  );
}
