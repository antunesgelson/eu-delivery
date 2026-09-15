import { CupomDTO } from "@/dto/cupomDTO";

export const localCoupons: CupomDTO[] = [
    {
        id: 'cupom-zanini10',
        nome: 'ZANINI10',
        descricao: 'Ganhe 10% de desconto em pedidos acima de R$ 50,00.',
        listaPublica: true,
        quantidade: 120,
        status: true,
        tipo: 'porcentagem',
        unicoUso: false,
        validade: '2026-08-31T23:59:59.000Z',
        valor: 10,
        valorMinimoGasto: 50,
    },
    {
        id: 'cupom-retirada5',
        nome: 'RETIRADA5',
        descricao: 'R$ 5,00 de desconto para retirada no local em pedidos acima de R$ 35,00.',
        listaPublica: true,
        quantidade: 80,
        status: true,
        tipo: 'valor_fixo',
        unicoUso: false,
        validade: '2026-07-31T23:59:59.000Z',
        valor: 5,
        valorMinimoGasto: 35,
    },
    {
        id: 'cupom-familia15',
        nome: 'FAMILIA15',
        descricao: '15% de desconto para pedidos de família acima de R$ 120,00.',
        listaPublica: true,
        quantidade: 50,
        status: true,
        tipo: 'porcentagem',
        unicoUso: true,
        validade: '2026-09-30T23:59:59.000Z',
        valor: 15,
        valorMinimoGasto: 120,
    },
    {
        id: 'cupom-bbq8',
        nome: 'BBQ8',
        descricao: 'R$ 8,00 de desconto em pedidos com defumados acima de R$ 80,00.',
        listaPublica: true,
        quantidade: 60,
        status: true,
        tipo: 'valor_fixo',
        unicoUso: false,
        validade: '2026-08-15T23:59:59.000Z',
        valor: 8,
        valorMinimoGasto: 80,
    },
];

export function getCouponDiscount(coupon: CupomDTO | undefined, subtotal: number) {
    if (!coupon || subtotal < coupon.valorMinimoGasto) {
        return 0;
    }

    if (coupon.tipo === 'porcentagem') {
        return Math.min(subtotal * (coupon.valor / 100), subtotal);
    }

    return Math.min(coupon.valor, subtotal);
}

export function findCouponByCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    return localCoupons.find((coupon) => coupon.nome.toUpperCase() === normalizedCode);
}
