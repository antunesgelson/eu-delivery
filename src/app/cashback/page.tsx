
'use client'

import useCart from "@/hook/useCart";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaPiggyBank } from "react-icons/fa";

export default function CashBack() {
    const [cashBack, setCashBack] = useState(0);
    const { configData } = useCart()

    useEffect(() => {
        if (configData) {
            const cashbackField = configData.find((item: any) => item.chave.toUpperCase() === 'CASHBACK')?.valor ?? '0';
            setCashBack(Number(cashbackField));
        }
    }, [configData]);
    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3'>
                <h1 className="uppercase text-2xl font-bold"> programa de cashback</h1>
            </div>

            <section className="bg-white p-4 text-sm">
                <h2 className="font-bold text-xl flex items-center gap-1"><FaPiggyBank />Regras:</h2>
                <p className=" ">Você receberá <strong>{cashBack}% </strong> de volta em compras realizadas no <strong>Emporio Urubici</strong>.</p>
                <p>O crédito recebido terá validade de <strong>12 meses</strong>.</p>
                <p>O valor do cashback será creditado em até 24 horas após a finalização do pedido. </p>
                <p>Você não poderá utilizar cupos de desconto no mesmo pedido em que realizar o resgate do cashback.</p>
            </section>
        </motion.main>
    )
}
