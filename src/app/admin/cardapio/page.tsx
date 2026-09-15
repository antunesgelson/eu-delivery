'use client'

import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { localCardapio } from "@/data/menu";
import {
    getDefaultProductComposition,
    getNextServiceDateKeys,
    getProductAvailability,
} from "@/lib/menu-stock";
import { cn } from "@/lib/utils";
import { FaBox, FaBoxOpen, FaBoxesStacked, FaChevronDown, FaGripVertical, FaImage, FaLayerGroup, FaLink, FaMinus, FaPenToSquare, FaPlus, FaRegCopy, FaTrashCan, FaUtensils } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";

type ProductStock = {
    saturday: number;
    sunday: number;
}

type StockDay = keyof ProductStock;

type ProductKind = 'simple' | 'compound';

type ProductComponent = {
    productId: number;
    quantity: number;
}

type AdminMenuProduct = {
    id: number;
    title: string;
    description: string;
    price: number;
    image: string;
    servingSize: number;
    stock: ProductStock;
    forcedSoldOut: boolean;
    classifications?: string[];
    productKind?: ProductKind;
    components?: ProductComponent[];
    stockByDate?: Record<string, number>;
    soldOutByDate?: Record<string, boolean>;
}

type AdminMenuCategory = {
    id: string;
    title: string;
    badge: string;
    status: 'active' | 'draft';
    products: AdminMenuProduct[];
    campaign?: string;
}

const campaignImage = localCardapio[0]?.produtos[0]?.imgs?.[0]?.Location ?? '';
const ADMIN_CATEGORIES_STORAGE_KEY = 'assados-zanini-admin-categories-v1';

function getProductStock(productTitle: string): ProductStock {
    const normalizedTitle = normalizeSearch(productTitle);

    if (normalizedTitle.includes('frango assado recheado')) {
        return { saturday: 12, sunday: 36 };
    }

    if (normalizedTitle.includes('frango assado sem recheio')) {
        return { saturday: 15, sunday: 36 };
    }

    if (normalizedTitle.includes('meio frango')) {
        return { saturday: 0, sunday: 0 };
    }

    if (normalizedTitle.includes('costelinha')) {
        return { saturday: 5, sunday: 9 };
    }

    if (normalizedTitle.includes('maionese')) {
        return { saturday: 15, sunday: 26 };
    }

    if (normalizedTitle.includes('arroz')) {
        return { saturday: 18, sunday: 24 };
    }

    if (normalizedTitle.includes('coca-cola')) {
        return { saturday: 15, sunday: 18 };
    }

    if (normalizedTitle.includes('pureza')) {
        return { saturday: 12, sunday: 14 };
    }

    return { saturday: 4, sunday: 6 };
}

function getDefaultClassifications(productTitle: string, categoryTitle?: string) {
    const normalizedTitle = normalizeSearch(productTitle);
    const normalizedCategory = normalizeSearch(categoryTitle ?? '');

    if (normalizedTitle.includes('coca') || normalizedTitle.includes('pureza') || normalizedCategory.includes('bebida')) {
        return ['Gelado', 'Bebida'];
    }

    if (normalizedTitle.includes('costelinha') || normalizedCategory.includes('defumado')) {
        return ['Quente', 'Defumado'];
    }

    if (normalizedTitle.includes('maionese') || normalizedTitle.includes('arroz') || normalizedCategory.includes('acompanhamento')) {
        return ['Acompanhamento'];
    }

    if (normalizedTitle.includes('combo')) {
        return ['Promoção', 'Mais pedido'];
    }

    if (normalizedTitle.includes('frango') || normalizedCategory.includes('assado')) {
        return ['Quente', 'Assado'];
    }

    return [];
}

function getTotalStock(stock: ProductStock) {
    return stock.saturday + stock.sunday;
}

function sanitizeStockValue(value: number) {
    if (Number.isNaN(value) || value < 0) {
        return 0;
    }

    return Math.min(Math.floor(value), 999);
}

function sanitizeServingSize(value: number) {
    if (Number.isNaN(value) || value < 1) {
        return 1;
    }

    return Math.min(Math.floor(value), 99);
}

function sanitizePriceValue(value: number) {
    if (Number.isNaN(value) || value < 0) {
        return 0;
    }

    return Math.min(Math.round(value * 100) / 100, 9999.99);
}

function formatPriceInput(value: number) {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function parsePriceInput(value: string) {
    const onlyDigits = value.replace(/\D/g, '');

    if (!onlyDigits) {
        return 0;
    }

    const parsedValue = Number(onlyDigits) / 100;

    return sanitizePriceValue(parsedValue);
}

function createCategoryId(title: string) {
    const normalizedTitle = normalizeSearch(title)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    return `${normalizedTitle || 'categoria'}-${Date.now()}`;
}

function createProductId() {
    return Date.now();
}

const initialCategories: AdminMenuCategory[] = [
    {
        id: 'promo',
        title: 'Promoção',
        badge: 'Itens principais',
        status: 'active',
        campaign: '10% OFF',
        products: [
            {
                id: 9001,
                title: 'Combo família',
                description: 'Frango assado, arroz, maionese e bebida para retirada.',
                price: 89.9,
                image: campaignImage,
                servingSize: 4,
                stock: { saturday: 0, sunday: 0 },
                forcedSoldOut: false,
                classifications: getDefaultClassifications('Combo família', 'Promoção'),
                ...getDefaultProductComposition('Combo família'),
            },
        ],
    },
    ...localCardapio.map((category) => ({
        id: String(category.id),
        title: category.titulo,
        badge: 'Itens principais',
        status: 'active' as const,
        products: category.produtos.map((product) => ({
            id: product.id,
            title: product.titulo,
            description: product.descricao,
            price: Number(product.valor),
            image: product.imgs?.[0]?.Location ?? campaignImage,
            servingSize: product.servingSize,
            stock: getProductStock(product.titulo),
            forcedSoldOut: false,
            classifications: getDefaultClassifications(product.titulo, category.titulo),
            ...getDefaultProductComposition(product.titulo),
        })),
    })),
];

function hydrateProductClassifications(categories: AdminMenuCategory[]) {
    return categories.map((category) => ({
        ...category,
        products: category.products.map((product) => {
            const defaultComposition = getDefaultProductComposition(product.title);

            return {
                ...product,
                classifications: product.classifications && product.classifications.length > 0
                    ? product.classifications
                    : getDefaultClassifications(product.title, category.title),
                productKind: product.productKind ?? defaultComposition.productKind,
                components: product.components ?? defaultComposition.components,
                stockByDate: product.stockByDate ?? {},
                soldOutByDate: product.soldOutByDate ?? {},
            };
        }),
    }));
}

function normalizeSearch(value: string) {
    return value
        .trim()
        .toLocaleLowerCase('pt-BR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function reorderCategories(categories: AdminMenuCategory[], draggedId: string, targetId: string) {
    const draggedIndex = categories.findIndex((category) => category.id === draggedId);
    const targetIndex = categories.findIndex((category) => category.id === targetId);

    if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) {
        return categories;
    }

    const nextCategories = [...categories];
    const [draggedCategory] = nextCategories.splice(draggedIndex, 1);
    nextCategories.splice(targetIndex, 0, draggedCategory);

    return nextCategories;
}

function reorderProducts(categories: AdminMenuCategory[], categoryId: string, draggedProductId: number, targetProductId: number) {
    return categories.map((category) => {
        if (category.id !== categoryId) {
            return category;
        }

        const draggedIndex = category.products.findIndex((product) => product.id === draggedProductId);
        const targetIndex = category.products.findIndex((product) => product.id === targetProductId);

        if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) {
            return category;
        }

        const nextProducts = [...category.products];
        const [draggedProduct] = nextProducts.splice(draggedIndex, 1);
        nextProducts.splice(targetIndex, 0, draggedProduct);

        return {
            ...category,
            products: nextProducts,
        };
    });
}

