'use client'

import Link from "next/link";
import type { ReactNode } from "react";
import { FaGift, FaHome } from "react-icons/fa";
import { FaStore } from "react-icons/fa6";
import { HiShoppingCart } from "react-icons/hi";

import { cn } from "@/lib/utils";

type MobileBottomNavItem = 'home' | 'orders' | 'promos' | 'cart';

type MobileBottomNavProps = {
    activeItem: MobileBottomNavItem;
    cartItemCount?: number;
    promoNotificationCount?: number;
}

function NavBadge({ count }: { count: number }) {
    if (count <= 0) {
        return null;
    }

    return (
        <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f97316] px-1 text-[9px] font-extrabold leading-none text-white shadow-sm">
            {count > 9 ? '9+' : count}
        </span>
    );
}

function NavContent({
    active,
    children,
}: {
    active: boolean;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                "flex h-full flex-col items-center justify-center gap-1",
                active && "border-t-2 border-[#f97316] text-[#f97316]"
            )}
        >
            {children}
        </div>
    );
}

export default function MobileBottomNav({
    activeItem,
    cartItemCount = 0,
    promoNotificationCount = 0,
}: MobileBottomNavProps) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white lg:hidden">
            <ul className="grid h-14 grid-cols-4 text-[10px] text-dark-500">
                <li>
                    {activeItem === 'home' ? (
                        <NavContent active>
                            <FaHome size={18} />
                            Início
                        </NavContent>
                    ) : (
                        <Link href="/" className="block h-full">
                            <NavContent active={false}>
                                <FaHome size={18} />
                                Início
                            </NavContent>
                        </Link>
                    )}
                </li>

                <li>
                    {activeItem === 'orders' ? (
                        <NavContent active>
                            <FaStore size={17} />
                            Pedidos
                        </NavContent>
                    ) : (
                        <Link href="/historic" className="block h-full">
                            <NavContent active={false}>
                                <FaStore size={17} />
                                Pedidos
                            </NavContent>
                        </Link>
                    )}
                </li>

                <li>
                    {activeItem === 'promos' ? (
                        <NavContent active>
                            <span className="relative">
                                <FaGift size={17} />
                                <NavBadge count={promoNotificationCount} />
                            </span>
                            Promos
                        </NavContent>
                    ) : (
                        <Link href="/cashback" className="block h-full">
                            <NavContent active={false}>
                                <span className="relative">
                                    <FaGift size={17} />
                                    <NavBadge count={promoNotificationCount} />
                                </span>
                                Promos
                            </NavContent>
                        </Link>
                    )}
                </li>

                <li>
                    {activeItem === 'cart' ? (
                        <NavContent active>
                            <span className="relative">
                                <HiShoppingCart size={18} />
                                <NavBadge count={cartItemCount} />
                            </span>
                            Carrinho
                        </NavContent>
                    ) : (
                        <Link href="/cart" className="block h-full">
                            <NavContent active={false}>
                                <span className="relative">
                                    <HiShoppingCart size={18} />
                                    <NavBadge count={cartItemCount} />
                                </span>
                                Carrinho
                            </NavContent>
                        </Link>
                    )}
                </li>
            </ul>
        </nav>
    )
}
