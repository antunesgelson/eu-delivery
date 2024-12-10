'use client';

import { ThemeProvider } from 'next-themes';
import { usePathname } from 'next/navigation';
import React from 'react';

const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const isAdminPath = pathname.startsWith('/admin');

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme={isAdminPath ? 'dark' : 'light'}
            forcedTheme={isAdminPath ? undefined : 'light'}>
            {children}
        </ThemeProvider>
    );
};

export default ThemeWrapper;