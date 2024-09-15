'use client'
import Header from '@/components/Header';
import { useEffect, useState } from 'react';

const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
    const [isAdminRoute, setIsAdminRoute] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsAdminRoute(window.location.pathname.startsWith('/admin'));
        }
    }, []);

    return (
        <>
            {!isAdminRoute && <Header />}
            {children}
        </>
    );
};

export default ClientWrapper;