'use client';

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import ClientWrapper from '@/components/ClientWrapper';
import SessionProvider from '@/components/SessionProvider';
import ThemeWrapper from '@/components/Theme/ThemeWrapper';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/context/Cart';
import { queryClient } from '@/lib/react-query';

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <SessionProvider>
          <ThemeWrapper>
            <ClientWrapper>
              <main>{children}</main>
            </ClientWrapper>
            <Toaster position="top-right" />
          </ThemeWrapper>
        </SessionProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}
