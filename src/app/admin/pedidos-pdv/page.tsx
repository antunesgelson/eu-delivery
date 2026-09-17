'use client'
import { dataDaLoja, datasAtendimento, useHorarios } from '@/hook/useAgendamento';

import Image from "next/image";
import React from "react";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useCardapio } from '@/hook/useLoja';
import { api,mostrarErro } from '@/service/api';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import {
    FaArrowTrendUp,
    FaBolt,
    FaBookmark,
    FaBoxesStacked,
    FaChevronRight,
    FaClone,
    FaCreditCard,
    FaFilter,
    FaFloppyDisk,
    FaGear,
    FaMagnifyingGlass,
    FaMinus,
    FaMoneyBillWave,
    FaPercent,
    FaPhone,
    FaPlus,
    FaReceipt,
    FaRegCommentDots,
    FaRegTrashCan,
    FaStore,
    FaTruckFast,
    FaUser,
} from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { SiPix } from "react-icons/si";

type PosProduct = {
    id: number;
    title: string;
    description: string;
    categoryId: string;
    categoryTitle: string;
    price: number;
    image: string;
    soldOut: boolean;
    promotional: boolean;
}

type MenuSection = {
    id: string;
    title: string;
    productIds: number[];
    featured?: boolean;
}

type OrderItem = {
    id: string;
    productId: number;
    title: string;
    price: number;
    quantity: number;
    note: string;
}

type PaymentMethod = 'pix' | 'cash' | 'card' | 'split';
type PaymentStatus = 'pending' | 'paid';
type FulfillmentMethod = 'balcao' | 'retirada' | 'entrega';
type AdjustmentDirection = 'discount' | 'addition';
type AdjustmentType = 'fixed' | 'percent' | 'coupon' | 'cashback';
type ScheduledPickupDay = 'saturday' | 'sunday';
type PdvModal = 'fulfillment' | 'adjustment' | null;

const PROMOTION_SECTION_ID = 'promocao';

const paymentLabels: Record<PaymentMethod, string> = {
    pix: 'Pix',
    cash: 'Dinheiro',
    card: 'Cartão',
    split: 'Dividir',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
    pending: 'a receber',
    paid: 'pago',
};

const fulfillmentLabels: Record<FulfillmentMethod, string> = {
    balcao: 'Balcão',
    retirada: 'Retirada',
    entrega: 'Entrega',
};

const adjustmentTypeLabels: Record<AdjustmentType, string> = {
    fixed: 'Valor fixo (R$)',
    percent: 'Percentual (%)',
    coupon: 'Cupom desconto',
    cashback: 'Cashback',
};

const adjustmentTypesByDirection: Record<AdjustmentDirection, AdjustmentType[]> = {
    discount: ['fixed', 'percent', 'coupon', 'cashback'],
    addition: ['fixed', 'percent'],
};

function formatPickupDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
    }).format(date);
}

function formatPhoneInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 2) {
        return digits ? `(${digits}` : '';
    }

    if (digits.length <= 3) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    if (digits.length <= 7) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function getUpcomingWeekendDates() {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilSaturday = currentDay === 0 ? 6 : (6 - currentDay + 7) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);

    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);

    return {
        saturday: formatPickupDate(saturday),
        sunday: formatPickupDate(sunday),
    };
}

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function getProductCardStatus(product: PosProduct) {
    if (product.soldOut) {
        return 'ESGOTADO';
    }

    if (product.promotional) {
        return 'PROMOÇÃO';
    }

    return null;
}

function Shortcut({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex min-h-[20px] items-center rounded bg-[#eef2f5] px-1.5 text-[10px] font-extrabold uppercase leading-none text-[#6b7280]">
            {children}
        </span>
    );
}

function sanitizeQuantity(value: number) {
    if (Number.isNaN(value) || value < 1) {
        return 1;
    }

    return Math.min(Math.floor(value), 99);
}

function SectionNavCard({
    section,
    active,
    onClick,
}: {
    section: MenuSection;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative flex h-[64px] w-full items-center justify-center overflow-hidden rounded-md border px-2 text-center text-[11px] font-extrabold uppercase leading-[14px] shadow-sm transition",
                active
                    ? "border-[#0b98f6] bg-[#064a70] text-white"
                    : "border-[#d8dde3] bg-white text-[#5f6670] hover:border-[#b7c6d4] hover:bg-[#f8fafc]"
            )}
        >
            <span className="line-clamp-2 break-words">{section.title}</span>
            {section.featured && (
                <span className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-bl-md bg-[#0b98f6] text-white">
                    <FaPercent size={10} />
                </span>
            )}
        </button>
    );
}

