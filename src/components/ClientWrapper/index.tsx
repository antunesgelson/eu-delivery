'use client';
import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { destinoSeguro, destinoAdmin } from '@/lib/navigation';
import Header from '@/components/Header';
import useAuth from '@/hook/useAuth';
import { Button } from '@/components/ui/button';
// A seleção de cupom depende do carrinho do titular; o catálogo da API continua público.
const privatePaths = ['/profile', '/deliveryaddress', '/cart', '/checkout', '/formofpayment', '/historic', '/orderstatus', '/cashback', '/cupom'];
function Cabecalho() {
  const path = usePathname(), query = useSearchParams();
  const callback = query.get('callbackUrl');
  const admin = path.startsWith('/admin') || path.startsWith('/signin') && destinoAdmin(destinoSeguro(callback));
  return admin ? null : <Header />;
}
function Conteudo({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter();
  const { isAuthenticated, isLoading, isError, isFetching, atualizar } = useAuth();
  const protectedPage = privatePaths.some(p => path === p || path.startsWith(p + '/'));
  useEffect(() => {
    if (protectedPage && !isLoading && !isError && !isAuthenticated) {
      router.replace(`/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [protectedPage, isLoading, isError, isAuthenticated, router]);
  if (protectedPage && isError && !isAuthenticated) return <main className="mt-16 space-y-3 p-4" role="alert"><p>Não foi possível verificar sua sessão. Tente novamente para continuar.</p><Button disabled={isFetching} onClick={() => void atualizar()}>{isFetching ? 'Verificando sessão…' : 'Tentar novamente'}</Button></main>;
  if (protectedPage && (isLoading || !isAuthenticated)) return <main className="mt-16 p-4" role="status">Carregando sua conta…</main>;
  return children;
}
export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <><Suspense fallback={null}><Cabecalho /></Suspense><Conteudo>{children}</Conteudo></>;
}
