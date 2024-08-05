'use client'
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useState } from "react";
import { FaCreditCard } from "react-icons/fa";
import { FaPix } from "react-icons/fa6";


export default function FormOfPayment() {
    const [checked, setChecked] = useState<number | null>(null);

    const PAYMENTS = [
        {
            title: 'Pix',
            Icon: FaPix
        },
        {
            title: 'Cartão de crédito',
            Icon: FaCreditCard
        },
    ]

    return (
        <motion.div className="mt-12"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3 -mb-5 mt-3  text-center'>
                <h1 className="uppercase text-base font-bold ">qual a forma de pagamento?</h1>
                <span className="text-[11px] text-muted-foreground">O pedido só é confirmado mediante pagamento.</span>
            </div>

            <section className=" p-4 text-sm space-y-2">
                {PAYMENTS.map((item, index) => (
                    <div key={index}
                        className={`border  rounded-lg p-4 bg-white relative duration-300 ${checked === index && 'border-emerald-500'}`}
                        onClick={() => setChecked(index)}>
                        <div className=" flex items-center gap-2">
                            {item.Icon && <item.Icon />}
                            <span className="font-semibold uppercase">{item.title}</span>
                            <Checkbox className="absolute right-4 top-1/2 transform -translate-y-[50%]" checked={checked === index} onChange={() => { }} variant={`add`} />
                        </div>
                        {/* <div className="flex flex-col text-muted-foreground text-[12px] leading-4">
                            <span>10% de desconto em todo o site</span>
                            <span className="">Validade: 30/12/2022</span>
                        </div> */}
                    </div>
                ))}
            </section>
        </motion.div>
    )
}