function StockDayControl({
    label,
    value,
    tone,
    onChange,
}: {
    label: string;
    value: number;
    tone: 'orange' | 'blue';
    onChange: (value: number) => void;
}) {
    return (
        <div className="rounded-md border border-neutral-200 bg-white p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className={cn(
                    "text-[10px] font-extrabold uppercase",
                    tone === 'orange' ? "text-[#f97316]" : "text-[#2f8df6]"
                )}>
                    {label}
                </span>
                <span className="text-[10px] font-bold text-dark-400">un.</span>
            </div>
            <div className="grid grid-cols-[30px_minmax(48px,1fr)_30px] overflow-hidden rounded-md border border-neutral-200 bg-[#f8fafc]">
                <button
                    type="button"
                    onClick={() => onChange(value - 1)}
                    className="grid h-9 place-items-center border-r border-neutral-200 bg-white text-dark-500 transition hover:bg-[#fff3ea] hover:text-[#f97316] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={value <= 0}
                    aria-label={`Diminuir estoque de ${label}`}
                >
                    <FaMinus size={10} />
                </button>
                <input
                    type="number"
                    min={0}
                    max={999}
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                    className="h-9 w-full bg-transparent px-1 text-center text-[14px] font-extrabold text-dark-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    aria-label={`Estoque de ${label}`}
                />
                <button
                    type="button"
                    onClick={() => onChange(value + 1)}
                    className="grid h-9 place-items-center border-l border-neutral-200 bg-white text-dark-500 transition hover:bg-[#fff3ea] hover:text-[#f97316]"
                    aria-label={`Aumentar estoque de ${label}`}
                >
                    <FaPlus size={10} />
                </button>
            </div>
        </div>
    );
}

function SoldOutDayControl({
    label,
    tone,
    checked,
    unavailable,
    onChange,
}: {
    label: string;
    tone: 'orange' | 'blue';
    checked: boolean;
    unavailable: boolean;
    onChange: (checked: boolean) => void;
}) {
    const statusLabel = checked ? 'Esgotado' : unavailable ? 'Sem estoque' : 'Disponível';

    return (
        <div className="flex h-11 items-center justify-between gap-2 rounded-md bg-white px-2.5 ring-1 ring-neutral-100">
            <div className="min-w-0">
                <strong className={cn(
                    "block text-[10px] font-extrabold uppercase leading-3",
                    tone === 'orange' ? "text-[#f97316]" : "text-[#2f8df6]"
                )}>
                    {label}
                </strong>
                <span className={cn(
                    "mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase leading-none",
                    checked || unavailable
                        ? "bg-neutral-200 text-neutral-700"
                        : "bg-emerald-50 text-emerald-700"
                )}>
                    {statusLabel}
                </span>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={(value) => onChange(value === true)}
                className="h-5 w-9 shrink-0 data-[state=checked]:!bg-[#f97316] data-[state=unchecked]:!bg-neutral-300 [&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-4"
                aria-label={`Esgotar estoque de ${label}`}
            />
        </div>
    );
}

function PriceEditor({
    title,
    value,
    onChange,
}: {
    title: string;
    value: number;
    onChange: (value: number) => void;
}) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = React.useState(formatPriceInput(value));
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
        if (!isFocused) {
            setDisplayValue(formatPriceInput(value));
        }
    }, [isFocused, value]);

    const handlePriceInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextPriceValue = parsePriceInput(event.target.value);

        setDisplayValue(formatPriceInput(nextPriceValue));
        onChange(nextPriceValue);
    };

    const handlePriceInputBlur = () => {
        const parsedValue = parsePriceInput(displayValue);

        setIsFocused(false);
        setDisplayValue(formatPriceInput(parsedValue));
        onChange(parsedValue);
    };

    return (
        <div className="flex h-full flex-col rounded-md border border-neutral-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase text-dark-400">Preço</span>
                <button
                    type="button"
                    onClick={() => inputRef.current?.focus()}
                    className="grid h-6 w-6 place-items-center rounded-md text-dark-400 transition hover:bg-[#fff3ea] hover:text-[#f97316]"
                    aria-label={`Editar preço de ${title}`}
                >
                    <FaPenToSquare size={11} />
                </button>
            </div>

            <label className="grid h-9 grid-cols-[26px_minmax(0,1fr)] items-center overflow-hidden rounded-md border border-neutral-200 bg-[#fbfbfb] focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-[#f97316]/15">
                <span className="grid h-full place-items-center border-r border-neutral-200 text-[11px] font-extrabold text-[#f97316]">
                    R$
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handlePriceInputBlur}
                    onChange={handlePriceInputChange}
                    className="h-full w-full bg-transparent px-2.5 text-[14px] font-extrabold text-dark-900 outline-none"
                    aria-label={`Preço de ${title}`}
                />
            </label>
        </div>
    );
}