function ProductTile({
    product,
    selected,
    quantity,
    onSelect,
    onQuantityChange,
}: {
    product: PosProduct;
    selected: boolean;
    quantity: number;
    onSelect: () => void;
    onQuantityChange: (value: number) => void;
}) {
    const status = getProductCardStatus(product);

    return (
        <div
            className={cn(
                "group relative flex h-[176px] min-w-0 flex-col overflow-hidden rounded-md border bg-white text-left shadow-sm transition hover:border-[#0b98f6] hover:shadow-md",
                selected
                    ? "border-[#0b98f6] shadow-md ring-2 ring-[#0b98f6]/25"
                    : "border-[#d8dde3]",
                product.soldOut && "opacity-70"
            )}
        >
            <button
                type="button"
                onClick={onSelect}
                className="flex min-h-0 flex-1 flex-col text-left"
            >
                <div className="relative h-[104px] w-full shrink-0 overflow-hidden bg-[#eef2f6]">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            sizes="130px"
                            className="object-cover transition duration-200 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-[#98a2b3]">
                            <FaBoxesStacked size={20} />
                        </div>
                    )}

                    {status && (
                        <div className={cn(
                            "absolute inset-x-0 bottom-0 flex h-5 items-center justify-center text-[10px] font-extrabold uppercase text-white",
                            product.soldOut ? "bg-[#242424]/90" : "bg-[#0b98f6]"
                        )}>
                            {status}
                        </div>
                    )}

                    {product.promotional && !product.soldOut && (
                        <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded bg-[#0b98f6] text-white shadow-sm">
                            <FaPercent size={10} />
                        </div>
                    )}

                    {selected && (
                        <div className="absolute inset-0 flex flex-col justify-end bg-[#111827]/70 p-2.5 text-white">
                            <strong className="line-clamp-2 text-[12px] font-extrabold leading-[15px]">
                                {product.title}
                            </strong>
                            <div className="mt-1 flex items-end justify-between gap-2">
                                <span className="text-[14px] font-extrabold leading-5">
                                    {formatCurrency(product.price * quantity)}
                                </span>
                                {quantity > 1 && (
                                    <span className="truncate text-[9px] font-bold text-white/80">
                                        {quantity} x {formatCurrency(product.price)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className={cn(
                    "flex min-h-0 flex-1 flex-col justify-between px-2.5 py-2",
                    selected && "hidden"
                )}>
                    <strong className="line-clamp-2 text-[12px] font-extrabold leading-[15px] text-[#4f5660]">
                        {product.title}
                    </strong>

                    <div className="mt-1">
                        <span className="text-[15px] font-extrabold leading-5 text-[#2f353d]">
                            {formatCurrency(product.price)}
                        </span>
                    </div>
                </div>
            </button>

            {selected && (
                <div className="border-t border-[#d8e4ef] bg-[#f1f9ff] px-2.5 py-1.5">
                    <div className="grid h-8 grid-cols-[30px_minmax(0,1fr)_30px] overflow-hidden rounded-md border border-[#0b98f6] bg-white">
                        <button
                            type="button"
                            onClick={() => onQuantityChange(sanitizeQuantity(quantity - 1))}
                            className="flex items-center justify-center border-r border-[#d8e4ef] text-[#667085] hover:bg-[#eef8ff]"
                            aria-label={`Diminuir quantidade de ${product.title}`}
                        >
                            <FaMinus size={10} />
                        </button>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={quantity}
                            onChange={(event) => onQuantityChange(sanitizeQuantity(Number(event.target.value.replace(/\D/g, ''))))}
                            className="min-w-0 bg-white px-1 text-center text-[14px] font-extrabold text-[#303740] outline-none"
                            aria-label={`Quantidade de ${product.title}`}
                        />
                        <button
                            type="button"
                            onClick={() => onQuantityChange(sanitizeQuantity(quantity + 1))}
                            className="flex items-center justify-center border-l border-[#d8e4ef] text-[#667085] hover:bg-[#eef8ff]"
                            aria-label={`Aumentar quantidade de ${product.title}`}
                        >
                            <FaPlus size={11} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PanelActionButton({
    icon,
    label,
    active,
    className,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    className?: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border px-2 text-[11px] font-extrabold leading-[13px] transition",
                active
                    ? "border-[#0b98f6] bg-[#0b98f6] text-white shadow-sm hover:bg-[#0789df]"
                    : "border-[#b9c7d2] bg-white text-[#9aabba] hover:border-[#0b98f6] hover:bg-[#f7fbff]",
                className
            )}
        >
            <span className="shrink-0">{icon}</span>
            <span className="truncate">{label}</span>
        </button>
    );
}

function PaymentOptionCard({
    icon,
    shortcut,
    title,
    description,
    selected,
    recommended,
    badges,
    onClick,
}: {
    icon: React.ReactNode;
    shortcut: string;
    title: string;
    description: string;
    selected?: boolean;
    recommended?: boolean;
    badges?: Array<{ icon: React.ReactNode; label: string }>;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative w-full rounded-md border bg-white p-3 text-left transition hover:border-[#0b98f6] hover:bg-[#f8fcff]",
                recommended
                    ? "border-dashed border-[#35c9bb] bg-[#effdfb]"
                    : "border-dashed border-[#d2d6dc]",
                selected && "border-[#0b98f6] bg-[#0b98f6] text-white shadow-md ring-2 ring-[#0b98f6]/20 hover:bg-[#0789df]"
            )}
        >
            {recommended && (
                <span className="absolute -top-2 left-3 rounded-md bg-[#16a34a] px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                    Recomendado
                </span>
            )}

            <div className="flex items-center gap-2.5 pr-7">
                <span className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[#35c9bb] shadow-sm [&_svg]:h-4 [&_svg]:w-4",
                    selected && "text-[#0b98f6]"
                )}>
                    {icon}
                </span>
                <span className="min-w-0">
                    <strong className={cn(
                        "block text-[12px] font-extrabold leading-4 text-[#171b20]",
                        selected && "text-white"
                    )}>
                        [{shortcut}] {title}
                    </strong>
                    <span className={cn(
                        "block text-[10px] font-semibold leading-3 text-[#5f6670]",
                        selected && "text-white/85"
                    )}>
                        {description}
                    </span>
                </span>
                <FaChevronRight
                    className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a7b0]",
                        selected && "text-white"
                    )}
                    size={14}
                />
            </div>

            {badges?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {badges.map((badge) => (
                        <span
                            key={badge.label}
                            className={cn(
                                "inline-flex h-5 items-center gap-1 rounded-md bg-[#dff5f2] px-1.5 text-[9px] font-extrabold text-[#5f6670] [&_svg]:h-2.5 [&_svg]:w-2.5",
                                selected && "bg-white/20 text-white"
                            )}
                        >
                            {badge.icon}
                            {badge.label}
                        </span>
                    ))}
                </div>
            ) : null}
        </button>
    );
}

function AdjustmentTab({
    active,
    children,
    onClick,
}: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex h-12 flex-1 items-center justify-center border border-[#c9ced4] text-[16px] font-extrabold transition first:rounded-l-md last:rounded-r-md",
                active
                    ? "border-[#0b98f6] bg-[#0b98f6] text-white"
                    : "bg-white text-[#9aa8b5] hover:bg-[#f8fafc]"
            )}
        >
            {children}
        </button>
    );
}

function AdjustmentRadio({
    checked,
    label,
    onClick,
}: {
    checked: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-9 items-center gap-3 text-left text-[15px] font-extrabold text-[#2e3339]"
        >
            <span
                className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2",
                    checked ? "border-[#0b98f6]" : "border-[#a9b0b8]"
                )}
            >
                {checked && <span className="h-2.5 w-2.5 rounded-full bg-[#0b98f6]" />}
            </span>
            {label}
        </button>
    );
}

