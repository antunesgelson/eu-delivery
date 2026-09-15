'use client'
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Header = dynamic(() => import('@/components/Header'), {
  ssr: false,
});

const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
  const [hidePublicHeader, setHidePublicHeader] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
      const isAdminLogin = window.location.pathname.startsWith('/signin') && Boolean(callbackUrl?.startsWith('/admin'));

      setHidePublicHeader(window.location.pathname.startsWith('/admin') || isAdminLogin);
    }
  }, []);

  return (
    <>
      {!hidePublicHeader && <Header />}
      {children}
    </>
  );
};

export default ClientWrapper;
