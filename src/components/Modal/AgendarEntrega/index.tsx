import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"

import MultiStep from "@/components/MultiStep"
import { Calendar } from "@/components/ui/calendar"
import { AnimatePresence, motion } from "framer-motion"
import React from "react"
import { BsCalendarDate } from "react-icons/bs"
import { IoIosArrowRoundForward } from "react-icons/io"

type Props = {
    open: boolean
    onClose: () => void
}


export function ModalAgendarEntrega({ open, onClose }: Props) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [step, setStep] = useState(1);
    const [selectedTime, setSelectedTime] = React.useState('');
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);



    const fetchAvailableTimes = (selectedDate: Date): string[] => {
        // Dados estáticos simulando a resposta da API
        const staticAvailableTimes: { [key: string]: string[] } = {
            "2024-08-03": ["06:00", "07:00", "08:30", "10:00", "12:00", "14:30", "16:00"],
            "2024-08-04": ["06:30", "09:00", "11:00", "13:30", "15:00", "17:00", "18:30"],
            // Adicione mais datas e horários conforme necessário
        };

        const dateString = selectedDate.toISOString().split('T')[0];
        return staticAvailableTimes[dateString] || [];
    };


    const generateTimes = () => {
        const times = [];
        for (let hour = 6; hour < 20; hour++) {
            times.push(`${hour < 10 ? '0' + hour : hour}:00`);
            times.push(`${hour < 10 ? '0' + hour : hour}:30`);
        }
        return times;
    };

    const times = generateTimes();

    useEffect(() => {
        if (date) {
            // Usando dados estáticos para horários disponíveis
            setAvailableTimes(fetchAvailableTimes(date));
        }
    }, [date]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className=" min-h-[530px]  h-[530px] w-11/12 mx-auto rounded-md ">
                <DialogHeader className="h-16 -mb-14">
                    <DialogTitle className=" uppercase text-xl font-bold flex justify-center items-center  ">
                        <h1 className=" flex items-center gap-2 "> <BsCalendarDate />Agendar Entrega</h1>
                    </DialogTitle>

                    <MultiStep size={2} currentStep={step} />
                </DialogHeader>

                <AnimatePresence initial={false} mode="popLayout">
                    {step === 1 &&
                        <motion.div
                            className=""
                            initial={{ opacity: 0, x: 35 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 35 }}
                            transition={{ duration: 0.2, }} >
                            <h2 className="text-center font-bold">Horários Disponíveis</h2>
                            <p className="text-center text-[12px] text-muted-foreground">Escola o dia que deseja receber o produto.</p>
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="  flex justify-center items-center w-full"
                                disabled={(date) =>
                                    date < new Date()
                                } />
                        </motion.div>
                    }
                </AnimatePresence>

                <AnimatePresence initial={false} mode="popLayout">
                    {step === 2 &&
                        <motion.div
                            className=""
                            initial={{ opacity: 0, x: -35 }}
                            animate={{ opacity: 1, x: -0 }}
                            exit={{ opacity: 0, x: -35 }}
                            transition={{ duration: 0.2, }} >
                            <h2 className="text-center font-bold">Horários Disponíveis</h2>
                            <p className="text-center text-[12px] text-muted-foreground">Selecione o horário desejado para receber o produto.</p>

                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {times.map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        className={`py-2 px-4 rounded-md text-sm ${availableTimes.includes(time) ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                        disabled={!availableTimes.includes(time)}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    }
                </AnimatePresence>





                <DialogFooter className=" fixed bottom-4 right-4 left-4  ">
                    <div className="flex justify-center items-center ">
                        <Button
                            variant={'success'}
                            onClick={() => setStep((prev) => step === 1 ? prev + 1 : prev - 1)}
                            className="w-full flex items-center justify-center gap-1">
                            {step === 1 ? 'Próximo passo' : 'Voltar'}
                            <IoIosArrowRoundForward size={20} className={`${step == 2 && ` rotate-180`}`} />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
