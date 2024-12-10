
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Inter } from "next/font/google";
import React from "react";
import "./globals.css";

import ClientWrapper from "@/components/ClientWrapper";
import SessionProvider from "@/components/SessionProvider";
import { Toaster } from "@/components/ui/sonner";

import ThemeWrapper from "@/components/Theme/ThemeWrapper";
import { CartProvider } from "@/context/Cart";
import { queryClient } from "@/lib/react-query";
import { QueryClientProvider } from "@tanstack/react-query";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Emporio Urubici",
  description: "Feito com amor e carinho 💖",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="pt-br">
      <body className={inter.className}>
        {/*Provider para manipular cache das requisições*/}
        <QueryClientProvider client={queryClient}>
          {/* Contexto do carrinho */}
          <CartProvider>
            {/* */}
            <SessionProvider session={session}>
              {/* Provider para alterar thema*/}
              <ThemeWrapper>
                {/* Wrapper para renderizar Header Adequado*/}
                <ClientWrapper>
                  <main>{children}</main>
                </ClientWrapper>
                {/* Componente de notificação*/}
                <Toaster position="top-right" />
              </ThemeWrapper>
            </SessionProvider>
          </CartProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}