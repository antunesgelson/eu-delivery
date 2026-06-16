
import Image from 'next/image';
import Link from 'next/link';

import { ProdutosDTO } from '@/dto/productDTO';

import Thumb from '@/assets/products/box.png';

type ProductCardProps = ProdutosDTO & {
    variant?: 'compact' | 'list';
}

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

export default function ProductCard({ titulo, descricao, valor, valorPromocional, id, variant = 'list' }: ProductCardProps) {
    const value = parseFloat(valor)
    const price = valorPromocional > 0 ? valorPromocional : value;

    if (variant === 'compact') {
        return (
            <Link href={`/productdetails/${id}`} className="block w-full">
                <article className="overflow-hidden rounded-md bg-white">
                    <Image
                        className="h-[120px] w-full rounded-md object-cover"
                        width={160}
                        height={130}
                        src={Thumb}
                        alt={titulo}
                    />
                    <div className="pt-1">
                        <h3 className="line-clamp-2 min-h-[32px] text-[12px] font-extrabold uppercase leading-4 text-dark-900">{titulo}</h3>
                        <span className="text-[12px] font-bold leading-4 text-dark-500">{formatCurrency(price)}</span>
                    </div>
                </article>
            </Link>
        )
    }

    return (
        <Link href={`/productdetails/${id}`} className="block">
            <article className="grid grid-cols-[1fr_116px] gap-3 rounded-md bg-white p-3 shadow-sm">
                <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[13px] font-extrabold uppercase leading-4 text-dark-900">{titulo}</h3>
                    <p className="mt-1 line-clamp-3 text-[11px] leading-4 text-dark-500">{descricao}</p>
                    <div className="mt-2 flex items-center gap-2">
                        {valorPromocional > 0 && (
                            <del className="text-[11px] font-semibold text-red-700">{formatCurrency(value)}</del>
                        )}
                        <span className="text-[13px] font-extrabold text-dark-700">{formatCurrency(price)}</span>
                    </div>
                </div>
                <div className="relative h-[104px] overflow-hidden rounded-md bg-stone-100">
                    <Image
                        className="h-full w-full object-cover"
                        width={132}
                        height={112}
                        src={Thumb}
                        alt={titulo}
                    />
                </div>
            </article>
        </Link>
    )
}
