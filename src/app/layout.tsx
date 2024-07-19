import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { CartProvider } from "@/context/Cart";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Emporio Urubici",
  description: "Feito com amor e carinho 💖",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <CartProvider>
          <Header />
          <main >{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
