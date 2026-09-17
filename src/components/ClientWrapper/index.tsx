'use client';
import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import useAuth from '@/hook/useAuth';
const privatePaths = ['/profile', '/deliveryaddress', '/cart', '/checkout', '/formofpayment', '/historic', '/orderstatus', '/cashback'];
function Cabecalho() {
  const path = usePathname(), query = useSearchParams();
  const callback = query.get('callbackUrl');
  const admin = path.startsWith('/admin') || path.startsWith('/signin') && (callback === '/admin' || callback?.startsWith('/admin/'));
  return admin ? null : <Header />;
}
function Conteudo({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const protectedPage = privatePaths.some(p => path === p || path.startsWith(p + '/'));
  useEffect(() => {
    if (protectedPage && !isLoading && !isAuthenticated) {
      router.replace(`/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [protectedPage, isLoading, isAuthenticated, router]);
  if (protectedPage && (isLoading || !isAuthenticated)) return <main className="mt-16 p-4" role="status">Carregando sua conta…</main>;
  return children;
}
export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <><Suspense fallback={null}><Cabecalho /></Suspense><Conteudo>{children}</Conteudo></>;
}
