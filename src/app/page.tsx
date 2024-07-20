import Banner from "@/components/Banner";
import Footer from "@/components/Footer";
import Navegation from "@/components/Navegation";
import ProductCard from "@/components/ProductCard";
import { cardapio } from "@/data";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <section className="flex flex-col justify-center items-center h-[50vh] bg-white bg-custom ">
        <h1>Emporio Urubici</h1>
        <h2>abriremos as 18:30</h2>
      </section>

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

      <Footer />
    </main>
  );
}
