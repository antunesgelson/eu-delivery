'use client'
import classNames from 'classnames';
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from 'react';

import HeaderAdmin from "@/components/Header/Admin";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { BiSolidFoodMenu } from "react-icons/bi";
import { FaChartPie } from "react-icons/fa6";
import { HiTicket } from "react-icons/hi2";
import { IoMdSettings } from "react-icons/io";
import { IconType } from "react-icons/lib";
import { Tooltip } from 'react-tooltip';

type MenuProps = {
    open: boolean
    Icon: IconType
    title: string;
    link: string;
}

const MenuItem = ({ Icon, title, link, open }: MenuProps) => {
    const pathname = usePathname();
    const rota = link.split('/');
    const isActive = pathname?.includes(rota[2]);

    return (
        <div className="relative w-full  ">
            <Link href={link}>
                <div className={classNames(
                    "w-full h-full group flex justify-start  hover:cursor-pointer dark:hover:bg-dark-400 hover:bg-white-off duration-300  py-4 pl-6   ",
                    { 'pr-16': open, 'pr-10 ': !open },
                    { 'border-l-[2.5px] dark:border-white border-black': isActive }
                )}
                    data-tooltip-id="admin-tooltip"
                    data-tooltip-content={title}>
                    <Icon className={classNames("dark:text-muted text-dark-900 ", { 'dark:text-white': isActive, 'text-muted-foreground group-hover:text-dark-900 dark:group-hover:text-white': !isActive })} size={23} />
                    <span className={classNames(
                        "ml-6 text-md dark:text-muted dark:group-hover:text-white group-hover:text-dark-900 text-muted-foreground  underline-offset-2",
                        {
                            'duration-500 block': open,
                            'hidden': !open,
                            'underline font-poppins-bold dark:text-white text-black': isActive,
                            'font-poppins-medium': !isActive
                        }
                    )}>{title}</span>
                </div>
            </Link>

        </div>
    );
}

const LayoutAdmin = ({ children }: { children: React.ReactNode }) => {
    const path = usePathname();
    const [open, setOpen] = React.useState(false);
    const toggleOpen = () => setOpen(!open);
    const menuData = [
        { Icon: FaChartPie, title: 'Dashboard', link: '/admin/dashboard', subMenu: [] },
        { Icon: BiSolidFoodMenu, title: 'Cardápio', link: '/admin/cardapio', subMenu: [] },
        { Icon: HiTicket, title: 'Cupom', link: '/admin/cupom', subMenu: [] },
        { Icon: IoMdSettings, title: 'Configuração', link: '/admin/config', subMenu: [] },
    ];


    return (
        <div className="min-h-screen h-full flex justify-between">
            <div className={classNames("relative duration-300 flex flex-col items-center justify0 dark:bg-dark-800 bg-white shadow-sm drop-shadow-lg", { 'w-80': open, 'w-24 ': !open })}>
                <button className="dark:text-white-off text-muted-foreground py-8 flex items-center" onClick={toggleOpen}>
                    ADMIN
                </button>
                <ChevronRightIcon
                    onClick={toggleOpen}
                    className={classNames("dark:bg-white-off  dark:hover:bg-white-off/20 dark:hover:text-white-off dark:text-dark-400 bg-white hover:bg-dark-900 hover:text-muted absolute -right-2 top-4 h-4 w-4 shrink-0  transition-transform rounded-full cursor-pointer duration-300 ", { 'rotate-180': open })} />


                <div className=" ">
                    {menuData.map((item, index) => (
                        <MenuItem key={index} open={open} {...item} />
                    ))}

                </div>
            </div>

            <div className="dark:bg-dark-900 bg-white-off w-full h-full dark:text-white-off text-dark-900">
                {path !== '/admin/cardapio' && <HeaderAdmin />}
                {children}
                {!open && <Tooltip id="admin-tooltip" place="right" />}
            </div>
        </div>
    );
}
export default LayoutAdmin;