'use client'
import {useCatalogoAdmin} from '@/hook/useAdminData';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productFormSchema = z.object({ title: z.string().trim().min(1, 'Informe o nome do item.').max(200, 'Use até 200 caracteres.'), description: z.string().max(3000, 'Use até 3000 caracteres.'), price: z.number().positive('Informe um preço válido.').max(9999.99) });

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { FaArrowLeft, FaBox, FaBoxesStacked, FaFloppyDisk, FaImage, FaLayerGroup, FaLink, FaTags, FaTrashCan, FaUtensils, FaXmark } from "react-icons/fa6";

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

const ADMIN_CATEGORIES_STORAGE_KEY = 'assados-zanini-admin-categories-v1';
const campaignImage = localCardapio[0]?.produtos[0]?.imgs?.[0]?.Location ?? '';
const ITEM_CLASSIFICATIONS = [
    'Quente',
    'Gelado',
    'Bebida',
    'Assado',
    'Defumado',
    'Acompanhamento',
    'Mais pedido',
    'Promoção',
];

function normalizeSearch(value: string) {
    return value
        .trim()
        .toLocaleLowerCase('pt-BR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function getProductStock(productTitle: string): ProductStock {
    const normalizedTitle = normalizeSearch(productTitle);

    if (normalizedTitle.includes('frango assado recheado')) return { saturday: 12, sunday: 36 };
    if (normalizedTitle.includes('frango assado sem recheio')) return { saturday: 15, sunday: 36 };
    if (normalizedTitle.includes('meio frango')) return { saturday: 0, sunday: 0 };
    if (normalizedTitle.includes('costelinha')) return { saturday: 5, sunday: 9 };
    if (normalizedTitle.includes('maionese')) return { saturday: 15, sunday: 26 };
    if (normalizedTitle.includes('arroz')) return { saturday: 18, sunday: 24 };
    if (normalizedTitle.includes('coca-cola')) return { saturday: 15, sunday: 18 };
    if (normalizedTitle.includes('pureza')) return { saturday: 12, sunday: 14 };

    return { saturday: 0, sunday: 0 };
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

function buildInitialCategories(): AdminMenuCategory[] {
    return [
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
}

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

function sanitizeStockValue(value: number) {
    if (Number.isNaN(value) || value < 0) return 0;
    return Math.min(Math.floor(value), 999);
}

function sanitizeServingSize(value: number) {
    if (Number.isNaN(value) || value < 1) return 1;
    return Math.min(Math.floor(value), 99);
}

function sanitizePriceValue(value: number) {
    if (Number.isNaN(value) || value < 0) return 0;
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
    if (!onlyDigits) return 0;
    return sanitizePriceValue(Number(onlyDigits) / 100);
}

function getTotalStock(stock: ProductStock) {
    return stock.saturday + stock.sunday;
}

function createProductId() {
    return Number.parseInt(crypto.randomUUID().replace(/-/g, '').slice(0, 13), 16);
}

function PriceInputControl({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    const [displayValue, setDisplayValue] = React.useState(formatPriceInput(value));

    React.useEffect(() => {
        setDisplayValue(formatPriceInput(value));
    }, [value]);

    return (
        <label className="grid h-11 grid-cols-[42px_minmax(0,1fr)] items-center overflow-hidden rounded-md border border-neutral-200 bg-white focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-[#f97316]/15">
            <span className="grid h-full place-items-center border-r border-neutral-200 text-[13px] font-extrabold text-[#f97316]">
                R$
            </span>
            <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={(event) => {
                    const nextValue = parsePriceInput(event.target.value);
                    setDisplayValue(formatPriceInput(nextValue));
                    onChange(nextValue);
                }}
                className="h-full w-full bg-transparent px-3 text-[15px] font-extrabold text-dark-900 outline-none"
                aria-label="Preço do item"
            />
        </label>
    );
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
        <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className={cn(
                    "text-[11px] font-extrabold uppercase",
                    tone === 'orange' ? "text-[#f97316]" : "text-[#2f8df6]"
                )}>
                    {label}
                </span>
                <span className="text-[11px] font-bold text-dark-400">un.</span>
            </div>
            <div className="grid grid-cols-[34px_minmax(54px,1fr)_34px] overflow-hidden rounded-md border border-neutral-200 bg-[#f8fafc]">
                <button
                    type="button"
                    onClick={() => onChange(value - 1)}
                    className="grid h-9 place-items-center border-r border-neutral-200 bg-white text-dark-500 transition hover:bg-[#fff3ea] hover:text-[#f97316] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={value <= 0}
                    aria-label={`Diminuir estoque de ${label}`}
                >
                    -
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
                    +
                </button>
            </div>
        </div>
    );
}

function NewProductPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('categoryId');
    const categoryTitle = searchParams.get('categoryTitle');
    const productIdParam = searchParams.get('productId');
    const editingProductId = React.useMemo(() => {
        if (!productIdParam) return null;

        const parsedProductId = Number(productIdParam);
        return Number.isFinite(parsedProductId) ? parsedProductId : null;
    }, [productIdParam]);
    const isEditingProduct = editingProductId !== null;
    const {categories,saveCategories,isLoading:loadingCatalog,error:catalogError,refetch,isPending:savingCatalog}=useCatalogoAdmin();
    const { watch, setValue, trigger, formState: { errors } } = useForm<z.infer<typeof productFormSchema>>({ resolver: zodResolver(productFormSchema), defaultValues: { title: '', description: '', price: 0 } });
    const title = watch('title'), description = watch('description'), price = watch('price');
    const setTitle = React.useCallback((value: string) => setValue('title', value), [setValue]);
    const setDescription = React.useCallback((value: string) => setValue('description', value), [setValue]);
    const setPrice = React.useCallback((value: number) => setValue('price', value), [setValue]);
    const initialized = React.useRef<number | null>(null);
    const newId = React.useRef<number | null>(null);
    const submitting = React.useRef(false);
    const [readingImage, setReadingImage] = React.useState(false);
    const [image, setImage] = React.useState('');
    const [imageName, setImageName] = React.useState('');
    const [servingSize, setServingSize] = React.useState(1);
    const [stock, setStock] = React.useState<ProductStock>({ saturday: 0, sunday: 0 });
    const [forcedSoldOut, setForcedSoldOut] = React.useState(false);
    const [classifications, setClassifications] = React.useState<string[]>([]);
    const [customClassification, setCustomClassification] = React.useState('');
    const [productKind, setProductKind] = React.useState<ProductKind>('simple');
    const [components, setComponents] = React.useState<ProductComponent[]>([]);

    const selectedCategory = React.useMemo(() => {
        if (!categoryId) return null;
        return categories.find((category) => category.id === categoryId) ?? null;
    }, [categories, categoryId]);

    const selectedProduct = React.useMemo(() => {
        if (!selectedCategory || editingProductId === null) {
            return null;
        }

        return selectedCategory.products.find((product) => product.id === editingProductId) ?? null;
    }, [editingProductId, selectedCategory]);

    React.useEffect(() => {
        if (!isEditingProduct || !selectedProduct || initialized.current === selectedProduct.id) {
            return;
        }

        initialized.current = selectedProduct.id;
        setTitle(selectedProduct.title);
        setDescription(selectedProduct.description);
        setPrice(sanitizePriceValue(selectedProduct.price));
        setImage(selectedProduct.image);
        setImageName(selectedProduct.image ? 'Imagem atual do item' : '');
        setServingSize(sanitizeServingSize(selectedProduct.servingSize));
        const serviceDates = getNextServiceDateKeys();
        const saturdayDate = serviceDates.find((date) => date.day === 'saturday');
        const sundayDate = serviceDates.find((date) => date.day === 'sunday');
        setStock({
            saturday: sanitizeStockValue(
                saturdayDate && typeof selectedProduct.stockByDate?.[saturdayDate.key] === 'number'
                    ? selectedProduct.stockByDate[saturdayDate.key]
                    : selectedProduct.stock?.saturday ?? 0
            ),
            sunday: sanitizeStockValue(
                sundayDate && typeof selectedProduct.stockByDate?.[sundayDate.key] === 'number'
                    ? selectedProduct.stockByDate[sundayDate.key]
                    : selectedProduct.stock?.sunday ?? 0
            ),
        });
        setForcedSoldOut(selectedProduct.forcedSoldOut);
        setProductKind(selectedProduct.productKind ?? 'simple');
        setComponents(selectedProduct.components ?? []);
        setClassifications(
            selectedProduct.classifications && selectedProduct.classifications.length > 0
                ? selectedProduct.classifications
                : getDefaultClassifications(selectedProduct.title, selectedCategory?.title ?? categoryTitle ?? '')
        );
    }, [categoryTitle, isEditingProduct, selectedCategory?.title, selectedProduct, setTitle, setDescription, setPrice]);

    const availableComponentProducts = React.useMemo(() => (
        categories
            .flatMap((category) => category.products.map((product) => ({
                ...product,
                categoryTitle: category.title,
            })))
            .filter((product) => product.id !== editingProductId)
    ), [categories, editingProductId]);

    const draftProduct = React.useMemo<AdminMenuProduct>(() => ({
        id: editingProductId ?? -1,
        title: title.trim() || 'Novo item',
        description: description.trim() || 'Item em edição.',
        price,
        image: image || campaignImage,
        servingSize,
        stock,
        forcedSoldOut,
        classifications,
        productKind,
        components,
        stockByDate: selectedProduct?.stockByDate ?? {},
        soldOutByDate: selectedProduct?.soldOutByDate ?? {},
    }), [classifications, components, description, editingProductId, forcedSoldOut, image, price, productKind, selectedProduct?.soldOutByDate, selectedProduct?.stockByDate, servingSize, stock, title]);

    const draftAvailabilityPreview = React.useMemo(() => {
        if (productKind !== 'compound' || components.length === 0) {
            return [];
        }

        const previewCategories = selectedCategory
            ? categories.map((category) => (
                category.id === selectedCategory.id
                    ? {
                        ...category,
                        products: [
                            ...category.products.filter((product) => product.id !== draftProduct.id),
                            draftProduct,
                        ],
                    }
                    : category
            ))
            : categories;

        return getNextServiceDateKeys().map((date) => ({
            ...date,
            availability: getProductAvailability(previewCategories, draftProduct, date.key),
        }));
    }, [categories, components.length, draftProduct, productKind, selectedCategory]);

    const handleStockChange = (day: StockDay, value: number) => {
        const nextValue = sanitizeStockValue(value);

        setStock((currentStock) => ({
            ...currentStock,
            [day]: nextValue,
        }));
    };

    const handleToggleClassification = (classification: string) => {
        setClassifications((currentClassifications) => (
            currentClassifications.includes(classification)
                ? currentClassifications.filter((currentClassification) => currentClassification !== classification)
                : [...currentClassifications, classification]
        ));
    };

    const handleAddCustomClassification = () => {
        const safeClassification = customClassification.trim();

        if (!safeClassification) {
            toast.error('Informe o nome da classificação.');
            return;
        }

        if (safeClassification.length > 24) {
            toast.error('Use uma classificação menor, com até 24 caracteres.');
            return;
        }

        const alreadyExists = classifications.some((classification) => (
            normalizeSearch(classification) === normalizeSearch(safeClassification)
        ));

        if (alreadyExists) {
            toast.error('Essa classificação já foi adicionada.');
            return;
        }

        setClassifications((currentClassifications) => [...currentClassifications, safeClassification]);
        setCustomClassification('');
    };

    const handleSelectProductKind = (nextProductKind: ProductKind) => {
        setProductKind(nextProductKind);

        if (nextProductKind === 'simple') {
            setComponents([]);
        }
    };

    const handleAddComponent = () => {
        const nextProduct = availableComponentProducts.find((product) => (
            !components.some((component) => component.productId === product.id)
        ));

        if (!nextProduct) {
            toast.error('Não há outro produto disponível para vincular.');
            return;
        }

        setComponents((currentComponents) => [
            ...currentComponents,
            {
                productId: nextProduct.id,
                quantity: 1,
            },
        ]);
    };

    const handleComponentProductChange = (index: number, productId: number) => {
        setComponents((currentComponents) => currentComponents.map((component, currentIndex) => (
            currentIndex === index
                ? { ...component, productId }
                : component
        )));
    };

    const handleComponentQuantityChange = (index: number, quantity: number) => {
        const nextQuantity = Number.isNaN(quantity) || quantity <= 0 ? 1 : Math.min(Math.round(quantity * 100) / 100, 99);

        setComponents((currentComponents) => currentComponents.map((component, currentIndex) => (
            currentIndex === index
                ? { ...component, quantity: nextQuantity }
                : component
        )));
    };

    const handleRemoveComponent = (index: number) => {
        setComponents((currentComponents) => currentComponents.filter((_, currentIndex) => currentIndex !== index));
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            toast.error('Escolha uma imagem PNG, JPG ou WEBP.');
            event.target.value = '';
            return;
        }

        if (file.size > 1400000) {
            toast.error('A imagem deve ter no máximo 1,4MB para salvar no cardápio.');
            event.target.value = '';
            return;
        }

        setReadingImage(true);
        const reader = new FileReader();
        reader.onloadend = () => setReadingImage(false);

        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                toast.error('Não foi possível carregar a imagem.');
                return;
            }

            setImage(reader.result);
            setImageName(file.name);
        };

        reader.onerror = () => {
            toast.error('Não foi possível carregar a imagem.');
        };

        reader.readAsDataURL(file);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (savingCatalog || submitting.current || readingImage || !(await trigger())) return;
        const safeTitle = title.trim();
        const safeDescription = description.trim();

        if (!categoryId || !selectedCategory) {
            toast.error('Categoria não encontrada. Recarregue o cardápio.');
            return;
        }

        if (!safeTitle) {
            toast.error('Informe o nome do item.');
            return;
        }

        if (price <= 0) {
            toast.error('Informe um preço válido.');
            return;
        }

        if (isEditingProduct && !selectedProduct) {
            toast.error('Item não encontrado para edição.');
            return;
        }

        if (productKind === 'compound' && components.length === 0) {
            toast.error('Informe pelo menos um componente para o produto composto.');
            return;
        }

        const stockByDate = getNextServiceDateKeys().reduce<Record<string, number>>((dates, date) => ({
            ...dates,
            [date.key]: sanitizeStockValue(stock[date.day]),
        }), selectedProduct?.stockByDate ?? {});

        newId.current ??= createProductId();
        const nextProduct: AdminMenuProduct = {
            id: editingProductId ?? newId.current,
            title: safeTitle,
            description: safeDescription || 'Item cadastrado pelo painel administrativo.',
            price: sanitizePriceValue(price),
            image: image || campaignImage,
            servingSize: sanitizeServingSize(servingSize),
            stock: {
                saturday: sanitizeStockValue(stock.saturday),
                sunday: sanitizeStockValue(stock.sunday),
            },
            forcedSoldOut,
            classifications: classifications.length > 0 ? classifications : undefined,
            productKind,
            components: productKind === 'compound'
                ? components.map((component) => ({
                    productId: component.productId,
                    quantity: Math.max(component.quantity, 0.01),
                }))
                : [],
            stockByDate: productKind === 'simple' ? stockByDate : selectedProduct?.stockByDate ?? {},
            soldOutByDate: selectedProduct?.soldOutByDate ?? {},
        };

        const categoryExists = categories.some((category) => category.id === categoryId);
        const baseCategories = categoryExists
            ? categories
            : [
                ...categories,
                {
                    id: categoryId,
                    title: categoryTitle || 'Nova categoria',
                    badge: 'Itens principais',
                    status: 'active' as const,
                    products: [],
                },
            ];

        const nextCategories = baseCategories.map((category) => (
            category.id === categoryId
                ? {
                    ...category,
                    products: isEditingProduct
                        ? category.products.map((product) => (
                            product.id === editingProductId ? nextProduct : product
                        ))
                        : [...category.products.filter(product => product.id !== nextProduct.id), nextProduct],
                }
                : category
        ));

        submitting.current = true;
        const saved = await saveCategories(nextCategories);
        submitting.current = false;

        if (!saved) return;

        toast.success(isEditingProduct ? 'Item atualizado no cardápio.' : 'Item adicionado ao cardápio.', {
            description: safeTitle,
        });
        router.push('/admin/cardapio');
    };

    if (loadingCatalog) return <main className="p-6" role="status">Carregando dados…</main>;
    if (catalogError && categories.length === 0) return <main className="p-6" role="alert">Não foi possível carregar os dados. <button onClick={() => refetch()}>Tentar novamente</button></main>;

    return (
        <main className="min-h-[calc(100vh-61px)] bg-[#f3f5f8] p-3">
            <form onSubmit={handleSubmit} noValidate><fieldset disabled={savingCatalog || readingImage} className="grid gap-3">
                {catalogError && <p role="alert">Não foi possível atualizar o cardápio. Sua edição foi preservada. <button type="button" onClick={() => refetch()}>Tentar novamente</button></p>}
                <section className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <Link
                                href="/admin/cardapio"
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-neutral-200 bg-white text-dark-600 transition hover:bg-neutral-50"
                                aria-label="Voltar para o gestor de cardápio"
                            >
                                <FaArrowLeft size={15} />
                            </Link>
                            <div className="min-w-0">
                                <span className="text-[10px] font-extrabold uppercase text-[#f97316]">Gestor de cardápio</span>
                                <h2 className="truncate text-[20px] font-extrabold leading-6 text-dark-900">
                                    {isEditingProduct ? 'Editar item' : 'Adicionar novo item'}
                                </h2>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/admin/cardapio')}
                                className="h-10 gap-2 border-neutral-200 bg-white px-4 text-[13px] font-extrabold text-dark-600 shadow-none hover:bg-neutral-50"
                            >
                                <FaXmark size={13} />
                                Cancelar
                            </Button>
                            <Button
                                type="submit" disabled={savingCatalog}
                                className="h-10 gap-2 bg-[#f97316] px-5 text-[13px] font-extrabold text-white shadow-sm hover:bg-[#ea580c]"
                            >
                                <FaFloppyDisk size={13} />
                                {isEditingProduct ? 'Salvar alterações' : 'Salvar item'}
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-[minmax(0,1fr)_340px] gap-3">
                    <div className="grid gap-3">
                        <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff3ea] text-[#f97316]">
                                    <FaUtensils size={17} />
                                </div>
                                <div>
                                    <h3 className="text-[16px] font-extrabold text-dark-900">Informações do item</h3>
                                    <p className="text-[12px] font-semibold text-dark-500">Dados que aparecem para o cliente no cardápio.</p>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="product-title" className="text-[12px] font-extrabold uppercase text-dark-500">
                                        Nome do item
                                    </Label>
                                    <Input
                                        id="product-title"
                                        error={errors.title?.message}
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        placeholder="Ex: Frango assado especial"
                                        autoFocus
                                        className="h-11 !rounded-md !border-neutral-200 !bg-white text-[14px] font-bold !text-dark-900 shadow-none placeholder:!text-dark-300 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="product-description" className="text-[12px] font-extrabold uppercase text-dark-500">
                                        Descrição
                                    </Label>
                                    <Textarea
                                        id="product-description"
                                        value={description}
                                        onChange={(event) => setDescription(event.target.value)}
                                        placeholder="Detalhe recheio, acompanhamentos, preparo ou observações importantes."
                                        className="min-h-[138px] !rounded-md !border-neutral-200 !bg-white text-[14px] font-semibold !text-dark-900 shadow-none placeholder:!text-dark-300 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900"
                                    />
                                    {errors.description && <p role="alert" className="text-sm text-red-600">{errors.description.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff3ea] text-[#f97316]">
                                    <FaTags size={17} />
                                </div>
                                <div>
                                    <h3 className="text-[16px] font-extrabold text-dark-900">Classificações do item</h3>
                                    <p className="text-[12px] font-semibold text-dark-500">Use etiquetas para destacar preparo, temperatura ou tipo do produto.</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {ITEM_CLASSIFICATIONS.map((classification) => {
                                    const selected = classifications.includes(classification);

                                    return (
                                        <button
                                            key={classification}
                                            type="button"
                                            onClick={() => handleToggleClassification(classification)}
                                            className={cn(
                                                "h-9 rounded-full border px-3 text-[12px] font-extrabold transition",
                                                selected
                                                    ? "border-[#f97316] bg-[#fff3ea] text-[#f97316] shadow-[0_0_0_2px_rgba(249,115,22,0.08)]"
                                                    : "border-neutral-200 bg-white text-dark-500 hover:border-[#f97316]/45 hover:bg-[#fff7ed] hover:text-[#f97316]"
                                            )}
                                            aria-pressed={selected}
                                        >
                                            {classification}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-lg border border-neutral-200 bg-[#fafafa] p-3">
                                <Input
                                    value={customClassification}
                                    onChange={(event) => setCustomClassification(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            handleAddCustomClassification();
                                        }
                                    }}
                                    placeholder="Criar classificação personalizada, ex: Gelado"
                                    className="h-10 !rounded-md !border-neutral-200 !bg-white text-[13px] font-bold !text-dark-900 shadow-none placeholder:!text-dark-300 focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddCustomClassification}
                                    className="h-10 border-[#f97316]/35 bg-[#fff7ed] px-4 text-[12px] font-extrabold text-[#f97316] shadow-none hover:bg-[#ffedd5] hover:text-[#ea580c]"
                                >
                                    Adicionar
                                </Button>
                            </div>

                            {classifications.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#f8fafc] px-3 py-2">
                                    <span className="text-[11px] font-extrabold uppercase text-dark-400">Selecionadas</span>
                                    {classifications.map((classification) => (
                                        <span
                                            key={classification}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-dark-700 ring-1 ring-neutral-200"
                                        >
                                            {classification}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleClassification(classification)}
                                                className="text-dark-300 transition hover:text-red-600"
                                                aria-label={`Remover classificação ${classification}`}
                                            >
                                                <FaXmark size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff3ea] text-[#f97316]">
                                    <FaLink size={17} />
                                </div>
                                <div>
                                    <h3 className="text-[16px] font-extrabold text-dark-900">Composição do produto</h3>
                                    <p className="text-[12px] font-semibold text-dark-500">Defina se o item baixa estoque próprio ou consome produtos base.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleSelectProductKind('simple')}
                                    className={cn(
                                        "rounded-lg border px-4 py-3 text-left transition",
                                        productKind === 'simple'
                                            ? "border-[#f97316] bg-[#fff7ed] ring-2 ring-[#f97316]/10"
                                            : "border-neutral-200 bg-white hover:bg-neutral-50"
                                    )}
                                >
                                    <strong className="block text-[14px] font-extrabold text-dark-900">Produto simples</strong>
                                    <span className="mt-1 block text-[12px] font-semibold leading-4 text-dark-500">
                                        Baixa o próprio estoque. Ex: frango, arroz, maionese, Coca.
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSelectProductKind('compound')}
                                    className={cn(
                                        "rounded-lg border px-4 py-3 text-left transition",
                                        productKind === 'compound'
                                            ? "border-[#f97316] bg-[#fff7ed] ring-2 ring-[#f97316]/10"
                                            : "border-neutral-200 bg-white hover:bg-neutral-50"
                                    )}
                                >
                                    <strong className="block text-[14px] font-extrabold text-dark-900">Produto composto</strong>
                                    <span className="mt-1 block text-[12px] font-semibold leading-4 text-dark-500">
                                        Baixa o estoque dos componentes. Ex: combo, kit, meio frango.
                                    </span>
                                </button>
                            </div>

                            {productKind === 'compound' && (
                                <div className="mt-4 rounded-lg border border-neutral-200 bg-[#fafafa] p-3">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <strong className="block text-[13px] font-extrabold text-dark-900">Componentes consumidos</strong>
                                            <span className="text-[12px] font-semibold text-dark-500">Cada venda deste item reduz os produtos abaixo.</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleAddComponent}
                                            className="h-9 border-[#f97316]/35 bg-white px-3 text-[12px] font-extrabold text-[#f97316] shadow-none hover:bg-[#fff3ea]"
                                        >
                                            Adicionar componente
                                        </Button>
                                    </div>

                                    <div className="grid gap-2">
                                        {components.length === 0 ? (
                                            <div className="rounded-md border border-dashed border-neutral-300 bg-white p-4 text-center">
                                                <strong className="text-[13px] font-extrabold text-dark-800">Nenhum componente vinculado</strong>
                                                <p className="mt-1 text-[12px] font-semibold text-dark-500">Adicione frango, maionese, bebida ou outro produto base.</p>
                                            </div>
                                        ) : (
                                            components.map((component, index) => (
                                                <div key={`${component.productId}-${index}`} className="grid grid-cols-[minmax(0,1fr)_120px_36px] gap-2">
                                                    <select
                                                        value={component.productId}
                                                        onChange={(event) => handleComponentProductChange(index, Number(event.target.value))}
                                                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-[13px] font-bold text-dark-900 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/15"
                                                        aria-label="Produto base do componente"
                                                    >
                                                        {availableComponentProducts.map((product) => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.title} - {product.categoryTitle}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min={0.01}
                                                        step={0.5}
                                                        value={component.quantity}
                                                        onChange={(event) => handleComponentQuantityChange(index, Number(event.target.value))}
                                                        className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-center text-[13px] font-extrabold text-dark-900 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/15"
                                                        aria-label="Quantidade consumida do componente"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveComponent(index)}
                                                        className="grid h-10 place-items-center rounded-md border border-neutral-200 bg-white text-red-600 transition hover:bg-red-50"
                                                        aria-label="Remover componente"
                                                    >
                                                        <FaTrashCan size={13} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {draftAvailabilityPreview.length > 0 && (
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            {draftAvailabilityPreview.map((date) => (
                                                <div key={date.key} className="rounded-md bg-white px-3 py-2">
                                                    <span className="block text-[10px] font-extrabold uppercase text-dark-400">
                                                        {date.label} {date.key.split('-').reverse().slice(0, 2).join('/')}
                                                    </span>
                                                    <strong className="mt-1 block text-[18px] font-extrabold text-dark-900">{date.availability} un. disponíveis</strong>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff3ea] text-[#f97316]">
                                    <FaBoxesStacked size={17} />
                                </div>
                                <div>
                                    <h3 className="text-[16px] font-extrabold text-dark-900">Estoque inteligente</h3>
                                    <p className="text-[12px] font-semibold text-dark-500">Controle separado para sábado e domingo.</p>
                                </div>
                            </div>

                            {productKind === 'compound' ? (
                                <div className="rounded-lg border border-[#fed7aa] bg-[#fff7ed] p-4">
                                    <strong className="block text-[14px] font-extrabold text-dark-900">Estoque calculado pelos componentes</strong>
                                    <p className="mt-1 text-[12px] font-semibold leading-5 text-dark-600">
                                        Este produto não possui estoque isolado. A disponibilidade é sempre o menor saldo entre os itens base cadastrados na composição.
                                    </p>
                                    {draftAvailabilityPreview.length > 0 && (
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            {draftAvailabilityPreview.map((date) => (
                                                <div key={date.key} className="rounded-md bg-white px-3 py-2">
                                                    <span className="block text-[10px] font-extrabold uppercase text-dark-400">
                                                        {date.label}
                                                    </span>
                                                    <strong className="text-[18px] font-extrabold text-[#f97316]">{date.availability} un.</strong>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <StockDayControl
                                            label="Sábado"
                                            value={stock.saturday}
                                            tone="orange"
                                            onChange={(value) => handleStockChange('saturday', value)}
                                        />
                                        <StockDayControl
                                            label="Domingo"
                                            value={stock.sunday}
                                            tone="blue"
                                            onChange={(value) => handleStockChange('sunday', value)}
                                        />
                                    </div>

                                    <div className="rounded-lg border border-neutral-200 bg-[#fafafa] p-4">
                                        <span className="text-[11px] font-extrabold uppercase text-dark-400">Total disponível</span>
                                        <strong className="mt-2 block text-[32px] font-extrabold leading-none text-dark-900">{getTotalStock(stock)}</strong>
                                        <p className="mt-2 text-[12px] font-semibold leading-4 text-dark-500">
                                            Soma dos itens disponíveis para retirada nos dias de atendimento.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="grid gap-3">
                        <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <FaLayerGroup className="text-[#f97316]" size={15} />
                                <strong className="text-[13px] font-extrabold text-dark-900">Seção</strong>
                            </div>
                            <div className="rounded-lg bg-[#fafafa] p-3">
                                <span className="block text-[11px] font-extrabold uppercase text-dark-400">Categoria selecionada</span>
                                <strong className="mt-1 block truncate text-[16px] font-extrabold text-dark-900">
                                    {selectedCategory?.title ?? categoryTitle ?? 'Categoria não encontrada'}
                                </strong>
                            </div>
                        </div>

                        <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <FaImage className="text-[#f97316]" size={15} />
                                <strong className="text-[13px] font-extrabold text-dark-900">Imagem do item</strong>
                            </div>
                            <input
                                id="product-image"
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleImageChange}
                                className="sr-only"
                            />
                            <label
                                htmlFor="product-image"
                                className="flex min-h-[212px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-[#fafafa] px-4 py-5 text-center transition hover:border-[#f97316]/60 hover:bg-[#fff7ed]"
                            >
                                {image ? (
                                    <Image
                                        src={image}
                                        alt={imageName || 'Imagem selecionada'}
                                        width={280}
                                        height={180}
                                        unoptimized
                                        className="h-[180px] w-full rounded-md object-cover"
                                    />
                                ) : (
                                    <>
                                        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#fff3ea] text-[#f97316]">
                                            <FaImage size={20} />
                                        </span>
                                        <strong className="mt-3 text-[13px] font-extrabold text-dark-900">
                                            Escolher imagem do computador
                                        </strong>
                                        <span className="mt-1 text-[12px] font-semibold leading-4 text-dark-400">
                                            PNG, JPG ou WEBP até 1,4MB
                                        </span>
                                    </>
                                )}
                            </label>
                            {imageName && (
                                <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-[#fafafa] px-3 py-2">
                                    <span className="truncate text-[12px] font-bold text-dark-600">{imageName}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImage('');
                                            setImageName('');
                                        }}
                                        className="shrink-0 text-[12px] font-extrabold text-red-600 transition hover:text-red-700"
                                    >
                                        Remover
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <FaBox className="text-[#f97316]" size={15} />
                                <strong className="text-[13px] font-extrabold text-dark-900">Venda</strong>
                            </div>

                            <div className="grid gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-[12px] font-extrabold uppercase text-dark-500">Preço</Label>
                                    <PriceInputControl value={price} onChange={setPrice} />
                                    {errors.price && <p role="alert" className="text-sm text-red-600">{errors.price.message}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="serving-size" className="text-[12px] font-extrabold uppercase text-dark-500">
                                        Serve quantas pessoas
                                    </Label>
                                    <Input
                                        id="serving-size"
                                        type="number"
                                        min={1}
                                        max={99}
                                        value={servingSize}
                                        onChange={(event) => setServingSize(sanitizeServingSize(Number(event.target.value)))}
                                        className="h-11 !rounded-md !border-neutral-200 !bg-white text-center text-[14px] font-extrabold !text-dark-900 shadow-none focus-visible:!ring-2 focus-visible:!ring-[#f97316]/20 dark:!border-neutral-200 dark:!bg-white dark:!text-dark-900"
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-[#fafafa] px-4 py-3">
                                    <div>
                                        <strong className="block text-[13px] font-extrabold text-dark-900">Esgotar item</strong>
                                        <span className="mt-0.5 block text-[12px] font-semibold text-dark-500">
                                            Cadastra sem vender agora.
                                        </span>
                                    </div>
                                    <Switch
                                        checked={forcedSoldOut}
                                        onCheckedChange={(checked) => setForcedSoldOut(checked === true)}
                                        className="data-[state=checked]:!bg-[#f97316]"
                                        aria-label="Esgotar item"
                                    />
                                </div>
                            </div>
                        </div>
                    </aside>
                </section>
            </fieldset></form>
        </main>
    );
}

export default function NewProductPage() {
    return (
        <React.Suspense fallback={null}>
            <NewProductPageContent />
        </React.Suspense>
    );
}
