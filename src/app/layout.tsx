import type { Metadata } from "next";
import React from "react";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assados Zanini",
  description: "Assados e defumados prontos para pedir.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
