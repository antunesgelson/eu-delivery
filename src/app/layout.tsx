import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Inter } from "next/font/google";
import "./globals.css";

import ClientWrapper from "@/components/ClientWrapper";
import SessionProvider from '@/components/SessionProvider';
import { Toaster } from "@/components/ui/sonner";

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
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getServerSession();

  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <SessionProvider session={session}>
              <ClientWrapper>
                <main>{children}</main>
              </ClientWrapper>
              <Toaster position="top-right" />
            </SessionProvider>
          </CartProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}