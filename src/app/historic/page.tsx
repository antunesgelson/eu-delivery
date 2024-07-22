'use client'

import { OrderDetails } from "@/components/OrderDetails";
import { Button } from "@/components/ui/button";
import { historicDetails } from "@/data";
import { motion } from "framer-motion";


export default function Historic() {
    return (
        <motion.main className="mt-12"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        >
            <div className='p-4 leading-3'>
                <h2 className="uppercase text-2xl font-bold ">últimos pedidos </h2>
                <span className='text-[12px]'>Você pode coferir todos os pedidos realizados em nosso site, e também pode refazer eles de forma rápida e prática!</span>
            </div>

            <section className="bg-white p-4">

                {historicDetails.map((order) => (
                    <OrderDetails key={order.id} {...order} />
                ))}

                <div className="flex justify-center my-4">
                    <Button className="" variant={'default'}>
                        Ver mais
                    </Button>
                </div>
            </section>
        </motion.main>
    )
}