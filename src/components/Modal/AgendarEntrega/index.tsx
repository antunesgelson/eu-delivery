'use client'

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { STORE_PICKUP_TIME_WINDOWS, STORE_PICKUP_WEEKDAYS } from "@/data/store";
import useCart from "@/hook/useCart";
import React from "react";
import { toast } from "sonner";
import { FaCircleCheck, FaRegCircle } from "react-icons/fa6";
import { IoWarning } from "react-icons/io5";

type Props = {
    open: boolean
    onClose: () => void
}

type PickupDate = {
    date: Date
    label: string
    day: string
    month: string
}

type PickupWindow = typeof STORE_PICKUP_TIME_WINDOWS[number];

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const monthLabels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function startOfDay(value: Date) {
    const nextDate = new Date(value);
    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
}

function formatDateForSchedule(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getPickupDates() {
    const today = startOfDay(new Date());
    const dates: PickupDate[] = [];
    const maxDaysToCheck = 21;

    for (let offset = 0; offset <= maxDaysToCheck && dates.length < 4; offset += 1) {
        const date = new Date(today);
        date.setDate(today.getDate() + offset);

        if (!STORE_PICKUP_WEEKDAYS.includes(date.getDay())) {
            continue;
        }

        dates.push({
            date,
            label: offset === 0 ? 'Hoje' : dayLabels[date.getDay()],
            day: String(date.getDate()),
            month: monthLabels[date.getMonth()],
        });
    }

    return dates;
}

function getScheduleValue(date: Date, window: PickupWindow) {
    return `${formatDateForSchedule(date)}T${window.start}:00`;
}

function formatWindowLabel(window: PickupWindow) {
    return `Retirar entre ${window.start} e ${window.end}`;
}

export function ModalAgendarEntrega({ open, onClose }: Props) {
    const [pickupDates, setPickupDates] = React.useState<PickupDate[]>([]);
    const [selectedDate, setSelectedDate] = React.useState<PickupDate | undefined>(undefined);
    const [selectedWindow, setSelectedWindow] = React.useState<PickupWindow | undefined>(undefined);
    const { setCartSchedule } = useCart();

    React.useEffect(() => {
        if (!open) return;
        const nextPickupDates = getPickupDates();
        setPickupDates(nextPickupDates);
        setSelectedDate(nextPickupDates[0]);
        setSelectedWindow(undefined);
    }, [open]);

    const handleConfirm = () => {
        if (!selectedDate || !selectedWindow) {
            toast.error('Selecione um horário para retirada.');
            return;
        }

        setCartSchedule(getScheduleValue(selectedDate.date, selectedWindow));
        onClose();
        toast.success('Horário de retirada agendado com sucesso!');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="h-[82vh] w-11/12 max-w-[390px] overflow-hidden rounded-md bg-white p-0">
                <DialogHeader className="border-b px-5 pb-4 pt-5">
                    <DialogTitle className="text-center text-[19px] font-extrabold text-dark-900">
                        Quando quer retirar?
                    </DialogTitle>
                    <DialogDescription className="text-center text-[12px] leading-4 text-dark-500">
                        Atendemos aos sábados e domingos, geralmente a partir das 11h30.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-4 gap-2 pb-4">
                        {pickupDates.map((item) => {
                            const isSelected = selectedDate?.date.getTime() === item.date.getTime();

                            return (
                                <button
                                    type="button"
                                    key={item.date.toISOString()}
                                    onClick={() => {
                                        setSelectedDate(item);
                                        setSelectedWindow(undefined);
                                    }}
                                    className={`h-[74px] min-w-0 rounded-md border bg-white text-center duration-200 ${isSelected ? 'border-2 border-emerald-500 text-emerald-600' : 'border-neutral-200 text-dark-500'}`}>
                                    <span className="block text-[12px] font-semibold leading-4">{item.label}</span>
                                    <strong className="block text-[31px] leading-8">{item.day}</strong>
                                    <span className="block text-[10px] font-bold uppercase leading-3">{item.month}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="mb-3 text-[14px] font-extrabold text-dark-800">Para agora:</h3>
                        <div className="grid grid-cols-[32px_1fr] items-center gap-3 rounded-md border-2 border-red-700 bg-white p-4 text-dark-500">
                            <IoWarning size={25} className="text-dark-500" />
                            <p className="text-[13px] font-semibold leading-5">
                                No momento não estamos aceitando pedidos para retirar agora.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="mb-3 text-[14px] font-extrabold text-dark-800">Para agendar:</h3>
                        <div className="space-y-2 pb-20">
                            {STORE_PICKUP_TIME_WINDOWS.map((window) => {
                                const isSelected = selectedWindow?.start === window.start && selectedWindow?.end === window.end;

                                return (
                                    <button
                                        type="button"
                                        key={`${window.start}-${window.end}`}
                                        onClick={() => setSelectedWindow(window)}
                                        className={`flex h-[58px] w-full items-center justify-between rounded-md border bg-white px-4 text-left duration-200 ${isSelected ? 'border-2 border-emerald-500' : 'border-neutral-200'}`}>
                                        <span className="text-[14px] font-semibold text-dark-700">
                                            {formatWindowLabel(window)}
                                        </span>
                                        {isSelected
                                            ? <FaCircleCheck size={25} className="text-emerald-500" />
                                            : <FaRegCircle size={25} className="text-dark-500" />
                                        }
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
                    <Button
                        type="button"
                        variant="success"
                        disabled={!selectedDate || !selectedWindow}
                        className="h-12 w-full text-[15px] font-extrabold"
                        onClick={handleConfirm}>
                        Confirmar horário
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
