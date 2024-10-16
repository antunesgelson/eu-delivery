'use client'
import classNames from "classnames";
import { motion } from "framer-motion";
import React from "react";

import { FaHandHoldingDollar, FaLandmark } from "react-icons/fa6";
import { IoArrowUpCircleSharp } from "react-icons/io5";
import { IconType } from "react-icons/lib";

const Dashboard = () => {
    const [teste, setTeste] = React.useState();
    return (
        <div className="px-4 2xl:w-10/12 mx-auto h-full min-h-screen">
            <h1 className="text-start text-3xl pb-6">Dashboard</h1>

            <section className="grid grid-cols-4 gap-4">
                <Card
                    title="Receitas"
                    value={1000}
                    Icon={IoArrowUpCircleSharp}
                />

                <Card
                    title="Despesas"
                    value={1000}
                    Icon={IoArrowUpCircleSharp}
                />

                <Card
                    title="Lucro Atual"
                    value={1000}
                    Icon={FaHandHoldingDollar}
                />

                <Card
                    title="Cartão de Crédito"
                    value={1000}
                    Icon={FaLandmark}
                />
            </section>

            <motion.div
                className="w-20 h-20 bg-emerald-500 mx-auto mt-32 "
                animate={{
                    scale: [1, 2, 2, 1, 1],
                    rotate: [0, 0, 180, 180, 0],
                    borderRadius: ["0%", "0%", "50%", "50%", "0%"]
                }}
                transition={{
                    duration: 2,
                    ease: "easeInOut",
                    times: [0, 0.2, 0.5, 0.8, 1],
                    repeat: Infinity,
                    repeatDelay: 1
                }} />

        </div>
    )
}

type CardProps = {
    title: string;
    value: number;
    Icon: IconType;
}

const Card = ({ title, value, Icon }: CardProps) => {
    return (
        <div className="h-28 rounded-3xl flex justify-between items-center bg-white border-white dark:bg-dark-800 p-8 border dark:border-dark-400 shadow-sm drop-shadow-lg">
            <div className="flex flex-col">
                <h2 className="font-light text-muted ">{title}</h2>
                <span className="font-semibold text-2xl py-1">R$ {value.toFixed(2)} </span>
            </div>
            <div>
                <Icon size={60} className={classNames(
                    { 'text-green-600': title == 'Receitas' },
                    { 'text-red-600 rotate-180': title == 'Despesas' },
                    { 'text-muted dark:text-white': title == 'Lucro Atual' },
                )} />
            </div>
        </div>
    )
}
export default Dashboard;