import { localCardapio } from "@/data/menu";

export type ProductStock = {
    saturday: number;
    sunday: number;
}

export type StockDay = keyof ProductStock;

export type ProductKind = 'simple' | 'compound';

export type ProductComponent = {
    productId: number;
    quantity: number;
}

export type AdminMenuProduct = {
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

export type AdminMenuCategory = {
    id: string;
    title: string;
    badge: string;
    status: 'active' | 'draft';
    products: AdminMenuProduct[];
    campaign?: string;
}

type StockRequirement = {
    product: AdminMenuProduct;
    quantity: number;
}

type CartStockItem = {
    quantidade: number;
    produto: {
        id: number;
        titulo: string;
    };
}

export const ADMIN_CATEGORIES_STORAGE_KEY = 'assados-zanini-admin-categories-v1';

const campaignImage = localCardapio[0]?.produtos[0]?.imgs?.[0]?.Location ?? '';
const MAX_COMPONENT_DEPTH = 8;

export function normalizeMenuSearch(value: string) {
    return value
        .trim()
        .toLocaleLowerCase('pt-BR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export function sanitizeStockQuantity(value: number) {
    if (Number.isNaN(value) || value < 0) return 0;
    return Math.round(value * 100) / 100;
}

export function getProductStock(productTitle: string): ProductStock {
    const normalizedTitle = normalizeMenuSearch(productTitle);

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

export function getDefaultClassifications(productTitle: string, categoryTitle?: string) {
    const normalizedTitle = normalizeMenuSearch(productTitle);
    const normalizedCategory = normalizeMenuSearch(categoryTitle ?? '');

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

export function getDefaultProductComposition(productTitle: string): {
    productKind: ProductKind;
    components: ProductComponent[];
} {
    const normalizedTitle = normalizeMenuSearch(productTitle);

    if (normalizedTitle.includes('combo')) {
        return {
            productKind: 'compound',
            components: [
                { productId: 102, quantity: 1 },
                { productId: 301, quantity: 1 },
                { productId: 401, quantity: 1 },
            ],
        };
    }

    if (normalizedTitle.includes('meio frango')) {
        return {
            productKind: 'compound',
            components: [
                { productId: 102, quantity: 0.5 },
            ],
        };
    }

    return {
        productKind: 'simple',
        components: [],
    };
}

export function formatStockDateKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function getScheduleDateKey(schedule?: string | null) {
    if (!schedule) return null;

    const dateKey = schedule.split('T')[0];
    return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : null;
}

export function getStockDayFromDateKey(dateKey: string): StockDay | null {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekDay = date.getDay();

    if (weekDay === 6) return 'saturday';
    if (weekDay === 0) return 'sunday';

    return null;
}

export function getNextServiceDateKeys(reference = new Date()) {
    const key = reference.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const today = new Date(`${key}T12:00:00Z`);
    const dates: { key: string; day: StockDay; label: string }[] = [];
    for (let offset = 0; offset <= 14 && dates.length < 2; offset++) {
        const date = new Date(today);
        date.setUTCDate(today.getUTCDate() + offset);
        const day = date.getUTCDay();
        if (day === 6 || day === 0) dates.push({ key: date.toISOString().slice(0, 10), day: day === 6 ? 'saturday' : 'sunday', label: day === 6 ? 'Sábado' : 'Domingo' });
    }
    return dates;
}

export function buildInitialAdminCategories(): AdminMenuCategory[] {
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
                    description: 'Frango assado sem recheio, maionese e Coca-Cola 2L para retirada.',
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

export function hydrateAdminCategories(categories: AdminMenuCategory[]) {
    return categories.map((category) => ({
        ...category,
        products: category.products.map((product) => {
            const defaultComposition = getDefaultProductComposition(product.title);

            return {
                ...product,
                stock: product.stock ?? getProductStock(product.title),
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

export function findAdminProduct(categories: AdminMenuCategory[], productId: number) {
    return categories.flatMap((category) => category.products).find((product) => product.id === productId) ?? null;
}

export function getProductStockForDate(product: AdminMenuProduct, dateKey: string) {
    const dateStock = product.stockByDate?.[dateKey];

    if (typeof dateStock === 'number') {
        return sanitizeStockQuantity(dateStock);
    }

    const stockDay = getStockDayFromDateKey(dateKey);

    if (!stockDay) {
        return 0;
    }

    return sanitizeStockQuantity(product.stock?.[stockDay] ?? 0);
}

export function setProductStockForDate(product: AdminMenuProduct, dateKey: string, quantity: number): AdminMenuProduct {
    const nextQuantity = sanitizeStockQuantity(quantity);
    const stockDay = getStockDayFromDateKey(dateKey);

    return {
        ...product,
        stock: stockDay
            ? {
                ...product.stock,
                [stockDay]: nextQuantity,
            }
            : product.stock,
        stockByDate: {
            ...(product.stockByDate ?? {}),
            [dateKey]: nextQuantity,
        },
    };
}

export function getProductAvailability(
    categories: AdminMenuCategory[],
    product: AdminMenuProduct,
    dateKey: string,
    visitedProductIds = new Set<number>(),
): number {
    if (product.forcedSoldOut || product.soldOutByDate?.[dateKey]) {
        return 0;
    }

    if (visitedProductIds.has(product.id)) {
        return 0;
    }

    if (product.productKind === 'compound' && product.components && product.components.length > 0) {
        const nextVisitedProductIds = new Set(visitedProductIds);
        nextVisitedProductIds.add(product.id);

        const componentAvailabilities = product.components.map((component) => {
            const componentProduct = findAdminProduct(categories, component.productId);

            if (!componentProduct || component.quantity <= 0) {
                return 0;
            }

            return Math.floor(getProductAvailability(categories, componentProduct, dateKey, nextVisitedProductIds) / component.quantity);
        });

        return componentAvailabilities.length > 0 ? Math.min(...componentAvailabilities) : 0;
    }

    return getProductStockForDate(product, dateKey);
}

function addRequirement(requirements: Map<number, StockRequirement>, product: AdminMenuProduct, quantity: number) {
    const currentRequirement = requirements.get(product.id);

    requirements.set(product.id, {
        product,
        quantity: sanitizeStockQuantity((currentRequirement?.quantity ?? 0) + quantity),
    });
}

function collectProductRequirements(
    categories: AdminMenuCategory[],
    product: AdminMenuProduct,
    quantity: number,
    requirements: Map<number, StockRequirement>,
    visitedProductIds = new Set<number>(),
    depth = 0,
) {
    if (depth > MAX_COMPONENT_DEPTH || visitedProductIds.has(product.id)) {
        addRequirement(requirements, product, quantity);
        return;
    }

    if (product.productKind === 'compound' && product.components && product.components.length > 0) {
        const nextVisitedProductIds = new Set(visitedProductIds);
        nextVisitedProductIds.add(product.id);

        product.components.forEach((component) => {
            const componentProduct = findAdminProduct(categories, component.productId);

            if (!componentProduct || component.quantity <= 0) {
                return;
            }

            collectProductRequirements(
                categories,
                componentProduct,
                sanitizeStockQuantity(quantity * component.quantity),
                requirements,
                nextVisitedProductIds,
                depth + 1,
            );
        });
        return;
    }

    addRequirement(requirements, product, quantity);
}

export function getCartStockRequirements(categories: AdminMenuCategory[], cartItems: CartStockItem[], dateKey?: string) {
    const requirements = new Map<number, StockRequirement>();
    const missingProducts: string[] = [];
    const unavailableProducts: string[] = [];

    cartItems.forEach((item) => {
        const product = findAdminProduct(categories, item.produto.id);

        if (!product) {
            missingProducts.push(item.produto.titulo);
            return;
        }

        if (dateKey) {
            const availableStock = getProductAvailability(categories, product, dateKey);

            if (availableStock < item.quantidade) {
                unavailableProducts.push(`${product.title}: disponível ${availableStock}, necessário ${item.quantidade}.`);
                return;
            }
        }

        collectProductRequirements(categories, product, item.quantidade, requirements);
    });

    return {
        requirements,
        missingProducts,
        unavailableProducts,
    };
}

export function consumeCartStock(categories: AdminMenuCategory[], cartItems: CartStockItem[], schedule?: string | null) {
    const dateKey = getScheduleDateKey(schedule);

    if (!dateKey) {
        return {
            ok: false as const,
            errors: ['Selecione uma data de retirada antes de confirmar o pedido.'],
            nextCategories: categories,
        };
    }

    const hydratedCategories = hydrateAdminCategories(categories);
    const { requirements, missingProducts, unavailableProducts } = getCartStockRequirements(hydratedCategories, cartItems, dateKey);
    const errors = [
        ...missingProducts.map((productTitle) => `${productTitle} não foi encontrado no estoque.`),
        ...unavailableProducts,
    ];

    requirements.forEach(({ product, quantity }) => {
        const availableStock = product.forcedSoldOut || product.soldOutByDate?.[dateKey]
            ? 0
            : getProductStockForDate(product, dateKey);

        if (availableStock < quantity) {
            errors.push(`${product.title}: disponível ${availableStock}, necessário ${quantity}.`);
        }
    });

    if (errors.length > 0) {
        return {
            ok: false as const,
            errors,
            nextCategories: hydratedCategories,
        };
    }

    const nextCategories = hydratedCategories.map((category) => ({
        ...category,
        products: category.products.map((product) => {
            const requirement = requirements.get(product.id);

            if (!requirement) {
                return product;
            }

            return setProductStockForDate(
                product,
                dateKey,
                getProductStockForDate(product, dateKey) - requirement.quantity,
            );
        }),
    }));

    return {
        ok: true as const,
        errors: [],
        dateKey,
        nextCategories,
    };
}
