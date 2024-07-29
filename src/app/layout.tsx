import Header from "@/components/Header";
import SessionProvider from '@/components/SessionProvider';
import { CartProvider } from "@/context/Cart";
import type { Metadata } from "next";

import { getServerSession } from "next-auth";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Emporio Urubici",
  description: "Feito com amor e carinho 💖",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getServerSession();
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <CartProvider>
          <SessionProvider session={session}>
            <Header />
            <main >{children}</main>

       
          </SessionProvider>
        </CartProvider>
      </body>
    </html>
  );
}
