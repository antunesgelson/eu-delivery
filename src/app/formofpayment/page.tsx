'use client'
import useCart from "@/hook/useCart";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { type ComponentType, useState } from "react";
import { FaCreditCard, FaMoneyBillWave } from "react-icons/fa";
import { FaCircleCheck, FaPix, FaRegCircle } from "react-icons/fa6";
import { toast } from "sonner";

type PaymentTab = 'delivery' | 'online';

const PAYMENT_GROUPS = {
    delivery: {
        label: 'Pagamento na Entrega',
        description: 'Pague no momento da retirada.',
        options: [
            {
                title: 'Dinheiro',
                Icon: FaMoneyBillWave,
            },
            {
                title: 'Cartão',
                Icon: FaCreditCard,
            },
        ],
    },
    online: {
        label: 'Pagamento online',
        description: 'Pague agora para agilizar a retirada.',
        options: [
            {
                title: 'Pix',
                Icon: FaPix,
            },
            {
                title: 'Cartão de crédito',
                Icon: FaCreditCard,
            },
        ],
    },
} satisfies Record<PaymentTab, {
    label: string;
    description: string;
    options: Array<{
        title: string;
        Icon: ComponentType<{ className?: string; size?: number }>;
    }>;
}>;

export default function FormOfPayment() {
    const [activeTab, setActiveTab] = useState<PaymentTab>('delivery');
    const [checked, setChecked] = useState<string | null>(null);
    const router = useRouter();
    const { setPaymentMethod } = useCart();

    const currentGroup = PAYMENT_GROUPS[activeTab];

    const handleChoosePayment = (paymentTitle: string) => {
        const paymentLabel = `${currentGroup.label} - ${paymentTitle}`;
        setChecked(paymentLabel);
        setPaymentMethod(paymentLabel);
        toast.success('Forma de pagamento selecionada.');
        router.replace('/checkout');
    };

    return (
        <motion.div className="mt-12"
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}>

            <div className='p-4 leading-3 mt-3 text-center'>
                <h1 className="uppercase text-base font-bold ">qual a forma de pagamento?</h1>
                <span className="text-[11px] text-muted-foreground">O pedido só é confirmado mediante pagamento.</span>
            </div>

            <section className="px-4 pb-4">
                <div className="grid grid-cols-2 rounded-md border bg-white p-1 text-[12px] font-extrabold">
                    {(Object.keys(PAYMENT_GROUPS) as PaymentTab[]).map((tab) => (
                        <button
                            type="button"
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setChecked(null);
                            }}
                            className={`h-10 rounded-md px-2 leading-4 duration-200 ${activeTab === tab ? 'bg-[#f97316] text-white shadow-sm' : 'text-dark-500'}`}>
                            {PAYMENT_GROUPS[tab].label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="px-4 text-sm">
                <div className="mb-3 leading-4">
                    <h2 className="text-[15px] font-extrabold text-dark-900">{currentGroup.label}</h2>
                    <span className="text-[12px] text-muted-foreground">{currentGroup.description}</span>
                </div>

                <div className="space-y-2">
                    {currentGroup.options.map((item) => {
                        const paymentLabel = `${currentGroup.label} - ${item.title}`;
                        const isSelected = checked === paymentLabel;

                        return (
                            <button
                                type="button"
                                key={paymentLabel}
                                className={`flex h-[64px] w-full items-center justify-between rounded-lg border bg-white p-4 text-left duration-300 ${isSelected ? 'border-2 border-emerald-500' : 'border-neutral-200'}`}
                                onClick={() => handleChoosePayment(item.title)}>
                                <div className="flex min-w-0 items-center gap-3">
                                    {item.Icon && <item.Icon className={isSelected ? 'text-emerald-500' : 'text-dark-500'} size={20} />}
                                    <div className="min-w-0 leading-4">
                                        <span className="font-semibold uppercase">{item.title}</span>
                                        <span className="block text-[11px] normal-case text-muted-foreground">
                                            {activeTab === 'delivery' ? 'Pague ao retirar seu pedido' : 'Pagamento antecipado'}
                                        </span>
                                    </div>
                                </div>
                                {isSelected
                                    ? <FaCircleCheck size={25} className="text-emerald-500" />
                                    : <FaRegCircle size={25} className="text-dark-500" />
                                }
                            </button>
                        );
                    })}
                </div>
            </section>
        </motion.div>
    )
}
