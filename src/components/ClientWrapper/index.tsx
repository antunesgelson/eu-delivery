'use client'
import Header from '@/components/Header';
import { useEffect, useState } from 'react';

const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
    }
  }, []);

  if (isAdminRoute === null) {
    return null; // Ou um loader, se preferir
  }

  return (
    <>
      {!isAdminRoute && <Header />}
      {children}
    </>
  );
};

export default ClientWrapper;