export default function PedidosPdvPage() {
    const menu=useCardapio(),queryClient=useQueryClient();
    const products:PosProduct[]=React.useMemo(()=>(menu.data??[]).flatMap(c=>c.produtos.map(p=>({id:p.id,title:p.titulo,description:p.descricao,categoryId:String(c.id),categoryTitle:c.titulo,price:Number(p.valor),image:p.imgs?.[0]?.Location??'',soldOut:Boolean((p as any).esgotado),promotional:p.valorPromocional>0}))),[menu.data]);
    const menuSections:MenuSection[]=React.useMemo(()=>(menu.data??[]).map(c=>({id:String(c.id),title:c.titulo,productIds:c.produtos.map(p=>p.id)})),[menu.data]);
    const draftQuery=useQuery<any[]>({queryKey:['pdv-rascunhos'],queryFn:async()=>(await api.get('/admin/pdv/rascunhos')).data});
    const [draftOpen,setDraftOpen]=React.useState(false);
    const [deliveryAddress,setDeliveryAddress]=React.useState({apelido:'Entrega PDV',rua:'',numero:'',bairro:'',cep:'',complemento:'',referencia:''});
    const configs=useQuery<any[]>({queryKey:['configuracao'],queryFn:async()=>(await api.get('/configuracao')).data});
    const deliveryConfig=(()=>{try{return JSON.parse(configs.data?.find(c=>c.chave==='ENTREGA')?.valor??'{}');}catch{return {};}})();
    const [split,setSplit]=React.useState({cash:'',card:'',pix:''});
    const orderKey=React.useRef(crypto.randomUUID());
    const createOrder=useMutation({mutationFn:async(payload:any)=>(await api.post('/admin/pdv',payload,{headers:{'Idempotency-Key':orderKey.current}})).data});
    const saveDraft=useMutation({mutationFn:async(dados:any)=>api.post('/admin/pdv/rascunhos',{dados}),onSuccess:()=>{void draftQuery.refetch();toast.success('Rascunho salvo.');},onError:mostrarErro});
    const deleteDraft=useMutation({mutationFn:async(id:number)=>api.delete(`/admin/pdv/rascunhos/${id}`),onSuccess:()=>{void draftQuery.refetch();},onError:mostrarErro});
    const [search, setSearch] = React.useState('');
    const [selectedProductId, setSelectedProductId] = React.useState<number | null>(null);
    const [activeSectionId, setActiveSectionId] = React.useState<string | null>(null);
    const [quantity, setQuantity] = React.useState(1);
    const [orderNote, setOrderNote] = React.useState('');
    const [orderNoteDraft, setOrderNoteDraft] = React.useState('');
    const [orderNoteModalOpen, setOrderNoteModalOpen] = React.useState(false);
    const [orderItems, setOrderItems] = React.useState<OrderItem[]>([]);
    const [clientPhone, setClientPhone] = React.useState('');
    const [clientName, setClientName] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod | null>(null);
    const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>('pending');
    const [fulfillmentMethod, setFulfillmentMethod] = React.useState<FulfillmentMethod>('retirada');
    const [pickupScheduled, setPickupScheduled] = React.useState(false);
    const [scheduledDay, setScheduledDay] = React.useState('');
    const [scheduledTime, setScheduledTime] = React.useState('');
    const [priceAdjustment, setPriceAdjustment] = React.useState(0);
    const [adjustmentDirection, setAdjustmentDirection] = React.useState<AdjustmentDirection>('discount');
    const [adjustmentType, setAdjustmentType] = React.useState<AdjustmentType>('fixed');
    const [adjustmentAmount, setAdjustmentAmount] = React.useState('');
    const [activeModal, setActiveModal] = React.useState<PdvModal>(null);
    const [paymentSheetOpen, setPaymentSheetOpen] = React.useState(false);
    const drafts=draftQuery.data?.length??0;

    const selectedProduct = React.useMemo(
        () => products.find((product) => product.id === selectedProductId) ?? null,
        [selectedProductId,products]
    );

    const scheduledPickupDayOptions = React.useMemo(() => datasAtendimento(configs.data), [configs.data]);
    const scheduleQuery = useHorarios(scheduledDay, pickupScheduled);
    const scheduledPickupTimes = (scheduleQuery.data ?? []).filter(s => s.disponivel).map(s => s.horario);
    const [generating, setGenerating] = React.useState(false);
    const generatingRef = React.useRef(false);

    const filteredProducts = React.useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return products.filter((product) => (
            !normalizedSearch
                || product.title.toLowerCase().includes(normalizedSearch)
                || product.description.toLowerCase().includes(normalizedSearch)
                || product.categoryTitle.toLowerCase().includes(normalizedSearch)
        ));
    }, [search,products]);

    const visibleGroups = React.useMemo(() => {
        return menuSections
            .map((section) => ({
                ...section,
                products: filteredProducts.filter((product) => section.productIds.includes(product.id)),
            }))
            .filter((section) => section.products.length > 0);
    }, [filteredProducts,menuSections]);

    const subtotal = orderItems.reduce((totalValue, item) => totalValue + item.price * item.quantity, 0);
    const deliveryFee=fulfillmentMethod==='entrega'?Number(deliveryConfig.taxa??0):0;
    const total = Math.max(0, subtotal + deliveryFee + priceAdjustment);
    const paymentLabel = paymentMethod ? paymentLabels[paymentMethod] : 'Pagamento';
    const paymentButtonLabel = paymentMethod
        ? `[ R ] ${paymentLabel} ${paymentStatusLabels[paymentStatus]}`
        : '[ R ] Pagamento';
    const fulfillmentLabel = fulfillmentLabels[fulfillmentMethod];
    const scheduledDayLabel = scheduledDay
        ? scheduledPickupDayOptions.find((day) => day.value === scheduledDay)?.title
        : null;
    const scheduledDateLabel = scheduledDay ? scheduledPickupDayOptions.find(d => d.value === scheduledDay)?.label : null;

    function handleNavigateSection(sectionId: string) {
        setActiveSectionId(sectionId);
        document.getElementById(`pdv-section-${sectionId}`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }

    function handleSelectProduct(product: PosProduct) {
        setSelectedProductId(product.id);
        setQuantity(1);
    }

    function handleFinalizeItem() {
        if (!selectedProduct || selectedProduct.soldOut) {
            toast.error('Item indisponível no PDV.');
            return;
        }

        setOrderItems((currentItems) => {
            const existingItem = currentItems.find((item) => item.productId === selectedProduct.id);

            if (existingItem) {
                return currentItems.map((item) => (
                    item.id === existingItem.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                ));
            }

            return [
                ...currentItems,
                {
                    id: `${selectedProduct.id}-${Date.now()}`,
                    productId: selectedProduct.id,
                    title: selectedProduct.title,
                    price: selectedProduct.price,
                    quantity,
                    note: '',
                },
            ];
        });
        setQuantity(1);
    }

    function handleChangeItemQuantity(itemId: string, direction: 'increase' | 'decrease') {
        setOrderItems((currentItems) => (
            currentItems
                .map((item) => {
                    if (item.id !== itemId) {
                        return item;
                    }

                    const nextQuantity = direction === 'increase' ? item.quantity + 1 : item.quantity - 1;

                    return { ...item, quantity: Math.max(0, nextQuantity) };
                })
                .filter((item) => item.quantity > 0)
        ));
    }

    function draftData(){return {orderItems,clientPhone,clientName,orderNote,paymentMethod,paymentStatus,fulfillmentMethod,pickupScheduled,scheduledDay,scheduledTime,priceAdjustment,adjustmentDirection,adjustmentType,adjustmentAmount,split,deliveryAddress};}
    function restoreDraft(d:any){setOrderItems(d.orderItems??[]);setClientPhone(d.clientPhone??'');setClientName(d.clientName??'');setOrderNote(d.orderNote??'');setPaymentMethod(d.paymentMethod??null);setPaymentStatus(d.paymentStatus??'pending');setFulfillmentMethod(d.fulfillmentMethod??'retirada');setPickupScheduled(d.pickupScheduled??false);setScheduledDay(d.scheduledDay??'');setScheduledTime(d.scheduledTime??'');setPriceAdjustment(d.priceAdjustment??0);setAdjustmentDirection(d.adjustmentDirection??'discount');setAdjustmentType(d.adjustmentType??'fixed');setAdjustmentAmount(d.adjustmentAmount??'');setSplit(d.split??{cash:'',card:'',pix:''});orderKey.current=crypto.randomUUID();setDeliveryAddress(d.deliveryAddress??{apelido:'Entrega PDV',rua:'',numero:'',bairro:'',cep:'',complemento:'',referencia:''});setDraftOpen(false);}
    async function handleGenerateOrder(){
      if(generatingRef.current)return;
      if(!orderItems.length||!clientName.trim()||clientPhone.replace(/\D/g,'').length<10||!paymentMethod){toast.error('Preencha cliente, telefone, itens e pagamento.');return;}
      generatingRef.current=true;setGenerating(true);
      try{
       const customer=(await api.post('/admin/clientes',{nome:clientName.trim(),tel:'55'+clientPhone.replace(/\D/g,'')})).data;
       if(pickupScheduled && (!scheduledDay || !scheduledTime)){toast.error('Escolha dia e horário.');return;}
       const day=pickupScheduled?scheduledDay:dataDaLoja();
       const slots=(await api.get(`/pedido/horarios/${day}`)).data;
       const slot=slots.find((s:any)=>s.disponivel&&(!pickupScheduled||s.horario===scheduledTime));
       if(!slot){toast.error('Não há horário disponível. Agende a retirada para outro dia.');return;}
       const payments=paymentMethod==='split'?Object.entries(split).filter(([,v])=>Number(v)>0).map(([method,v])=>({metodo:method,valor:Number(v)})):undefined;
       const payload={clienteId:customer.id,itens:orderItems.map(i=>({produtoId:i.productId,quantidade:i.quantity,obs:i.note})),dataEntrega:slot.data,canal:fulfillmentMethod,formaPagamento:paymentMethod==='cash'?'Pagamento na Entrega - Dinheiro':paymentMethod==='pix'?'Pagamento na Entrega - Pix':paymentMethod==='split'?'Pagamento na Entrega - Dividido':'Pagamento na Entrega - Cartão',pagamentoStatus:paymentStatus,obs:orderNote,ajuste:['fixed','percent'].includes(adjustmentType)?Math.round(priceAdjustment*100)/100:0,cupom:adjustmentType==='coupon'?adjustmentAmount.trim().toUpperCase():undefined,cashBack:adjustmentType==='cashback'?Number(adjustmentAmount.replace(',','.')):undefined,pagamentos:payments,endereco:fulfillmentMethod==='entrega'?{...deliveryAddress,cep:deliveryAddress.cep.replace(/\D/g,'')}:undefined};
       const order=await createOrder.mutateAsync(payload);orderKey.current=crypto.randomUUID();toast.success(`Pedido #${order.id} criado — ${formatCurrency(order.valorFinal)}.`);setOrderItems([]);setPriceAdjustment(0);setAdjustmentAmount('');await Promise.all(['operacao','pedidos','cardapio'].map(key=>queryClient.invalidateQueries({queryKey:[key]})));
      }catch(e){mostrarErro(e);}finally{generatingRef.current=false;setGenerating(false);}
    }
    function handleSaveDraft(){if(!orderItems.length){setDraftOpen(true);return;}saveDraft.mutate(draftData());}

    const openOrderNoteModal = React.useCallback(() => {
        setOrderNoteDraft(orderNote);
        setOrderNoteModalOpen(true);
    }, [orderNote]);

    function handleSaveOrderNote() {
        setOrderNote(orderNoteDraft.trim());
        setOrderNoteModalOpen(false);
    }

    function handleApplyAdjustment() {
        if(adjustmentType==='coupon'){setPriceAdjustment(0);setActiveModal(null);toast.info('O cupom será validado e calculado ao gerar o pedido.');return;}
        const parsedAmount = Number(adjustmentAmount.replace(',', '.'));

        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            setPriceAdjustment(0);
            setAdjustmentAmount('');
            setActiveModal(null);
            return;
        }

        const normalizedAmount = adjustmentType === 'percent'
            ? subtotal * (parsedAmount / 100)
            : parsedAmount;
        const signedAdjustment = adjustmentDirection === 'discount'
            ? -Math.abs(normalizedAmount)
            : Math.abs(normalizedAmount);

        setPriceAdjustment(signedAdjustment);
        setActiveModal(null);
    }

    React.useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null;
            const isTyping = target
                && (
                    target.tagName === 'INPUT'
                    || target.tagName === 'TEXTAREA'
                    || target.tagName === 'SELECT'
                    || target.isContentEditable
                );

            const shortcut = event.key.toLowerCase();

            if (
                isTyping
                || event.altKey
                || event.ctrlKey
                || event.metaKey
                || activeModal
                || paymentSheetOpen
                || orderNoteModalOpen
            ) {
                return;
            }

            if (shortcut === 'o') {
                event.preventDefault();
                openOrderNoteModal();
                return;
            }

            if (shortcut === 'r') {
                event.preventDefault();
                setPaymentSheetOpen(true);
                return;
            }

            if (shortcut === 'e') {
                event.preventDefault();
                setActiveModal('fulfillment');
                return;
            }

            if (shortcut === 'f') {
                event.preventDefault();
                setActiveModal('adjustment');
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeModal, openOrderNoteModal, orderNoteModalOpen, paymentSheetOpen]);

    return (
        <main className="min-h-[calc(100vh-57px)] bg-[#f3f5f8] p-3 pr-12">
            <section className="grid h-[calc(100vh-81px)] min-h-[620px] grid-cols-[minmax(0,1fr)_430px] gap-3">
                <div className="grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-md bg-white shadow-sm">
                    <div className="border-b border-[#e5e8ec] p-2.5">
                        <div className="grid grid-cols-[180px_minmax(0,1fr)_56px] gap-2.5">
                            <button
                                type="button"
                                className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#d5dae1] bg-white text-[13px] font-extrabold text-[#5f6670] shadow-sm hover:bg-[#f8fafc]"
                            >
                                <FaFilter size={16} />
                                Filtros
                            </button>
                            <label className="relative min-w-0">
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="[ P ] Pesquisar"
                                    className="h-10 w-full rounded-md border border-[#d5dae1] bg-white px-4 pr-12 text-[14px] font-semibold text-[#2f353d] outline-none placeholder:text-[#a5acb5] focus:border-[#0b98f6] focus:ring-2 focus:ring-[#0b98f6]/20"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-11 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#98a2b3] hover:bg-[#eef2f6]"
                                        aria-label="Limpar pesquisa"
                                    >
                                        <IoClose size={16} />
                                    </button>
                                )}
                            </label>
                            <button
                                type="button"
                                className="flex h-10 items-center justify-center rounded-md border border-[#d5dae1] bg-white text-[#5f6670] hover:bg-[#f8fafc]"
                                aria-label="Pesquisar"
                            >
                                <FaMagnifyingGlass size={19} />
                            </button>
                        </div>
                    </div>

                    <div className="grid min-h-0 grid-cols-[158px_minmax(0,1fr)]">
                        <nav className="min-h-0 overflow-y-auto border-r border-[#e5e8ec] bg-[#fbfcfd] p-2.5">
                            <div className="mb-2 px-1 text-[11px] font-extrabold text-[#5f6670]">
                                [ N ] Navegar
                            </div>
                            <div className="space-y-2">
                                {menuSections.map((section) => (
                                    <SectionNavCard
                                        key={section.id}
                                        section={section}
                                        active={activeSectionId === section.id}
                                        onClick={() => handleNavigateSection(section.id)}
                                    />
                                ))}
                            </div>
                        </nav>

                        <div className="min-h-0 overflow-y-auto p-3">
                            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold text-[#68727f]">
                                <span>{filteredProducts.length} itens do cardápio</span>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-2">
                                        <Shortcut>⌘</Shortcut>
                                        Navegação
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Shortcut>Enter</Shortcut>
                                        Selecionar item
                                    </span>
                                </div>
                            </div>

                            {visibleGroups.length > 0 ? (
                                <div className="space-y-4 pb-3">
                                    {visibleGroups.map((group) => (
                                        <section
                                            key={group.id}
                                            id={`pdv-section-${group.id}`}
                                            className="scroll-mt-3"
                                        >
                                            <div className="mb-1.5 flex items-center gap-2">
                                                <h3 className="text-[14px] font-extrabold text-[#5b6067]">{group.title}</h3>
                                                {group.featured && (
                                                    <span className="rounded-md bg-[#0b98f6] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                                                        10% OFF
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-[repeat(auto-fill,minmax(124px,142px))] items-start justify-start gap-3">
                                                {group.products.map((product) => (
                                                    <ProductTile
                                                        key={product.id}
                                                        product={product}
                                                        selected={selectedProduct?.id === product.id}
                                                        quantity={quantity}
                                                        onSelect={() => handleSelectProduct(product)}
                                                        onQuantityChange={setQuantity}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-full min-h-[360px] items-center justify-center rounded-md border border-dashed border-[#d7dce2] text-[14px] font-bold text-[#8a94a2]">
                                    Nenhum item encontrado
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-[#e5e8ec] p-3">
                        <button
                            type="button"
                            onClick={handleFinalizeItem}
                            disabled={!selectedProduct || selectedProduct.soldOut}
                            className="flex h-12 w-[300px] items-center justify-center gap-2 rounded-md bg-[#0b98f6] px-4 text-[15px] font-extrabold text-white shadow-sm transition hover:bg-[#0789df] disabled:cursor-not-allowed disabled:bg-[#a9bdca]"
                        >
                            <FaPlus size={16} />
                            Adicionar item
                        </button>
                    </div>
                </div>

                <aside className="grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-md bg-white shadow-sm">
                    <div className="border-b border-[#e5e8ec]">
                        <div className="flex h-[48px] items-center justify-between gap-1.5 px-2">
                            <button
                                type="button"
                                onClick={()=>setDraftOpen(true)}
                                className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-[#0b98f6] bg-[#eff8ff] px-2 text-[11px] font-extrabold text-[#0b86df] hover:bg-[#e2f3ff]"
                            >
                                <FaBookmark size={12} />
                                [ CTRL+X ] Rascunhos
                                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#dbefff] px-1.5 text-[#0b86df]">
                                    {drafts}
                                </span>
                            </button>
                            <div className="flex h-9 shrink-0 overflow-hidden rounded-md border border-[#eef1f4] text-[10px] font-extrabold text-[#8a9097]">
                                <button type="button" className="flex items-center gap-1 px-2 hover:bg-[#f7f9fb]">
                                    <Shortcut>Q</Shortcut>
                                    Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOrderItems([])}
                                    className="flex items-center gap-1 border-l border-[#eef1f4] px-2 hover:bg-[#f7f9fb]"
                                >
                                    <Shortcut>W</Shortcut>
                                    Excluir
                                </button>
                            </div>
                        </div>
                        <div className="grid h-10 grid-cols-[1fr_76px_38px] items-center bg-[#dcdcdc] px-2.5 text-[11px] font-extrabold text-[#5a6068]">
                            <span>Itens do pedido</span>
                            <span className="text-right">Subtotal</span>
                            <button
                                type="button"
                                className="ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-[#c7cbd1] bg-white text-[#87909a]"
                                aria-label="Configurações do pedido"
                            >
                                <FaGear size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="min-h-0 overflow-y-auto">
                        {orderItems.length > 0 ? (
                            <div className="divide-y divide-[#eef1f4]">
                                {orderItems.map((item) => (
                                    <div key={item.id} className="grid grid-cols-[1fr_70px] gap-2 px-3 py-2">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-2">
                                                <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded bg-[#eff8ff] text-[10px] font-extrabold text-[#0b86df]">
                                                    {item.quantity}
                                                </span>
                                                <div className="min-w-0">
                                                    <strong className="line-clamp-2 text-[11px] font-extrabold leading-[14px] text-[#303740]">
                                                        {item.title}
                                                    </strong>
                                                    {item.note && (
                                                        <span className="mt-0.5 block line-clamp-2 text-[10px] font-semibold text-[#8a94a2]">
                                                            {item.note}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleChangeItemQuantity(item.id, 'decrease')}
                                                    className="flex h-6 w-6 items-center justify-center rounded border border-[#d7dce2] text-[#667085] hover:bg-[#f4f6f8]"
                                                    aria-label="Remover unidade"
                                                >
                                                    <FaMinus size={10} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleChangeItemQuantity(item.id, 'increase')}
                                                    className="flex h-6 w-6 items-center justify-center rounded border border-[#d7dce2] text-[#667085] hover:bg-[#f4f6f8]"
                                                    aria-label="Adicionar unidade"
                                                >
                                                    <FaPlus size={11} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setOrderItems((items) => items.filter((currentItem) => currentItem.id !== item.id))}
                                                    className="ml-1 flex h-6 w-6 items-center justify-center rounded border border-[#ffd0d0] text-[#d92d20] hover:bg-[#fff1f1]"
                                                    aria-label="Excluir item"
                                                >
                                                    <FaRegTrashCan size={11} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right text-[11px] font-extrabold text-[#303740]">
                                            {formatCurrency(item.price * item.quantity)}
                                            <span className="mt-0.5 block text-[9px] font-semibold text-[#98a2b3]">
                                                {formatCurrency(item.price)} un.
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[240px] items-center justify-center px-6 text-center text-[12px] font-bold text-[#626a73]">
                                Finalize o item ao lado, ele vai aparecer aqui
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#e5e8ec] bg-white">
                        <button
                            type="button"
                            onClick={openOrderNoteModal}
                            className={cn(
                                "flex min-h-9 w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-bold text-[#0b98f6] hover:bg-[#f7fbff]",
                                orderNote && "bg-[#eff8ff]"
                            )}
                        >
                            <FaRegCommentDots size={13} />
                            <span className="min-w-0 flex-1 truncate">
                                {orderNote ? `[ O ] ${orderNote}` : '[ O ] Observação do pedido'}
                            </span>
                        </button>

                        <div className="border-t border-[#e5e8ec]">
                            <div className="px-3 py-2.5 text-[12px] font-bold text-[#5f6670]">
                                <div className="flex items-center justify-between">
                                    <span>Subtotal</span>
                                    <strong>{formatCurrency(subtotal)}</strong>
                                </div>
                                {pickupScheduled && scheduledDayLabel && scheduledDateLabel && (
                                    <div className="mt-1 flex items-center justify-between gap-3 text-[10px] font-bold text-[#8a94a2]">
                                        <span>Agendado</span>
                                        <span className="truncate text-right">
                                            {scheduledDayLabel} {scheduledDateLabel}
                                            {scheduledTime ? ` às ${scheduledTime}` : ''}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex h-12 items-center justify-between bg-[#dcdcdc] px-3 text-[13px] font-extrabold text-[#555d66]">
                                <span>Total</span>
                                <strong>{formatCurrency(total)}</strong>
                            </div>
                        </div>

                        <div className="space-y-2 px-3 py-2.5">
                            {fulfillmentMethod === 'balcao' ? (
                                <div className="rounded-md border border-[#0b98f6] bg-[#eff8ff] p-2.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <strong className="block text-[12px] font-extrabold uppercase text-[#0b86df]">
                                                Cliente balcão
                                            </strong>
                                            <span className="mt-0.5 block text-[11px] font-semibold text-[#5f6670]">
                                                Venda imediata, telefone não necessário.
                                            </span>
                                        </div>
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#0b86df]">
                                            <FaStore size={15} />
                                        </span>
                                    </div>
                                    <label className="relative mt-2 block min-w-0 overflow-hidden rounded-md border border-[#0b98f6] bg-white">
                                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" size={13} />
                                        <input
                                            value={clientName}
                                            onChange={(event) => setClientName(event.target.value)}
                                            placeholder="Nome ou apelido (opcional)"
                                            className="h-10 w-full bg-white pl-9 pr-3 text-[13px] font-bold capitalize text-[#303740] outline-none placeholder:text-[#a8b1bb]"
                                            aria-label="Nome ou apelido do cliente de balcão"
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 overflow-hidden rounded-md border border-[#0b98f6] bg-white">
                                    <label className="relative min-w-0 border-r border-[#0b98f6]">
                                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" size={13} />
                                        <input
                                            value={clientName}
                                            onChange={(event) => setClientName(event.target.value)}
                                            placeholder="Nome do cliente"
                                            className="h-10 w-full bg-white pl-9 pr-3 text-[13px] font-bold capitalize text-[#303740] outline-none placeholder:text-[#a8b1bb]"
                                            aria-label="Nome ou apelido do cliente"
                                        />
                                    </label>
                                    <label className="relative min-w-0">
                                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" size={13} />
                                        <input
                                            value={clientPhone}
                                            onChange={(event) => setClientPhone(formatPhoneInput(event.target.value))}
                                            placeholder="(XX) X XXXX-XXXX"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            className="h-10 w-full bg-white pl-9 pr-3 text-[13px] font-bold text-[#303740] outline-none placeholder:text-[#a8b1bb]"
                                            aria-label="Telefone"
                                        />
                                    </label>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-1.5">
                                <PanelActionButton
                                    icon={<FaCreditCard size={13} />}
                                    label={paymentButtonLabel}
                                    active={Boolean(paymentMethod)}
                                    onClick={() => setPaymentSheetOpen(true)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                                <PanelActionButton
                                    icon={fulfillmentMethod === 'balcao' ? <FaStore size={13} /> : <FaTruckFast size={13} />}
                                    label={`[ E ] ${fulfillmentLabel}`}
                                    active
                                    onClick={() => setActiveModal('fulfillment')}
                                />
                                <PanelActionButton
                                    icon={<FaMoneyBillWave size={13} />}
                                    label="[ F ] Ajustar R$"
                                    active={priceAdjustment !== 0}
                                    onClick={() => setActiveModal('adjustment')}
                                />
                            </div>

                            <div className="grid grid-cols-[1fr_52px] gap-2 pt-0.5">
                                <button
                                    type="button"
                                    disabled={generating}
                                    onClick={handleGenerateOrder}
                                    className={cn(
                                        "flex h-11 items-center justify-center gap-1.5 rounded-md text-[14px] font-extrabold text-white shadow-sm transition",
                                        orderItems.length
                                            ? "bg-[#0b98f6] hover:bg-[#0789df]"
                                            : "bg-[#9fb7c5]"
                                    )}
                                >
                                    <FaReceipt size={15} />
                                    [ ENTER ] Gerar pedido
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    className="flex h-11 items-center justify-center rounded-md bg-[#9fb7c5] text-white transition hover:bg-[#88a6b6]"
                                    aria-label="Salvar pedido"
                                >
                                    <FaFloppyDisk size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>

            <Sheet open={paymentSheetOpen} onOpenChange={setPaymentSheetOpen}>
                <SheetContent
                    side="right"
                    className="flex w-full max-w-[520px] flex-col gap-0 border-l border-[#d8dde3] bg-white p-0 sm:max-w-[520px]"
                >
                    <SheetHeader className="relative border-b border-[#d8dde3] px-6 py-4 text-left">
                        <SheetTitle className="text-[20px] font-extrabold leading-6 text-[#24272d]">
                            Forma de pagamento
                        </SheetTitle>
                        <SheetDescription className="mt-0.5 text-[12px] font-semibold leading-4 text-[#666d76]">
                            Selecione como o cliente irá pagar
                        </SheetDescription>
                        <SheetClose className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md text-[#7d858f] hover:bg-[#f2f4f7] hover:text-[#303740]">
                            <IoClose size={22} />
                            <span className="sr-only">Fechar</span>
                        </SheetClose>
                    </SheetHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                        <PaymentOptionCard
                            icon={<SiPix size={26} />}
                            shortcut="P"
                            title="Pix"
                            description="Pagamento instantâneo"
                            selected={paymentMethod === 'pix'}
                            recommended
                            badges={[
                                { icon: <FaBolt size={12} />, label: 'Rápido' },
                                { icon: <FaArrowTrendUp size={12} />, label: 'Mais usado' },
                            ]}
                            onClick={() => setPaymentMethod('pix')}
                        />

                        <h3 className="mb-2 mt-5 text-[12px] font-bold text-[#666d76]">
                            Outras formas disponíveis
                        </h3>

                        <div className="space-y-2.5">
                            <PaymentOptionCard
                                icon={<FaMoneyBillWave size={25} className="text-[#22c58b]" />}
                                shortcut="D"
                                title="Dinheiro"
                                description="em espécie no balcão"
                                selected={paymentMethod === 'cash'}
                                onClick={() => setPaymentMethod('cash')}
                            />
                            <PaymentOptionCard
                                icon={<FaCreditCard size={25} className="text-[#52b7ef]" />}
                                shortcut="C"
                                title="Cartão"
                                description="débito ou crédito na máquina"
                                selected={paymentMethod === 'card'}
                                onClick={() => setPaymentMethod('card')}
                            />
                            <PaymentOptionCard
                                icon={<FaClone size={25} className="text-[#1598f6]" />}
                                shortcut="R"
                                title="Dividir"
                                description="combinar formas de pagamento"
                                selected={paymentMethod === 'split'}
                                onClick={() => setPaymentMethod('split')}
                            />
                        </div>

                        {paymentMethod==='split'&&<div className="mt-3 grid grid-cols-3 gap-2">{(['cash','card','pix'] as const).map(method=><label key={method} className="text-xs">{paymentLabels[method]}<input aria-label={`Valor ${paymentLabels[method]}`} type="number" min="0" step="0.01" className="mt-1 w-full rounded border p-2" value={split[method]} onChange={e=>setSplit({...split,[method]:e.target.value})}/></label>)}</div>}
                        <div className="mt-5 rounded-md border border-[#d8dde3] bg-[#f8fafc] p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <strong className="block text-[11px] font-extrabold uppercase text-[#303740]">
                                        Pagamento efetuado
                                    </strong>
                                    <span className="mt-0.5 block text-[10px] font-semibold leading-3 text-[#667085]">
                                        {paymentMethod
                                            ? `Marque se o cliente já pagou em ${paymentLabel.toLowerCase()}.`
                                            : 'Escolha uma forma de pagamento antes de marcar como pago.'}
                                    </span>
                                </div>
                                <Switch
                                    checked={paymentStatus === 'paid'}
                                    onCheckedChange={(checked) => setPaymentStatus(checked ? 'paid' : 'pending')}
                                    disabled={!paymentMethod}
                                    aria-label="Pagamento já efetuado"
                                />
                            </div>
                            <div className={cn(
                                "mt-2 rounded-md px-2.5 py-1.5 text-[10px] font-extrabold",
                                paymentStatus === 'paid'
                                    ? "bg-[#0b98f6] text-white"
                                    : "bg-white text-[#667085]"
                            )}>
                                {!paymentMethod
                                    ? 'Nenhuma forma de pagamento selecionada'
                                    : paymentStatus === 'paid'
                                    ? `${paymentLabel} já recebido`
                                    : `${paymentLabel} selecionado, pagamento a receber`}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setPaymentSheetOpen(false)}
                            disabled={!paymentMethod}
                            className="mt-3 flex h-10 w-full items-center justify-center rounded-md bg-[#0b98f6] text-[13px] font-extrabold text-white shadow-sm hover:bg-[#0789df] disabled:cursor-not-allowed disabled:bg-[#9fb7c5]"
                        >
                            Salvar forma de pagamento
                        </button>
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={orderNoteModalOpen} onOpenChange={setOrderNoteModalOpen}>
                <DialogContent className="max-w-[520px] border-[#d8dde3] bg-white p-0">
                    <DialogHeader className="border-b border-[#e5e8ec] px-6 py-5">
                        <DialogTitle className="text-[20px] font-extrabold text-[#303740]">
                            Observação do pedido
                        </DialogTitle>
                        <DialogDescription className="text-[12px] font-semibold text-[#7b8490]">
                            Insira uma instrução geral para este pedido.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-5">
                        <textarea
                            value={orderNoteDraft}
                            onChange={(event) => setOrderNoteDraft(event.target.value)}
                            placeholder="Ex: cliente prefere retirar no balcão, separar molho, avisar ao chegar..."
                            className="h-36 w-full resize-none rounded-md border border-[#d8dde3] bg-white p-3 text-[13px] font-semibold leading-5 text-[#303740] outline-none placeholder:text-[#a8b1bb] focus:border-[#0b98f6] focus:ring-2 focus:ring-[#0b98f6]/20"
                            autoFocus
                        />

                        <div className="mt-4 grid grid-cols-[1fr_1fr] gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setOrderNote('');
                                    setOrderNoteDraft('');
                                    setOrderNoteModalOpen(false);
                                }}
                                className="flex h-11 items-center justify-center rounded-md border border-[#d8dde3] bg-white text-[13px] font-extrabold text-[#667085] hover:bg-[#f8fafc]"
                            >
                                Limpar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveOrderNote}
                                className="flex h-11 items-center justify-center rounded-md bg-[#0b98f6] text-[13px] font-extrabold text-white shadow-sm hover:bg-[#0789df]"
                            >
                                Salvar observação
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent
                    className={cn(
                        "border-[#d8dde3] bg-white",
                        activeModal === 'adjustment'
                            ? "max-w-[680px] gap-0 overflow-hidden p-0"
                            : "max-w-[420px] p-5"
                    )}
                >
                    {activeModal === 'adjustment' ? (
                        <div>
                            <DialogHeader className="border-b border-[#d8dde3] px-8 py-6">
                                <DialogTitle className="text-[24px] font-extrabold leading-8 text-[#2d3137]">
                                    Ajustar valor do pedido
                                </DialogTitle>
                            </DialogHeader>

                            <div className="px-8 py-8">
                                <div className="flex">
                                    <AdjustmentTab
                                        active={adjustmentDirection === 'discount'}
                                        onClick={() => setAdjustmentDirection('discount')}
                                    >
                                        Desconto
                                    </AdjustmentTab>
                                    <AdjustmentTab
                                        active={adjustmentDirection === 'addition'}
                                        onClick={() => {
                                            setAdjustmentDirection('addition');
                                            if (!adjustmentTypesByDirection.addition.includes(adjustmentType)) {
                                                setAdjustmentType('fixed');
                                            }
                                        }}
                                    >
                                        Acréscimo
                                    </AdjustmentTab>
                                </div>

                                <p className="mt-7 text-[17px] font-semibold leading-6 text-[#333840]">
                                    Selecione o tipo de {adjustmentDirection === 'discount' ? 'desconto' : 'acréscimo'} e insira o valor
                                </p>

                                <div className="mt-5 space-y-1">
                                    {adjustmentTypesByDirection[adjustmentDirection].map((type) => (
                                        <AdjustmentRadio
                                            key={type}
                                            checked={adjustmentType === type}
                                            label={adjustmentTypeLabels[type]}
                                            onClick={() => setAdjustmentType(type)}
                                        />
                                    ))}
                                </div>

                                <label className="mt-5 block">
                                    <span className="mb-3 block text-[15px] font-extrabold text-[#343941]">
                                        Valor do {adjustmentDirection === 'discount' ? 'desconto' : 'acréscimo'}:
                                    </span>
                                    <div className="grid h-20 grid-cols-[1fr_80px] overflow-hidden rounded-md border-2 border-[#0b98f6] bg-white">
                                        <div className="flex items-center gap-2 px-7">
                                            <span className="text-[22px] font-extrabold text-[#3d4147]">
                                                {adjustmentType === 'percent' ? '%' : 'R$'}
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={adjustmentAmount}
                                                onChange={(event) => setAdjustmentAmount(event.target.value)}
                                                placeholder="0,00"
                                                className="h-full min-w-0 flex-1 bg-transparent text-[22px] font-semibold text-[#3d4147] outline-none placeholder:text-[#3d4147]"
                                                aria-label="Valor do ajuste"
                                            />
                                        </div>
                                        <div className="flex items-center justify-center border-l-2 border-[#0b98f6] text-[32px] font-semibold text-[#5f6670]">
                                            {adjustmentType === 'percent' ? '%' : '$'}
                                        </div>
                                    </div>
                                </label>

                                <div className="mt-6 border-t border-[#d8dde3] pt-7">
                                    <div className="grid grid-cols-2 gap-6">
                                        <button
                                            type="button"
                                            onClick={() => setActiveModal(null)}
                                            className="flex h-14 items-center justify-center rounded-md border border-[#0b98f6] bg-white text-[16px] font-extrabold text-[#0b98f6] hover:bg-[#eff8ff]"
                                        >
                                            [ ESC ] Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleApplyAdjustment}
                                            className="flex h-14 items-center justify-center rounded-md bg-[#0b98f6] text-[16px] font-extrabold text-white hover:bg-[#0789df]"
                                        >
                                            [ ENTER ] Aplicar {adjustmentDirection === 'discount' ? 'desconto' : 'acréscimo'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-[18px] font-extrabold text-[#303740]">
                                    Atendimento do pedido
                                </DialogTitle>
                                <DialogDescription className="text-[12px] font-semibold text-[#7b8490]">
                                    Selecione como o cliente vai receber este pedido.
                                </DialogDescription>
                            </DialogHeader>

                            {activeModal === 'fulfillment' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFulfillmentMethod('retirada')}
                                            className={cn(
                                                "flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-md border px-2 text-center text-[12px] font-extrabold leading-4",
                                                fulfillmentMethod === 'retirada'
                                                    ? "border-[#0b98f6] bg-[#0b98f6] text-white shadow-sm"
                                                    : "border-[#d8dde3] bg-white text-[#667085]"
                                            )}
                                        >
                                            <FaReceipt size={15} />
                                            Retirada
                                            <span className={cn(
                                                "text-[9px] font-bold leading-3 text-[#8a94a2]",
                                                fulfillmentMethod === 'retirada' && "text-white/85"
                                            )}>
                                                local/agendada
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFulfillmentMethod('balcao');
                                                setClientPhone('');
                                                setPickupScheduled(false);
                                                setScheduledDay('');
                                                setScheduledTime('');
                                            }}
                                            className={cn(
                                                "flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-md border px-2 text-center text-[12px] font-extrabold leading-4",
                                                fulfillmentMethod === 'balcao'
                                                    ? "border-[#0b98f6] bg-[#0b98f6] text-white shadow-sm"
                                                    : "border-[#d8dde3] bg-white text-[#667085]"
                                            )}
                                        >
                                            <FaStore size={16} />
                                            Balcão
                                            <span className={cn(
                                                "text-[9px] font-bold leading-3 text-[#8a94a2]",
                                                fulfillmentMethod === 'balcao' && "text-white/85"
                                            )}>
                                                venda imediata
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFulfillmentMethod('entrega');
                                                setPickupScheduled(false);
                                                setScheduledDay('');
                                                setScheduledTime('');
                                            }}
                                            className={cn(
                                                "flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-md border px-2 text-center text-[12px] font-extrabold leading-4",
                                                fulfillmentMethod === 'entrega'
                                                    ? "border-[#0b98f6] bg-[#0b98f6] text-white shadow-sm"
                                                    : "border-[#d8dde3] bg-white text-[#667085]"
                                            )}
                                        >
                                            <FaTruckFast size={15} />
                                            Entrega
                                            <span className={cn(
                                                "text-[9px] font-bold leading-3 text-[#8a94a2]",
                                                fulfillmentMethod === 'entrega' && "text-white/85"
                                            )}>
                                                enviar ao cliente
                                            </span>
                                        </button>
                                    </div>

                                    {fulfillmentMethod === 'balcao' && (
                                        <div className="rounded-md border border-[#b8e3ff] bg-[#eff8ff] p-3">
                                            <strong className="block text-[12px] font-extrabold uppercase text-[#0b86df]">
                                                Retirada balcão
                                            </strong>
                                            <span className="mt-1 block text-[11px] font-semibold leading-4 text-[#5f6670]">
                                                Use quando o cliente compra no estabelecimento e já leva o pedido. O telefone fica dispensado, e o nome/apelido é opcional para identificar o pedido.
                                            </span>
                                        </div>
                                    )}

                                    {(
                                        <div className="rounded-md border border-[#d8dde3] bg-[#f8fafc] p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <strong className="block text-[12px] font-extrabold uppercase text-[#303740]">
                                                        Agendamento
                                                    </strong>
                                                    <span className="mt-0.5 block text-[11px] font-semibold text-[#667085]">
                                                        Esse pedido é para agendamento?
                                                    </span>
                                                </div>
                                                <Switch
                                                    checked={pickupScheduled}
                                                    onCheckedChange={(checked) => {
                                                        setPickupScheduled(checked);
                                                        if (!checked) {
                                                            setScheduledDay('');
                                                            setScheduledTime('');
                                                        }
                                                    }}
                                                    aria-label="Pedido para agendamento"
                                                />
                                            </div>

                                            {pickupScheduled && (
                                                <div className="mt-4 space-y-4">
                                                    <div>
                                                        <div className="mb-2 flex items-center justify-between gap-3">
                                                            <span className="text-[10px] font-extrabold uppercase text-[#667085]">
                                                                Data do pedido
                                                            </span>
                                                            <span className="rounded bg-[#e8f6ff] px-2 py-1 text-[10px] font-extrabold text-[#0b86df]">
                                                                Datas de atendimento
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {scheduledPickupDayOptions.map((day) => (
                                                                <button
                                                                    key={day.value}
                                                                    type="button"
                                                                    onClick={() => { setScheduledDay(day.value); setScheduledTime(''); }}
                                                                    aria-pressed={scheduledDay === day.value}
                                                                    className={cn(
                                                                        "rounded-md border bg-white p-3 text-left transition hover:border-[#0b98f6] hover:bg-[#f7fbff]",
                                                                        scheduledDay === day.value
                                                                            ? "border-[#0b98f6] bg-[#0b98f6] text-white shadow-sm ring-2 ring-[#0b98f6]/20 hover:bg-[#0789df]"
                                                                            : "border-[#d8dde3]"
                                                                    )}
                                                                >
                                                                    <strong className={cn(
                                                                        "block text-[13px] font-extrabold text-[#303740]",
                                                                        scheduledDay === day.value && "text-white"
                                                                    )}>
                                                                        {day.title}
                                                                    </strong>
                                                                    <span className={cn(
                                                                        "mt-1 block text-[16px] font-extrabold leading-5 text-[#0b86df]",
                                                                        scheduledDay === day.value && "text-white"
                                                                    )}>
                                                                        {day.label}
                                                                    </span>
                                                                    <span className={cn(
                                                                        "mt-0.5 block text-[10px] font-semibold text-[#667085]",
                                                                        scheduledDay === day.value && "text-white/85"
                                                                    )}>
                                                                        Conforme disponibilidade
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="mb-2 flex items-center justify-between gap-3">
                                                            <span className="text-[10px] font-extrabold uppercase text-[#667085]">
                                                                Horário
                                                            </span>
                                                            <span className="rounded bg-[#f2f4f7] px-2 py-1 text-[10px] font-extrabold text-[#667085]">
                                                                Horários disponíveis
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {scheduleQuery.isFetching && <p role="status">Carregando horários…</p>}
                                                            {scheduleQuery.isError && <button onClick={() => scheduleQuery.refetch()}>Erro ao carregar horários. Tentar novamente</button>}
                                                            {scheduledDay && scheduleQuery.isSuccess && !scheduledPickupTimes.length && <p>Nenhum horário disponível. Escolha outra data.</p>}
                                                            {scheduledPickupTimes.map((time) => (
                                                                <button
                                                                    key={time}
                                                                    type="button"
                                                                    onClick={() => setScheduledTime(time)}
                                                                    aria-pressed={scheduledTime === time}
                                                                    className={cn(
                                                                        "flex h-10 items-center justify-center rounded-md border bg-white text-[13px] font-extrabold transition hover:border-[#0b98f6] hover:bg-[#f7fbff]",
                                                                        scheduledTime === time
                                                                            ? "border-[#0b98f6] bg-[#0b98f6] text-white shadow-sm ring-2 ring-[#0b98f6]/20 hover:bg-[#0789df]"
                                                                            : "border-[#d8dde3] text-[#303740]"
                                                                    )}
                                                                >
                                                                    {time}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <DialogFooter>
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="flex h-10 items-center justify-center rounded-md bg-[#0b98f6] px-5 text-[13px] font-extrabold text-white hover:bg-[#0789df]"
                                >
                                    Salvar
                                </button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <button
                type="button"
                className="fixed right-0 top-1/2 z-20 flex h-[154px] w-8 -translate-y-1/2 items-center justify-center rounded-l-md bg-[#0b98f6] text-white shadow-md"
                aria-label="Enviar sugestão"
            >
                <span className="-rotate-90 whitespace-nowrap text-[13px] font-extrabold">Enviar sugestão</span>
            </button>
        {fulfillmentMethod==='entrega'&&<section className="fixed bottom-4 left-4 z-30 w-80 rounded-md border bg-white p-4 shadow-xl"><h2 className="font-bold">Endereço de entrega</h2><p className="text-xs">Taxa: {formatCurrency(deliveryFee)}</p>{(['rua','numero','bairro','cep','complemento','referencia'] as const).map(key=><label key={key} className="mt-1 block text-xs capitalize">{key}<input className="block w-full rounded border p-1" value={deliveryAddress[key]} onChange={e=>setDeliveryAddress({...deliveryAddress,[key]:e.target.value})}/></label>)}</section>}
        <Dialog open={draftOpen} onOpenChange={setDraftOpen}><DialogContent><DialogHeader><DialogTitle>Rascunhos do PDV</DialogTitle><DialogDescription>Rascunhos não reservam estoque. Preços e disponibilidade serão validados ao gerar o pedido.</DialogDescription></DialogHeader><div className="max-h-80 space-y-2 overflow-y-auto">{!drafts&&<p>Nenhum rascunho salvo.</p>}{draftQuery.data?.map(d=><div key={d.id} className="flex items-center gap-2 rounded border p-2"><span className="flex-1">#{d.id} — {d.dados.clientName||'Sem cliente'}</span><button onClick={()=>restoreDraft(d.dados)}>Abrir</button><button onClick={()=>deleteDraft.mutate(d.id)}>Excluir</button></div>)}</div></DialogContent></Dialog>
        </main>
    );
}