function MenuCategoryCard({
    categories,
    category,
    position,
    expanded,
    dragging,
    dragOver,
    onToggle,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onShareProduct,
    onStockChange,
    onPriceChange,
    onSoldOutChange,
    onEditCategory,
    onDuplicateCategory,
    onDeleteCategory,
    onAddProduct,
    onEditProduct,
    draggedProductId,
    dragOverProductId,
    onProductDragStart,
    onProductDragOver,
    onProductDrop,
    onProductDragEnd,
}: {
    categories: AdminMenuCategory[];
    category: AdminMenuCategory;
    position: number;
    expanded: boolean;
    dragging: boolean;
    dragOver: boolean;
    onToggle: () => void;
    onDragStart: (event: React.DragEvent<HTMLElement>) => void;
    onDragOver: (event: React.DragEvent<HTMLElement>) => void;
    onDrop: (event: React.DragEvent<HTMLElement>) => void;
    onDragEnd: () => void;
    onShareProduct: (product: AdminMenuProduct) => void;
    onStockChange: (productId: number, day: StockDay, value: number) => void;
    onPriceChange: (productId: number, value: number) => void;
    onSoldOutChange: (productId: number, day: StockDay, soldOut: boolean) => void;
    onEditCategory: (category: AdminMenuCategory) => void;
    onDuplicateCategory: (category: AdminMenuCategory) => void;
    onDeleteCategory: (category: AdminMenuCategory) => void;
    onAddProduct: (category: AdminMenuCategory) => void;
    onEditProduct: (category: AdminMenuCategory, product: AdminMenuProduct) => void;
    draggedProductId: number | null;
    dragOverProductId: number | null;
    onProductDragStart: (event: React.DragEvent<HTMLButtonElement>, productId: number) => void;
    onProductDragOver: (event: React.DragEvent<HTMLDivElement>, productId: number) => void;
    onProductDrop: (event: React.DragEvent<HTMLDivElement>, productId: number) => void;
    onProductDragEnd: () => void;
}) {
    return (
        <article
            onClick={() => {
                if (!expanded) {
                    onToggle();
                }
            }}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={cn(
                "overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm transition",
                !expanded && "cursor-pointer hover:border-[#f97316]/35 hover:shadow-md",
                dragging && "scale-[0.995] opacity-55 ring-2 ring-[#f97316]/40",
                dragOver && "ring-2 ring-[#f97316]/45 ring-offset-2"
            )}
        >
            {category.campaign && (
                <div className="flex h-9 items-center justify-center bg-[#f6a400] text-[12px] font-extrabold text-dark-900">
                    {category.campaign}
                </div>
            )}

            <div
                onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                }}
                className="grid cursor-pointer grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition hover:bg-neutral-50/70"
            >
                <button
                    type="button"
                    draggable
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onClick={(event) => event.stopPropagation()}
                    className="grid h-10 w-10 cursor-grab place-items-center rounded-md text-neutral-300 transition hover:bg-[#f7f7f7] hover:text-[#f97316] active:cursor-grabbing"
                    aria-label={`Arrastar categoria ${category.title}`}
                >
                    <FaGripVertical size={22} />
                </button>

                <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#111111] px-2.5 py-1 text-[10px] font-extrabold text-white">
                            #{String(position).padStart(2, '0')}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
                            {category.status === 'active' ? 'Ativa na loja' : 'Rascunho'}
                        </span>
                        <span className="inline-flex rounded-md bg-sky-100 px-2 py-1 text-[11px] font-bold text-sky-800">
                            {category.badge}
                        </span>
                    </div>

                    <div className="mt-2 flex min-w-0 items-center gap-3">
                        <h2 className="truncate text-[19px] font-extrabold leading-6 text-dark-900">{category.title}</h2>
                        <span className="text-[12px] font-semibold text-dark-500">
                            {category.products.length} {category.products.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={(event) => {
                            event.stopPropagation();
                            onAddProduct(category);
                        }}
                        className="h-9 gap-2 border-[#f97316]/35 bg-[#fff7ed] px-3 text-[12px] font-extrabold text-[#f97316] shadow-none hover:bg-[#ffedd5] hover:text-[#ea580c]"
                    >
                        <FaPlus size={12} />
                        Adicionar item
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={(event) => event.stopPropagation()}
                                className="h-9 gap-2 border-neutral-300 bg-white px-3 text-[12px] font-extrabold text-dark-600 shadow-none hover:bg-neutral-50"
                            >
                                Ações categoria
                                <FaChevronDown size={12} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-lg border-neutral-200 bg-white p-1.5 shadow-xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => onEditCategory(category)}
                                className="gap-2 text-[13px] text-dark-700 focus:bg-[#fff3ea] focus:text-[#f97316]"
                            >
                                <FaPenToSquare size={13} />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => onDuplicateCategory(category)}
                                className="gap-2 text-[13px] text-dark-700 focus:bg-[#fff3ea] focus:text-[#f97316]"
                            >
                                <FaRegCopy size={13} />
                                Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => onDeleteCategory(category)}
                                className="gap-2 text-[13px] text-red-600 focus:bg-red-50 focus:text-red-700"
                            >
                                <FaTrashCan size={13} />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggle();
                        }}
                        className="grid h-9 w-9 place-items-center rounded-md text-[#0988e8] transition hover:bg-[#eef6ff]"
                        aria-label={expanded ? 'Recolher categoria' : 'Expandir categoria'}
                    >
                        <FaChevronDown
                            size={18}
                            className={cn("transition-transform", expanded && "rotate-180")}
                        />
                    </button>
                </div>
            </div>

            <div
                className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                    expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
                aria-hidden={!expanded}
            >
                <div className={cn("min-h-0 overflow-hidden", !expanded && "pointer-events-none")}>
                    <div className="border-t border-neutral-100 bg-[#fbfbfb] px-4 py-3">
                        <div className="grid gap-3">
                            {category.products.map((product) => {
                                const nextServiceDates = getNextServiceDateKeys();
                                const saturdayDate = nextServiceDates.find((date) => date.day === 'saturday');
                                const sundayDate = nextServiceDates.find((date) => date.day === 'sunday');
                                const isCompoundProduct = product.productKind === 'compound' && Boolean(product.components?.length);
                                const saturdayAvailability = saturdayDate
                                    ? getProductAvailability(categories, product, saturdayDate.key)
                                    : product.stock.saturday;
                                const sundayAvailability = sundayDate
                                    ? getProductAvailability(categories, product, sundayDate.key)
                                    : product.stock.sunday;
                                const soldOutByDate = product.soldOutByDate ?? {};
                                const saturdayManuallySoldOut = product.forcedSoldOut || Boolean(saturdayDate && soldOutByDate[saturdayDate.key]);
                                const sundayManuallySoldOut = product.forcedSoldOut || Boolean(sundayDate && soldOutByDate[sundayDate.key]);
                                const realAvailability = saturdayAvailability + sundayAvailability;
                                const soldOut = realAvailability <= 0;
                                const partiallySoldOut = !soldOut && (saturdayManuallySoldOut || sundayManuallySoldOut);
                                const productDragging = draggedProductId === product.id;
                                const productDragOver = dragOverProductId === product.id && draggedProductId !== product.id;
                                const statusLabel = soldOut
                                    ? product.forcedSoldOut || (saturdayManuallySoldOut && sundayManuallySoldOut)
                                        ? 'Esgotado no fim de semana'
                                        : isCompoundProduct ? 'Sem componentes' : 'Estoque zerado'
                                    : partiallySoldOut
                                        ? 'Esgotado em 1 dia'
                                        : 'Disponível';
                                const componentLabels = (product.components ?? []).map((component) => {
                                    const componentProduct = categories
                                        .flatMap((currentCategory) => currentCategory.products)
                                        .find((currentProduct) => currentProduct.id === component.productId);

                                    return componentProduct
                                        ? `${component.quantity}x ${componentProduct.title}`
                                        : `${component.quantity}x item #${component.productId}`;
                                });

                            return (
                                <div
                                    key={product.id}
                                    onDragOver={(event) => onProductDragOver(event, product.id)}
                                    onDrop={(event) => onProductDrop(event, product.id)}
                                    className={cn(
                                        "grid grid-cols-[minmax(260px,1fr)_126px_minmax(330px,400px)_168px_128px] items-stretch gap-3 rounded-md border bg-white p-3 shadow-[0_1px_0_rgba(17,17,17,0.03)] transition",
                                        soldOut ? "border-neutral-300 bg-neutral-50 grayscale" : "border-neutral-200",
                                        productDragging && "scale-[0.997] opacity-55 ring-2 ring-[#f97316]/35",
                                        productDragOver && "border-[#f97316] ring-2 ring-[#f97316]/20"
                                    )}
                                >
                                    <div className="grid min-w-0 grid-cols-[20px_64px_minmax(0,1fr)] items-center gap-3">
                                        <button
                                            type="button"
                                            draggable
                                            onClick={(event) => event.stopPropagation()}
                                            onDragStart={(event) => onProductDragStart(event, product.id)}
                                            onDragEnd={onProductDragEnd}
                                            className="grid h-8 w-5 cursor-grab place-items-center rounded-sm text-neutral-300 transition hover:bg-[#fff3ea] hover:text-[#f97316] active:cursor-grabbing"
                                            aria-label={`Arrastar item ${product.title}`}
                                        >
                                            <FaGripVertical size={16} />
                                        </button>
                                        <Image
                                            src={product.image}
                                            alt={product.title}
                                            width={64}
                                            height={64}
                                            unoptimized={product.image.startsWith('data:')}
                                            className={cn(
                                                "h-16 w-16 rounded-md bg-[#fff3ea] object-cover shadow-sm",
                                                soldOut && "grayscale"
                                            )}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <strong className="truncate text-[14px] font-extrabold leading-5 text-dark-900">{product.title}</strong>
                                                {soldOut && (
                                                    <span className="shrink-0 rounded-full bg-neutral-200 px-2 py-0.5 text-[9px] font-extrabold uppercase text-neutral-700">
                                                        {product.forcedSoldOut ? 'Pausado' : 'Esgotado'}
                                                    </span>
                                                )}
                                                {partiallySoldOut && (
                                                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700">
                                                        Parcial
                                                    </span>
                                                )}
                                                {isCompoundProduct && (
                                                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-sky-700">
                                                        Composto
                                                    </span>
                                                )}
                                            </div>
                                            <span className="mt-1.5 block line-clamp-2 text-[11px] font-semibold leading-4 text-dark-500">{product.description}</span>
                                            {product.classifications && product.classifications.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {product.classifications.slice(0, 3).map((classification) => (
                                                        <span
                                                            key={classification}
                                                            className="rounded-full bg-[#fff3ea] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#f97316]"
                                                        >
                                                            {classification}
                                                        </span>
                                                    ))}
                                                    {product.classifications.length > 3 && (
                                                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-dark-500">
                                                            +{product.classifications.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <PriceEditor
                                        title={product.title}
                                        value={product.price}
                                        onChange={(value) => onPriceChange(product.id, value)}
                                    />

                                    <div className="rounded-md border border-neutral-200 bg-[#f8fafc] p-3">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-extrabold uppercase text-dark-400">Estoque por retirada</span>
                                            <strong className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-dark-900">
                                                {realAvailability} un.
                                            </strong>
                                        </div>
                                        {isCompoundProduct ? (
                                            <div className="grid gap-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="rounded-md bg-white px-2.5 py-2 ring-1 ring-neutral-100">
                                                        <span className="block text-[10px] font-extrabold uppercase text-[#f97316]">Sábado</span>
                                                        <strong className="text-[18px] font-extrabold leading-6 text-dark-900">{saturdayAvailability} un.</strong>
                                                    </div>
                                                    <div className="rounded-md bg-white px-2.5 py-2 ring-1 ring-neutral-100">
                                                        <span className="block text-[10px] font-extrabold uppercase text-[#2f8df6]">Domingo</span>
                                                        <strong className="text-[18px] font-extrabold leading-6 text-dark-900">{sundayAvailability} un.</strong>
                                                    </div>
                                                </div>
                                                <p className="line-clamp-2 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-semibold leading-4 text-dark-500 ring-1 ring-neutral-100">
                                                    Consome: {componentLabels.join(', ')}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <StockDayControl
                                                    label="Sábado"
                                                    value={product.stock.saturday}
                                                    tone="orange"
                                                    onChange={(value) => onStockChange(product.id, 'saturday', value)}
                                                />
                                                <StockDayControl
                                                    label="Domingo"
                                                    value={product.stock.sunday}
                                                    tone="blue"
                                                    onChange={(value) => onStockChange(product.id, 'sunday', value)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-md border border-neutral-200 bg-[#fafafa] p-3">
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <span className="text-[10px] font-extrabold uppercase leading-3 text-dark-400">Disponibilidade</span>
                                            <span className={cn(
                                                "shrink-0 rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase leading-none",
                                                soldOut
                                                    ? "bg-neutral-200 text-neutral-700"
                                                    : partiallySoldOut
                                                        ? "bg-amber-50 text-amber-700"
                                                        : "bg-emerald-50 text-emerald-700"
                                            )}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <SoldOutDayControl
                                                label="Sábado"
                                                tone="orange"
                                                checked={saturdayManuallySoldOut}
                                                unavailable={saturdayAvailability <= 0}
                                                onChange={(checked) => onSoldOutChange(product.id, 'saturday', checked)}
                                            />
                                            <SoldOutDayControl
                                                label="Domingo"
                                                tone="blue"
                                                checked={sundayManuallySoldOut}
                                                unavailable={sundayAvailability <= 0}
                                                onChange={(checked) => onSoldOutChange(product.id, 'sunday', checked)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onShareProduct(product)}
                                            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] font-extrabold text-dark-600 transition hover:border-[#f97316]/40 hover:bg-[#fff3ea] hover:text-[#f97316]"
                                        >
                                            <FaLink size={11} />
                                            Compartilhar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onEditProduct(category, product);
                                            }}
                                            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] font-extrabold text-dark-600 transition hover:border-[#f97316]/40 hover:bg-[#fff3ea] hover:text-[#f97316]"
                                            aria-label={`Editar ${product.title}`}
                                        >
                                            <FaPenToSquare size={12} />
                                            Editar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function MenuManagerPage() {
    const router = useRouter();
    const [categories, setCategories] = React.useState(initialCategories);
    const [categoriesHydrated, setCategoriesHydrated] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [expandedCategoryIds, setExpandedCategoryIds] = React.useState<string[]>(['promo']);
    const [draggedCategoryId, setDraggedCategoryId] = React.useState<string | null>(null);
    const [dragOverCategoryId, setDragOverCategoryId] = React.useState<string | null>(null);
    const [draggedProduct, setDraggedProduct] = React.useState<{ categoryId: string; productId: number } | null>(null);
    const [dragOverProduct, setDragOverProduct] = React.useState<{ categoryId: string; productId: number } | null>(null);
    const [newCategoryModalOpen, setNewCategoryModalOpen] = React.useState(false);
    const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
    const [newCategoryTitle, setNewCategoryTitle] = React.useState('');
    const [newCategoryBadge, setNewCategoryBadge] = React.useState('Itens principais');
    const [newCategoryCampaign, setNewCategoryCampaign] = React.useState('');
    const [newCategoryPromotionEnabled, setNewCategoryPromotionEnabled] = React.useState(false);
    const [newCategoryActive, setNewCategoryActive] = React.useState(true);
    const [newProductModalOpen, setNewProductModalOpen] = React.useState(false);
    const [newProductCategoryId, setNewProductCategoryId] = React.useState<string | null>(null);
    const [newProductTitle, setNewProductTitle] = React.useState('');
    const [newProductDescription, setNewProductDescription] = React.useState('');
    const [newProductPrice, setNewProductPrice] = React.useState(0);
    const [newProductImage, setNewProductImage] = React.useState('');
    const [newProductImageName, setNewProductImageName] = React.useState('');
    const [newProductServingSize, setNewProductServingSize] = React.useState(1);
    const [newProductStock, setNewProductStock] = React.useState<ProductStock>({ saturday: 0, sunday: 0 });
    const [newProductForcedSoldOut, setNewProductForcedSoldOut] = React.useState(false);
    const normalizedSearch = normalizeSearch(searchTerm);
    const selectedProductCategory = React.useMemo(
        () => categories.find((category) => category.id === newProductCategoryId) ?? null,
        [categories, newProductCategoryId]
    );

    React.useEffect(() => {
        try {
            const storedCategories = window.localStorage.getItem(ADMIN_CATEGORIES_STORAGE_KEY);

            if (storedCategories) {
                const parsedCategories = JSON.parse(storedCategories) as AdminMenuCategory[];

                if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
                    setCategories(hydrateProductClassifications(parsedCategories));
                }
            }
        } catch {
            toast.error('Não foi possível carregar o cardápio salvo neste navegador.');
        } finally {
            setCategoriesHydrated(true);
        }
    }, []);

    React.useEffect(() => {
        if (!categoriesHydrated) {
            return;
        }

        try {
            window.localStorage.setItem(ADMIN_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
        } catch {
            toast.error('Não foi possível salvar o cardápio neste navegador.');
        }
    }, [categories, categoriesHydrated]);

    const filteredCategories = React.useMemo(() => {
        if (!normalizedSearch) {
            return categories;
        }

        return categories.filter((category) => {
            const categoryMatches = normalizeSearch(category.title).includes(normalizedSearch);
            const productMatches = category.products.some((product) => (
                normalizeSearch(`${product.title} ${product.description} ${(product.classifications ?? []).join(' ')}`).includes(normalizedSearch)
            ));

            return categoryMatches || productMatches;
        });
    }, [categories, normalizedSearch]);

    const handleToggleCategory = (categoryId: string) => {
        setExpandedCategoryIds((currentIds) => (
            currentIds.includes(categoryId)
                ? currentIds.filter((id) => id !== categoryId)
                : [...currentIds, categoryId]
        ));
    };

    const handleDragStart = (event: React.DragEvent<HTMLElement>, categoryId: string) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', categoryId);
        setDraggedCategoryId(categoryId);
        setDraggedProduct(null);
        setDragOverProduct(null);
    };

    const handleDragOver = (event: React.DragEvent<HTMLElement>, categoryId: string) => {
        if (draggedProduct) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDragOverCategoryId(categoryId);
    };

    const handleDrop = (event: React.DragEvent<HTMLElement>, targetCategoryId: string) => {
        event.preventDefault();
        if (draggedProduct) {
            return;
        }

        const droppedCategoryId = event.dataTransfer.getData('text/plain') || draggedCategoryId;

        if (!droppedCategoryId) {
            setDraggedCategoryId(null);
            setDragOverCategoryId(null);
            return;
        }

        setCategories((currentCategories) => reorderCategories(currentCategories, droppedCategoryId, targetCategoryId));
        setDraggedCategoryId(null);
        setDragOverCategoryId(null);
    };

    const handleProductDragStart = (
        event: React.DragEvent<HTMLButtonElement>,
        categoryId: string,
        productId: number,
    ) => {
        event.stopPropagation();
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-assados-zanini-product', `${categoryId}:${productId}`);
        setDraggedProduct({ categoryId, productId });
        setDraggedCategoryId(null);
        setDragOverCategoryId(null);
    };

    const handleProductDragOver = (
        event: React.DragEvent<HTMLDivElement>,
        categoryId: string,
        productId: number,
    ) => {
        if (!draggedProduct || draggedProduct.categoryId !== categoryId) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        setDragOverProduct({ categoryId, productId });
    };

    const handleProductDrop = (
        event: React.DragEvent<HTMLDivElement>,
        categoryId: string,
        targetProductId: number,
    ) => {
        if (!draggedProduct || draggedProduct.categoryId !== categoryId) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        setCategories((currentCategories) => reorderProducts(
            currentCategories,
            categoryId,
            draggedProduct.productId,
            targetProductId,
        ));
        setDraggedProduct(null);
        setDragOverProduct(null);
    };

    const handleProductDragEnd = () => {
        setDraggedProduct(null);
        setDragOverProduct(null);
    };

    const handleExpandAll = () => {
        setExpandedCategoryIds(categories.map((category) => category.id));
    };

    const handleCollapseAll = () => {
        setExpandedCategoryIds([]);
    };

    const handleShareProduct = async (product: AdminMenuProduct) => {
        const productUrl = `${window.location.origin}/productdetails/${product.id}`;

        try {
            await navigator.clipboard.writeText(productUrl);
            toast.success('Link do item copiado.', {
                description: product.title,
            });
        } catch {
            toast.error('Não foi possível copiar o link do item.');
        }
    };

    const handleStockChange = (categoryId: string, productId: number, day: StockDay, value: number) => {
        const nextValue = sanitizeStockValue(value);
        const serviceDate = getNextServiceDateKeys().find((date) => date.day === day);

        setCategories((currentCategories) => currentCategories.map((category) => {
            if (category.id !== categoryId) {
                return category;
            }

            return {
                ...category,
                products: category.products.map((product) => (
                    product.id === productId
                        ? {
                            ...product,
                            stock: {
                                ...product.stock,
                                [day]: nextValue,
                            },
                            stockByDate: serviceDate
                                ? {
                                    ...(product.stockByDate ?? {}),
                                    [serviceDate.key]: nextValue,
                                }
                                : product.stockByDate,
                        }
                        : product
                )),
            };
        }));
    };

    const handlePriceChange = (categoryId: string, productId: number, value: number) => {
        const nextValue = sanitizePriceValue(value);

        setCategories((currentCategories) => currentCategories.map((category) => {
            if (category.id !== categoryId) {
                return category;
            }

            return {
                ...category,
                products: category.products.map((product) => (
                    product.id === productId
                        ? {
                            ...product,
                            price: nextValue,
                        }
                        : product
                )),
            };
        }));
    };

    const handleSoldOutChange = (categoryId: string, productId: number, day: StockDay, soldOut: boolean) => {
        const serviceDates = getNextServiceDateKeys();
        const serviceDate = serviceDates.find((date) => date.day === day);

        if (!serviceDate) {
            return;
        }

        setCategories((currentCategories) => currentCategories.map((category) => {
            if (category.id !== categoryId) {
                return category;
            }

            return {
                ...category,
                products: category.products.map((product) => {
                    if (product.id !== productId) {
                        return product;
                    }

                    const soldOutByDate = { ...(product.soldOutByDate ?? {}) };

                    if (product.forcedSoldOut) {
                        serviceDates.forEach((date) => {
                            soldOutByDate[date.key] = true;
                        });
                    }

                    if (soldOut) {
                        soldOutByDate[serviceDate.key] = true;
                    } else {
                        delete soldOutByDate[serviceDate.key];
                    }

                    return {
                        ...product,
                        forcedSoldOut: false,
                        soldOutByDate,
                    };
                }),
            };
        }));
    };

    const resetNewCategoryForm = () => {
        setEditingCategoryId(null);
        setNewCategoryTitle('');
        setNewCategoryBadge('Itens principais');
        setNewCategoryCampaign('');
        setNewCategoryPromotionEnabled(false);
        setNewCategoryActive(true);
    };

    const handleOpenCreateCategoryModal = () => {
        resetNewCategoryForm();
        setNewCategoryModalOpen(true);
    };

    const handleEditCategory = (category: AdminMenuCategory) => {
        setEditingCategoryId(category.id);
        setNewCategoryTitle(category.title);
        setNewCategoryBadge(category.badge);
        setNewCategoryCampaign(category.campaign ?? '');
        setNewCategoryPromotionEnabled(Boolean(category.campaign));
        setNewCategoryActive(category.status === 'active');
        setNewCategoryModalOpen(true);
    };

    const handleDuplicateCategory = (category: AdminMenuCategory) => {
        const duplicatedCategory: AdminMenuCategory = {
            ...category,
            id: createCategoryId(`${category.title}-copia`),
            title: `${category.title} cópia`,
            products: category.products.map((product) => ({ ...product })),
        };

        setCategories((currentCategories) => {
            const categoryIndex = currentCategories.findIndex((currentCategory) => currentCategory.id === category.id);

            if (categoryIndex < 0) {
                return [...currentCategories, duplicatedCategory];
            }

            const nextCategories = [...currentCategories];
            nextCategories.splice(categoryIndex + 1, 0, duplicatedCategory);
            return nextCategories;
        });
        setExpandedCategoryIds((currentIds) => [...currentIds, duplicatedCategory.id]);
        toast.success('Categoria duplicada.', {
            description: duplicatedCategory.title,
        });
    };

    const handleDeleteCategory = (category: AdminMenuCategory) => {
        setCategories((currentCategories) => currentCategories.filter((currentCategory) => currentCategory.id !== category.id));
        setExpandedCategoryIds((currentIds) => currentIds.filter((categoryId) => categoryId !== category.id));
        toast.success('Categoria excluída.', {
            description: category.title,
        });
    };

    const resetNewProductForm = () => {
        setNewProductCategoryId(null);
        setNewProductTitle('');
        setNewProductDescription('');
        setNewProductPrice(0);
        setNewProductImage('');
        setNewProductImageName('');
        setNewProductServingSize(1);
        setNewProductStock({ saturday: 0, sunday: 0 });
        setNewProductForcedSoldOut(false);
    };

    const handleOpenCreateProductModal = (category: AdminMenuCategory) => {
        const params = new URLSearchParams({
            categoryId: category.id,
            categoryTitle: category.title,
        });

        router.push(`/admin/cardapio/novo-item?${params.toString()}`);
    };

    const handleOpenEditProductPage = (category: AdminMenuCategory, product: AdminMenuProduct) => {
        const params = new URLSearchParams({
            categoryId: category.id,
            categoryTitle: category.title,
            productId: String(product.id),
        });

        router.push(`/admin/cardapio/novo-item?${params.toString()}`);
    };

    const handleNewProductStockChange = (day: StockDay, value: number) => {
        const nextValue = sanitizeStockValue(value);

        setNewProductStock((currentStock) => ({
            ...currentStock,
            [day]: nextValue,
        }));
    };

    const handleNewProductImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Escolha um arquivo de imagem.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('A imagem deve ter no máximo 5MB.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                toast.error('Não foi possível carregar a imagem.');
                return;
            }

            setNewProductImage(reader.result);
            setNewProductImageName(file.name);
        };

        reader.onerror = () => {
            toast.error('Não foi possível carregar a imagem.');
        };

        reader.readAsDataURL(file);
    };

    const handleRemoveNewProductImage = () => {
        setNewProductImage('');
        setNewProductImageName('');
    };

    const handleSubmitProduct = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const title = newProductTitle.trim();
        const description = newProductDescription.trim();
        const image = newProductImage.trim();

        if (!newProductCategoryId) {
            toast.error('Selecione uma categoria para o item.');
            return;
        }

        if (!title) {
            toast.error('Informe o nome do item.');
            return;
        }

        if (newProductPrice <= 0) {
            toast.error('Informe um preço válido para o item.');
            return;
        }

        const nextProduct: AdminMenuProduct = {
            id: createProductId(),
            title,
            description: description || 'Item cadastrado pelo painel administrativo.',
            price: sanitizePriceValue(newProductPrice),
            image: image || campaignImage,
            servingSize: sanitizeServingSize(newProductServingSize),
            stock: {
                saturday: sanitizeStockValue(newProductStock.saturday),
                sunday: sanitizeStockValue(newProductStock.sunday),
            },
            forcedSoldOut: newProductForcedSoldOut,
        };

        setCategories((currentCategories) => currentCategories.map((category) => (
            category.id === newProductCategoryId
                ? {
                    ...category,
                    products: [...category.products, nextProduct],
                }
                : category
        )));
        setExpandedCategoryIds((currentIds) => (
            currentIds.includes(newProductCategoryId) ? currentIds : [...currentIds, newProductCategoryId]
        ));
        setSearchTerm('');
        setNewProductModalOpen(false);
        resetNewProductForm();
        toast.success('Item adicionado ao cardápio.', {
            description: title,
        });
    };

    const handleSubmitCategory = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const title = newCategoryTitle.trim();
        const badge = newCategoryBadge.trim() || 'Itens principais';
        const campaign = newCategoryCampaign.trim();

        if (!title) {
            toast.error('Informe o nome da categoria.');
            return;
        }

        if (newCategoryPromotionEnabled && !campaign) {
            toast.error('Informe a mensagem promocional.');
            return;
        }

        if (editingCategoryId) {
            setCategories((currentCategories) => currentCategories.map((category) => (
                category.id === editingCategoryId
                    ? {
                        ...category,
                        title,
                        badge,
                        status: newCategoryActive ? 'active' : 'draft',
                        campaign: newCategoryPromotionEnabled ? campaign : undefined,
                    }
                    : category
            )));
            setExpandedCategoryIds((currentIds) => (
                currentIds.includes(editingCategoryId) ? currentIds : [...currentIds, editingCategoryId]
            ));
            setSearchTerm('');
            toast.success('Categoria atualizada.', {
                description: title,
            });
            resetNewCategoryForm();
            setNewCategoryModalOpen(false);
            return;
        }

        const nextCategory: AdminMenuCategory = {
            id: createCategoryId(title),
            title,
            badge,
            status: newCategoryActive ? 'active' : 'draft',
            campaign: newCategoryPromotionEnabled ? campaign : undefined,
            products: [],
        };

        setCategories((currentCategories) => [...currentCategories, nextCategory]);
        setExpandedCategoryIds((currentIds) => [...currentIds, nextCategory.id]);
        setSearchTerm('');
        resetNewCategoryForm();
        setNewCategoryModalOpen(false);
        toast.success('Categoria criada.', {
            description: title,
        });
    };

    return (
        <main className="min-h-[calc(100vh-61px)] bg-[#f3f5f8] p-3">
            <section className="rounded-md bg-white p-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="relative min-w-[360px] flex-1">
                        <IoSearch className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-dark-400" size={17} />
                        <Input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Pesquisar categoria ou item"
                            className="h-9 !rounded-md !border-neutral-200 !bg-white pl-9 text-[13px] font-semibold !text-dark-900 shadow-none outline-none placeholder:!text-dark-400 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900 dark:placeholder:!text-dark-400"
                        />
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleExpandAll}
                        className="h-9 border-neutral-200 px-3 text-[12px] font-extrabold text-dark-600 shadow-none hover:bg-neutral-50"
                    >
                        Expandir
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCollapseAll}
                        className="h-9 border-neutral-200 px-3 text-[12px] font-extrabold text-dark-600 shadow-none hover:bg-neutral-50"
                    >
                        Recolher
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 gap-2 border-[#2f8df6] bg-white px-5 text-[13px] font-extrabold text-[#2f8df6] shadow-none hover:bg-[#eef6ff] hover:text-[#1f7ce0]"
                    >
                        Ações
                        <FaChevronDown size={12} />
                    </Button>

                    <Button
                        type="button"
                        onClick={handleOpenCreateCategoryModal}
                        className="h-9 gap-2 bg-[#2f8df6] px-5 text-[13px] font-extrabold text-white shadow-sm hover:bg-[#1f7ce0]"
                    >
                        <FaPlus size={14} />
                        Nova categoria
                    </Button>
                </div>
            </section>

            <section className="mt-3">
                <div className="min-w-0 space-y-3">
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => {
                            const position = categories.findIndex((item) => item.id === category.id) + 1;

                            return (
                                <MenuCategoryCard
                                    key={category.id}
                                    categories={categories}
                                    category={category}
                                    position={position}
                                    expanded={expandedCategoryIds.includes(category.id)}
                                    dragging={draggedCategoryId === category.id}
                                    dragOver={dragOverCategoryId === category.id && draggedCategoryId !== category.id}
                                    onToggle={() => handleToggleCategory(category.id)}
                                    onDragStart={(event) => handleDragStart(event, category.id)}
                                    onDragOver={(event) => handleDragOver(event, category.id)}
                                    onDrop={(event) => handleDrop(event, category.id)}
                                    onDragEnd={() => {
                                        setDraggedCategoryId(null);
                                        setDragOverCategoryId(null);
                                    }}
                                    onShareProduct={handleShareProduct}
                                    onStockChange={(productId, day, value) => handleStockChange(category.id, productId, day, value)}
                                    onPriceChange={(productId, value) => handlePriceChange(category.id, productId, value)}
                                    onSoldOutChange={(productId, day, soldOut) => handleSoldOutChange(category.id, productId, day, soldOut)}
                                    onEditCategory={handleEditCategory}
                                    onDuplicateCategory={handleDuplicateCategory}
                                    onDeleteCategory={handleDeleteCategory}
                                    onAddProduct={handleOpenCreateProductModal}
                                    onEditProduct={handleOpenEditProductPage}
                                    draggedProductId={draggedProduct?.categoryId === category.id ? draggedProduct.productId : null}
                                    dragOverProductId={dragOverProduct?.categoryId === category.id ? dragOverProduct.productId : null}
                                    onProductDragStart={(event, productId) => handleProductDragStart(event, category.id, productId)}
                                    onProductDragOver={(event, productId) => handleProductDragOver(event, category.id, productId)}
                                    onProductDrop={(event, productId) => handleProductDrop(event, category.id, productId)}
                                    onProductDragEnd={handleProductDragEnd}
                                />
                            );
                        })
                    ) : (
                        <div className="rounded-md border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
                            <FaBoxOpen className="mx-auto text-dark-300" size={30} />
                            <strong className="mt-3 block text-[16px] font-extrabold text-dark-900">Nenhuma categoria encontrada</strong>
                            <p className="mt-1 text-[13px] font-semibold text-dark-500">Revise a busca ou cadastre uma nova categoria.</p>
                        </div>
                    )}
                </div>
            </section>

            <Dialog
                open={newCategoryModalOpen}
                onOpenChange={(open) => {
                    setNewCategoryModalOpen(open);
                    if (!open) {
                        resetNewCategoryForm();
                    }
                }}
            >
                <DialogContent className="max-w-[560px] gap-0 overflow-hidden rounded-xl border border-neutral-200 bg-white p-0 text-dark-900 shadow-2xl dark:bg-white">
                    <DialogHeader className="border-b border-neutral-100 bg-white px-6 py-5 text-left">
                        <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff3ea] text-[#f97316]">
                                <FaLayerGroup size={18} />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-[20px] font-extrabold leading-6 text-dark-900">
                                    {editingCategoryId ? 'Editar categoria' : 'Nova categoria'}
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-[13px] font-semibold leading-5 text-dark-500">
                                    {editingCategoryId
                                        ? 'Atualize as informações da seção sem alterar a ordem dos itens.'
                                        : 'Cadastre uma seção do cardápio e organize depois os itens na ordem que o cliente verá.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmitCategory}>
                        <div className="grid gap-4 px-6 py-5">
                            <div className="grid gap-2">
                                <Label htmlFor="new-category-title" className="text-[12px] font-extrabold uppercase text-dark-500">
                                    Nome da categoria
                                </Label>
                                <Input
                                    id="new-category-title"
                                    value={newCategoryTitle}
                                    onChange={(event) => setNewCategoryTitle(event.target.value)}
                                    placeholder="Ex: Sobremesas"
                                    autoFocus
                                    className="h-11 !rounded-md !border-neutral-200 !bg-white text-[14px] font-bold !text-dark-900 shadow-none placeholder:!text-dark-300 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="new-category-badge" className="text-[12px] font-extrabold uppercase text-dark-500">
                                    Identificação
                                </Label>
                                <Input
                                    id="new-category-badge"
                                    value={newCategoryBadge}
                                    onChange={(event) => setNewCategoryBadge(event.target.value)}
                                    placeholder="Itens principais"
                                    className="h-11 !rounded-md !border-neutral-200 !bg-white text-[14px] font-bold !text-dark-900 shadow-none placeholder:!text-dark-300 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900"
                                />
                            </div>

                            <div className="rounded-lg border border-neutral-200 bg-[#fafafa]">
                                <div className="flex items-center justify-between gap-4 px-4 py-3">
                                    <div>
                                        <strong className="block text-[13px] font-extrabold text-dark-900">Promoção</strong>
                                        <span className="mt-0.5 block text-[12px] font-semibold text-dark-500">
                                            Exibe uma faixa destacada acima da categoria.
                                        </span>
                                    </div>
                                    <Switch
                                        checked={newCategoryPromotionEnabled}
                                        onCheckedChange={(checked) => {
                                            const promotionEnabled = checked === true;
                                            setNewCategoryPromotionEnabled(promotionEnabled);
                                            if (!promotionEnabled) {
                                                setNewCategoryCampaign('');
                                            }
                                        }}
                                        className="data-[state=checked]:!bg-[#f97316]"
                                        aria-label="Categoria promocional"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <div
                                        className={cn(
                                            "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                                            newCategoryPromotionEnabled ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                        )}
                                        aria-hidden={!newCategoryPromotionEnabled}
                                    >
                                        <div className={cn("min-h-0 overflow-hidden", !newCategoryPromotionEnabled && "pointer-events-none")}>
                                            <div className="border-t border-neutral-200 px-4 pb-4 pt-3">
                                                <Label htmlFor="new-category-campaign" className="text-[12px] font-extrabold uppercase text-dark-500">
                                                    Mensagem promocional
                                                </Label>
                                                <Input
                                                    id="new-category-campaign"
                                                    value={newCategoryCampaign}
                                                    onChange={(event) => setNewCategoryCampaign(event.target.value)}
                                                    placeholder="Ex: 10% OFF"
                                                    className="mt-2 h-11 !rounded-md !border-neutral-200 !bg-white text-[14px] font-bold !text-dark-900 shadow-none placeholder:!text-dark-300 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-[#fafafa] px-4 py-3">
                                <div>
                                    <strong className="block text-[13px] font-extrabold text-dark-900">Categoria ativa na loja</strong>
                                    <span className="mt-0.5 block text-[12px] font-semibold text-dark-500">
                                        Desative para deixar a categoria como rascunho.
                                    </span>
                                </div>
                                <Switch
                                    checked={newCategoryActive}
                                    onCheckedChange={(checked) => setNewCategoryActive(checked === true)}
                                    className="data-[state=checked]:!bg-[#f97316]"
                                    aria-label="Categoria ativa na loja"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 border-t border-neutral-100 bg-[#fafafa] px-6 py-4 sm:space-x-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setNewCategoryModalOpen(false)}
                                className="h-10 border-neutral-200 bg-white px-4 text-[13px] font-extrabold text-dark-600 shadow-none hover:bg-neutral-50"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="h-10 gap-2 bg-[#f97316] px-5 text-[13px] font-extrabold text-white shadow-sm hover:bg-[#ea580c]"
                            >
                                {editingCategoryId ? <FaPenToSquare size={13} /> : <FaPlus size={13} />}
                                {editingCategoryId ? 'Salvar alterações' : 'Criar categoria'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={newProductModalOpen}
                onOpenChange={(open) => {
                    setNewProductModalOpen(open);
                    if (!open) {
                        resetNewProductForm();
                    }
                }}
            >
                <DialogContent className="max-w-[760px] gap-0 overflow-hidden rounded-xl border border-neutral-200 bg-white p-0 text-dark-900 shadow-2xl dark:bg-white">
                    <DialogHeader className="border-b border-neutral-100 bg-white px-6 py-5 text-left">
                        <div className="flex items-start gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff3ea] text-[#f97316]">
                                <FaUtensils size={18} />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-[20px] font-extrabold leading-6 text-dark-900">
                                    Novo item
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-[13px] font-semibold leading-5 text-dark-500">
                                    {selectedProductCategory
                                        ? `Adicione um produto em ${selectedProductCategory.title}.`
                                        : 'Adicione um produto em uma seção do cardápio.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmitProduct}>
                        <div className="grid gap-4 px-6 py-5">
                            <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-[#fafafa] px-4 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#f97316] shadow-sm">
                                        <FaLayerGroup size={15} />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-[11px] font-extrabold uppercase text-dark-400">Seção do cardápio</span>
                                        <strong className="block truncate text-[15px] font-extrabold text-dark-900">
                                            {selectedProductCategory?.title ?? 'Categoria não selecionada'}
                                        </strong>
                                    </div>
                                </div>
                                <span className="rounded-full bg-[#fff3ea] px-3 py-1 text-[11px] font-extrabold text-[#f97316]">
                                    Novo cadastro
                                </span>
                            </div>

                            <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-4">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="new-product-title" className="text-[12px] font-extrabold uppercase text-dark-500">
                                            Nome do item
                                        </Label>
                                        <Input
                                            id="new-product-title"
                                            value={newProductTitle}
                                            onChange={(event) => setNewProductTitle(event.target.value)}
                                            placeholder="Ex: Frango assado especial"
                                            autoFocus
                                            className="h-11 !rounded-md !border-neutral-200 !bg-white text-[14px] font-bold !text-dark-900 shadow-none placeholder:!text-dark-300 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="new-product-description" className="text-[12px] font-extrabold uppercase text-dark-500">
                                            Descrição
                                        </Label>
                                        <Textarea
                                            id="new-product-description"
                                            value={newProductDescription}
                                            onChange={(event) => setNewProductDescription(event.target.value)}
                                            placeholder="Detalhe recheio, acompanhamentos, preparo ou observações importantes."
                                            className="min-h-[104px] !rounded-md !border-neutral-200 !bg-white text-[14px] font-semibold !text-dark-900 shadow-none placeholder:!text-dark-300 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <div className="rounded-lg border border-neutral-200 bg-[#fafafa] p-3">
                                        <div className="mb-2 flex items-center gap-2">
                                            <FaImage className="text-[#f97316]" size={14} />
                                            <Label htmlFor="new-product-image" className="text-[12px] font-extrabold uppercase text-dark-500">
                                                Imagem
                                            </Label>
                                        </div>
                                        <input
                                            id="new-product-image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleNewProductImageChange}
                                            className="sr-only"
                                        />
                                        <label
                                            htmlFor="new-product-image"
                                            className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-4 text-center transition hover:border-[#f97316]/60 hover:bg-[#fff7ed]"
                                        >
                                            {newProductImage ? (
                                                <Image
                                                    src={newProductImage}
                                                    alt={newProductImageName || 'Imagem selecionada'}
                                                    width={160}
                                                    height={96}
                                                    unoptimized
                                                    className="h-24 w-full rounded-md object-cover"
                                                />
                                            ) : (
                                                <>
                                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fff3ea] text-[#f97316]">
                                                        <FaImage size={17} />
                                                    </span>
                                                    <strong className="mt-2 text-[12px] font-extrabold text-dark-900">
                                                        Escolher imagem
                                                    </strong>
                                                    <span className="mt-1 text-[11px] font-semibold leading-4 text-dark-400">
                                                        PNG, JPG ou WEBP até 5MB
                                                    </span>
                                                </>
                                            )}
                                        </label>
                                        {newProductImageName && (
                                            <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-white px-2.5 py-2">
                                                <span className="truncate text-[11px] font-bold text-dark-600">{newProductImageName}</span>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveNewProductImage}
                                                    className="shrink-0 text-[11px] font-extrabold text-red-600 transition hover:text-red-700"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        )}
                                        <p className="mt-2 text-[11px] font-semibold leading-4 text-dark-400">
                                            Se nenhuma imagem for escolhida, o item usa a imagem padrão do cardápio.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <PriceEditor
                                            title={newProductTitle || 'novo item'}
                                            value={newProductPrice}
                                            onChange={setNewProductPrice}
                                        />

                                        <div className="rounded-md border border-neutral-200 bg-[#fafafa] px-3 py-2">
                                            <div className="mb-1.5 flex items-center gap-2">
                                                <FaBox className="text-[#f97316]" size={12} />
                                                <Label htmlFor="new-product-serving-size" className="text-[10px] font-bold uppercase text-dark-400">
                                                    Serve
                                                </Label>
                                            </div>
                                            <input
                                                id="new-product-serving-size"
                                                type="number"
                                                min={1}
                                                max={99}
                                                value={newProductServingSize}
                                                onChange={(event) => setNewProductServingSize(sanitizeServingSize(Number(event.target.value)))}
                                                className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-center text-[13px] font-extrabold text-dark-900 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/15"
                                                aria-label="Quantidade que o item serve"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-4">
                                <div className="rounded-lg border border-neutral-200 bg-[#f8fafc] p-3">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FaBoxesStacked className="text-[#f97316]" size={15} />
                                            <strong className="text-[13px] font-extrabold text-dark-900">Estoque por retirada</strong>
                                        </div>
                                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-dark-700">
                                            {getTotalStock(newProductStock)} un.
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <StockDayControl
                                            label="Sábado"
                                            value={newProductStock.saturday}
                                            tone="orange"
                                            onChange={(value) => handleNewProductStockChange('saturday', value)}
                                        />
                                        <StockDayControl
                                            label="Domingo"
                                            value={newProductStock.sunday}
                                            tone="blue"
                                            onChange={(value) => handleNewProductStockChange('sunday', value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between rounded-lg border border-neutral-200 bg-[#fafafa] p-4">
                                    <div>
                                        <strong className="block text-[13px] font-extrabold text-dark-900">Esgotar item</strong>
                                        <span className="mt-1 block text-[12px] font-semibold leading-4 text-dark-500">
                                            Use quando quiser cadastrar agora, mas esconder a venda temporariamente.
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between rounded-md bg-white px-3 py-2">
                                        <span className="text-[12px] font-extrabold text-dark-600">
                                            {newProductForcedSoldOut ? 'Esgotado' : 'Disponível'}
                                        </span>
                                        <Switch
                                            checked={newProductForcedSoldOut}
                                            onCheckedChange={(checked) => setNewProductForcedSoldOut(checked === true)}
                                            className="data-[state=checked]:!bg-[#f97316]"
                                            aria-label="Esgotar novo item"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 border-t border-neutral-100 bg-[#fafafa] px-6 py-4 sm:space-x-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setNewProductModalOpen(false)}
                                className="h-10 border-neutral-200 bg-white px-4 text-[13px] font-extrabold text-dark-600 shadow-none hover:bg-neutral-50"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="h-10 gap-2 bg-[#f97316] px-5 text-[13px] font-extrabold text-white shadow-sm hover:bg-[#ea580c]"
                            >
                                <FaPlus size={13} />
                                Adicionar item
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}
