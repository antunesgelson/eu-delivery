'use client';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import ClientWrapper from '@/components/ClientWrapper';
import ThemeWrapper from '@/components/Theme/ThemeWrapper';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/context/Cart';
import { AuthProvider } from '@/context/Auth';
import { queryClient } from '@/lib/react-query';
export default function Providers({children}:{children:ReactNode}){return <QueryClientProvider client={queryClient}><AuthProvider><CartProvider><ThemeWrapper><ClientWrapper><main>{children}</main></ClientWrapper><Toaster position="top-right"/></ThemeWrapper></CartProvider></AuthProvider></QueryClientProvider>;}
