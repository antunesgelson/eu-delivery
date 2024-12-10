'use client'

import ThemeToggle from "@/components/Theme/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

import { usePathname } from 'next/navigation';
import { IoChevronBackOutline, IoChevronDownCircle, IoChevronDownOutline, IoChevronForward } from "react-icons/io5";
const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const HeaderAdmin = () => {
    const [year, setYear] = React.useState(new Date().getFullYear());
    const [month, setMonth] = useState(months[new Date().getMonth()]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [isDashboard, setIsDashboard] = useState(false);
    const path = usePathname();

    useEffect(() => {
        if (path === '/admin/dashboard') {
            setIsDashboard(true)
        } else {
            setIsDashboard(false)
        }
    }, [path]);
    return (
        <header className="w-full  p-10 relative z-20">
            <div className="flex justify-between">
                {/* Thema*/}
                <div className={isDashboard ? 'visible' : 'invisible'}>
                    <ThemeToggle />
                </div>
                {/* Calendario*/}
                <div className={isDashboard ? 'visible' : 'invisible'}>
                    <button className="bg-white dark:bg-dark-900 shadow-sm drop-shadow-lg lowercase border dark:border-dark-400 px-4 py-1 rounded-full flex items-center gap-2 duration-300 hover:opacity-70 "
                        onClick={() => setShowCalendar(!showCalendar)}>
                        {month}
                        <IoChevronDownOutline className={`duration-300 cursor-pointer  text-muted ${showCalendar && 'rotate-180'}`} />
                    </button>
                </div>
                {/* Perfil*/}
                <div className="flex items-center gap-2">
                    <Avatar className="shadow-sm drop-shadow-2xl">
                        <AvatarImage src="https://github.com/antunesgelson.png" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <span>Gelson Antunes</span>
                    <IoChevronDownCircle className="cursor-pointer" />
                </div>
            </div>

            <AnimatePresence>
                {showCalendar && (
                    <motion.div
                        className="absolute top-10 right-0 left-0 z-10"
                        initial={{ opacity: 0, }}
                        animate={{ opacity: 1, }}
                        exit={{ opacity: 0, }}
                        transition={{ duration: 0.1 }}>
                        <Calendar
                            months={months}
                            onClose={() => setShowCalendar(false)}
                            currentMonth={setMonth}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}

type CalendarProps = {
    months: string[];
    onClose: () => void;
    currentMonth: (month: string) => void;
}
const Calendar = ({ months, onClose, currentMonth }: CalendarProps) => {
    const [year, setYear] = useState(new Date().getFullYear());

    function handleIncrementYear(event: React.MouseEvent) {
        event.preventDefault();
        setYear(year + 1);
    };

    function handleDecrementYear(event: React.MouseEvent) {
        event.preventDefault();
        setYear(year - 1);
    };

    function handleCurrentYear() {
        setYear(new Date().getFullYear());
        onClose()
    }

    function handleCurrentMonth(event: React.MouseEvent, month: string) {
        event.preventDefault();
        currentMonth(month)
        onClose()
    }
    return (
        <>
            <div onClick={onClose} className="fixed top-0 bottom-0 left-0 right-0 drop-shadow-2xl  backdrop-blur-sm bg-[#1414143d] cursor-pointer" />
            <div className="bg-dark-900 rounded-2xl mt-10 w-[300px] border dark:border-dark-400 shadow-sm drop-shadow-2xl mx-auto ">
                <div className=" w-full h-14 flex items-center justify-between p-4">
                    <Button
                        size={'sm'}
                        className="cursor-pointer hover:opacity-75 text-muted-foreground"
                        onClick={handleDecrementYear}>
                        <IoChevronBackOutline />
                    </Button>
                    <span className="text-lg text-white ">
                        {year}
                    </span>
                    <Button
                        size={'sm'}
                        className="cursor-pointer hover:opacity-75 text-muted-foreground"
                        onClick={handleIncrementYear}>
                        <IoChevronForward />
                    </Button>

                </div>
                <div className=" h-full  bg-white rounded-b-2xl border-b dark:border-dark-400">
                    <div className="grid grid-cols-4 gap-4 p-4 place-items-center">
                        {months.map((month: string) => (
                            <button
                                key={month}
                                onClick={(e) => handleCurrentMonth(e, month)}
                                className="uppercase text-muted-foreground text-xs cursor-pointer hover:bg-white-off hover:text-dark-400 p-2 rounded-lg">
                                {month.substring(0, 3)}
                            </button>
                        ))}
                    </div>
                    <div className="h-full flex justify-between px-4 pb-4 pt-2  ">
                        <Button
                            onClick={onClose}
                            variant={'link'}
                            className="uppercase">
                            cancelar
                        </Button>
                        <Button
                            onClick={handleCurrentYear}
                            variant={'link'}
                            className="uppercase">
                            mês atual
                        </Button>
                    </div>
                </div>
            </div>
        </>

    )
}

export default HeaderAdmin;