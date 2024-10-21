import { AnimatePresence, motion } from "framer-motion"
import React, { useState } from "react"

import MultiStep from "@/components/MultiStep"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"


import { Separator } from "@/components/ui/separator"
import useCart from "@/hook/useCart"
import { api } from "@/service/api"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { BsCalendarDate } from "react-icons/bs"
import { FaRegCalendarCheck } from "react-icons/fa6"
import { IoIosArrowRoundForward } from "react-icons/io"
import { toast } from "sonner"

type Props = {
    open: boolean
    onClose: () => void
}

const TIMES = [
    "06:00", "06:30",
    "07:00", "07:30",
    "08:00", "08:30",
    "09:00", "09:30",
    "10:00", "10:30",
    "11:00", "11:30",
    "12:00", "12:30",
    "13:00", "13:30",
    "14:00", "14:30",
    "15:00", "15:30",
    "16:00", "16:30",
    "17:00", "17:30",
    "18:00", "18:30",
    "19:00", "19:30"
];

export function ModalAgendarEntrega({ open, onClose }: Props) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [step, setStep] = useState(1);
    const [selectedTime, setSelectedTime] = React.useState('');
    const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
    const { handleUpdateCart } = useCart()


    const { mutateAsync: handleChooseDate, isPending } = useMutation({
        mutationKey: ['choose-date'],
        mutationFn: async () => {
            if (!date || (!selectedTime && !selectedPeriod)) {
                throw new Error('Data e horário ou período devem ser selecionados');
            }
            const formattedDate = date.toISOString().split('T')[0]; // Formata a data como YYYY-MM-DD
            const dataEntrega = selectedPeriod
                ? `${formattedDate} ${selectedPeriod === 'morning' ? 'Manhã' : 'Tarde'}`
                : `${formattedDate} ${selectedTime}`; // Combina a data e o horário ou período

            const { data } = await api.put('/pedido', {
                dataEntrega
            });


            return data
        }, onSuccess(data) {
            console.log('Sucessooo data => ', data)
            handleUpdateCart()
            onClose()
            toast.success('Data de entrega agendado com sucesso!')

        }, onError(error: unknown) {
            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Erro inesperado, tente novamente mais tarde.')
            }
        }
    })


    // useEffect(() => {
    //     if (!date) return;
    //     console.log('selectedTime ->', selectedTime)
    //     console.log('date ->', date)
    //     console.log('selectedPeriod ->', selectedPeriod);
    //     const formattedDate = date.toISOString().split('T')[0]; // Formata a data como YYYY-MM-DD
    //     const dataEntrega = selectedPeriod
    //         ? `${formattedDate} ${selectedPeriod === 'morning' ? 'Manhã' : 'Tarde'}`
    //         : `${formattedDate} ${selectedTime}`; // Combina a data e o horário ou período


    //     console.log('dataEntrega ->', dataEntrega)
    // }, [date, selectedTime, selectedPeriod]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className=" min-h-[600px]  h-[600px] w-11/12  rounded-md ">
                <DialogHeader className=" -mb-8">
                    <DialogTitle className="uppercase text-xl font-bold flex justify-center items-center w-full ">
                        <h1 className=" flex items-center gap-2 "> <BsCalendarDate />Agendar Entrega</h1>
                    </DialogTitle>
                    <MultiStep size={2} currentStep={step} />
                </DialogHeader>

                <AnimatePresence initial={false} mode="popLayout">
                    {step === 1 &&
                        <motion.div
                            className=""
                            layout
                            initial={{ opacity: 0, x: 35 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 35 }}
                            transition={{ duration: 0.2, }} >
                            <h2 className="text-center font-bold">Selecione o Dia de Entrega</h2>
                            <p className="text-center text-xs text-muted-foreground">Escola o dia que deseja receber o produto.</p>
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className=" flex justify-center items-center w-full"
                                disabled={(date) =>
                                    date < new Date()
                                } />
                        </motion.div>
                    }
                </AnimatePresence>
                <AnimatePresence initial={false} mode="popLayout">
                    {step === 2 &&
                        <motion.div
                            className="-mt-4"
                            layout
                            initial={{ opacity: 0, x: -35 }}
                            animate={{ opacity: 1, x: -0 }}
                            exit={{ opacity: 0, x: -35 }}
                            transition={{ duration: 0.2, }} >
                            <h2 className="text-center font-bold">Horários Disponíveis</h2>
                            <p className="text-center text-xs text-muted-foreground">Selecione o horário desejado para receber o produto.</p>

                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {/* bg-gray-300 text-gray-500 cursor-not-allowed */}
                                {TIMES.map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        disabled={!!selectedPeriod}
                                        className={`py-2 px-4 rounded-md text-sm duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed ${selectedTime === time ? 'bg-emerald-500 text-white' : 'bg-dark-400 text-white-off'}`}>
                                        {time}
                                    </button>
                                ))}
                            </div>


                            <div className="mt-3">
                                <div className="leading-3 flex flex-col justify-center items-center">
                                    <span className="text-xs text-muted-foreground ">Ou</span>
                                    <span className="text-xs text-muted-foreground">Escolha o melhor período para receber sua entrega.</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="grid grid-cols-2 text-xs mt-3">
                                    <div className="flex items-center gap-1">
                                        <Checkbox
                                            variant="add"
                                            checked={selectedPeriod === 'morning'}
                                            onCheckedChange={() => setSelectedPeriod(selectedPeriod === 'morning' ? null : 'morning')}
                                            className="h-5 w-5"
                                        />
                                        <span>Na parte da manhã</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Checkbox
                                            variant="add"
                                            checked={selectedPeriod === 'afternoon'}
                                            onCheckedChange={() => setSelectedPeriod(selectedPeriod === 'afternoon' ? null : 'afternoon')}
                                            className="h-5 w-5"
                                        />
                                        <span>Na parte da tarde</span>
                                    </div>
                                </div>


                            </div>
                        </motion.div>
                    }
                </AnimatePresence>
                <DialogFooter className=" fixed bottom-4 right-4 left-4 ">
                    <div className="flex justify-center items-center ">
                        {step == 1 &&
                            <Button
                                variant={'success'}
                                onClick={() => setStep((prev) => prev + 1)}
                                className="w-full flex items-center justify-center gap-1">
                                Selecione um horário
                                <IoIosArrowRoundForward size={20} />
                            </Button>
                        }
                    </div>
                    {step == 2 &&
                        <div className="flex justify-between items-center gap-2 px-2">
                            <Button
                                variant={'success'}
                                onClick={() => setStep((prev) => prev - 1)}
                                className="w-full flex items-center justify-center gap-1">
                                <IoIosArrowRoundForward size={20} className={` rotate-180`} />
                                Voltar
                            </Button>

                            <Button
                                variant={'success'}
                                loading={isPending}
                                onClick={() => handleChooseDate()}
                                className="w-full flex items-center justify-center gap-1">
                                Agendar
                                <FaRegCalendarCheck />
                            </Button>
                        </div>
                    }

                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
