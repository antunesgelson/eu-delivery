'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { OrderDetailsDTO } from "@/dto/historicDTO";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BsCalendarDateFill } from "react-icons/bs";
import { IoTimeOutline } from "react-icons/io5";

export function OrderDetails({ id, date, time, items, subtotal, deliveryFee, total, address, paymentMethod, canBeRated }: OrderDetailsDTO) {
    const [isClient, setIsClient] = useState(false);
    const partsAddress = address.split(",");

    useEffect(() => {
        setIsClient(true);
    }, []);
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger >
                    <span className="font-bold bg-muted/40 px-2 py-1 rounded-lg">#{id}</span>
                    <div className="font-semibold flex items-center gap-1"> <BsCalendarDateFill /> {date}</div>
                    <div className="text-muted flex items-center gap-1"> <IoTimeOutline />   {time}</div>
                    <AnimatePresence>
                        {isClient && canBeRated &&
                            <motion.div
                            initial={{ opacity: 0, x: 100,  }}
                            animate={{ opacity: 1, x: 0,   }}
                            transition={{ duration: 0.3 }}>
                                <Button
                                    size={'sm'}
                                    variant={'warning'}>
                                    Avaliar Pedido
                                </Button>
                            </motion.div>
                        }
                    </AnimatePresence>
                </AccordionTrigger>
                <AccordionContent className="bg-white-off p-4 rounded-lg mb-4 pb-6">
                    <h1 className="text-center font-bold">ITEMS DO PEDIDO</h1>
                    <div className="space-y-2 mt-3 ">
                        {items.map((item,) => (
                            <div key={item.name} className="flex justify-between items-center border-t pt-3 gap-4 relative">
                                <span className="font-bold">{item.quantity}x</span>
                                <div className="flex flex-col leading-3  w-full">
                                    <span className="font-semibold uppercase ">{item.name}</span>
                                    {item.customizations &&
                                        item.customizations.map((customization, index) => (
                                            <div key={index}>
                                                <span className="text-muted-foreground text-[10px]">{customization}</span>
                                            </div>
                                        ))}
                                </div>
                                <div className="text-[11px] whitespace-nowrap">R$  <span className="text-base">{item.price.toFixed(2)}</span></div>

                              
                            </div>
                        ))}
                        
                    </div>

                    <div className="flex flex-col items-end gap-1 mt-8 text-base  ">
                        <span>Subtotal: R$ {subtotal}</span>
                        <span className={`${deliveryFee === 'Grátis!' && 'text-emerald-600'}`}>
                            Taxa de Entrega: {deliveryFee !== 'Grátis!' ? `R$ ${deliveryFee}` : deliveryFee}
                        </span>
                        <span className="font-bold">Total: $ {total.toFixed(2)}</span>
                    </div>

                    <Separator className="my-4" />

                    <div className="py-1">
                        <h2 className="text-center font-bold">ENDEREÇO</h2>
                        <div className="my-2">
                            {partsAddress[0]}, {partsAddress[1]}<br />
                            {partsAddress[2]}, {partsAddress[3]}
                        </div>
                    </div>

                    <div className="w-full border-dashed border-t-[1px] my-4 px-52 mx-[-1rem] border-muted" />

                    <div className="py-1">
                        <h2 className="text-center font-bold">FORMA DE PAGAMENTO</h2>
                        <div className="my-2">
                            {paymentMethod.map((method) => (
                                <div key={method.type} className="flex items-center gap-1">
                                    <span> (ICON)  {method.type}</span>
                                    <span className="font-semibold">(R$ {method.amount.toFixed(2)})</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button className="w-full" variant={'success'}>
                        Pedir Novamente
                    </Button>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
