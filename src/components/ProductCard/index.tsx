
import Image from 'next/image';
import Link from 'next/link';

import { ProdutosDTO } from '@/dto/productDTO';

import { FaPeopleGroup } from "react-icons/fa6";

import Thumb from '@/assets/products/box.png';
import { Tooltip } from 'react-tooltip';

export default function ProductCard({ titulo, descricao, imgs, valor, valorPromocional, servingSize, id }: ProdutosDTO) {
    const value = parseInt(valor)
    const discountPercentage = ((value - valorPromocional) / value) * 100;


    const originalPrice = (
        <div className='flex justify-between items-center mt-3'>
            <p className='uppercase text-muted font-semibold text-sm'>
                A partir de: <span className='text-primary font-semibold text-base ml-1'>R$ {value?.toFixed(2)}</span>
            </p>
            <span className='uppercase font-semibold text-sm flex items-center gap-1 text-muted'>
                <FaPeopleGroup
                    size={20}
                    data-tooltip-id={`${titulo}-tooltip`}
                    data-tooltip-content={`Serve ${servingSize > 1 && 'até'} ${servingSize} ${servingSize > 1 ? 'pessoas' : 'pessoa'} `}
                />
                {servingSize}
            </span>
            <Tooltip id={`${titulo}-tooltip`} />
        </div>
    );

    const discountedPrice = (
        <div className='flex flex-col  mt-3'>
            <p className='uppercase text-muted font-semibold text-sm'>
                De: <del className='text-red-700'>R$ {value?.toFixed(2)}</del>
            </p>
            <div className='flex items-center justify-between'>
                <p className='uppercase text-muted font-semibold text-sm'>
                    Por a partir de: <span className='text-primary font-semibold text-base ml-1'>R$ {valorPromocional?.toFixed(2)}</span>
                </p>
                <span className='uppercase font-semibold text-sm flex items-center gap-1 text-muted'>
                    <FaPeopleGroup
                        size={20}
                        data-tooltip-id={`${titulo}-tooltip`}
                        data-tooltip-content={`Serve ${servingSize > 1 ? 'até' : ''} ${servingSize} ${servingSize > 1 ? 'pessoas' : 'pessoa'} `}
                    />
                    {servingSize}
                </span>
            </div>
            <Tooltip id={`${titulo}-tooltip`} />
        </div>
    );

    return (
        <Link href={`/productdetails/${id}`}>
            <div className="bg-white grid grid-cols-2 p-2 rounded-md">
                <div className='px-1'>
                    <h3 className="uppercase font-semibold my-1">{titulo}</h3>
                    <p className="text-[12px] line-clamp-6 ">{descricao}</p>
                </div>

                <div className='relative'>
                    <div className=' bg-stone-200 blur-sm rounded-md absolute top-0 bottom-0 right-0 left-0 ' />
                    <div className="relative">
                        {valorPromocional !== 0 &&
                            <div className="absolute -top-1 right-0 text-white bg-red-600 px-2 py-1 transform translate-x-1/2">
                                <span className="font-bold mr-14 ml-2 ">-{discountPercentage?.toFixed(2)}%</span>
                                <div className="absolute top-0 left-3 h-full w-6  bg-red-600 -translate-x-full skew-x-[30deg] z-10" />
                            </div>
                        }
                        <Image
                            className="rounded-lg object-cover object-center 2xl:h-[450px] lg:h-[300px] h-[150px] max-h-[200px] lg:max-h-none    "
                            width={200}
                            height={200}
                            src={Thumb}
                            alt={titulo}
                        />
                    </div>
                </div>

                <div className=' col-span-2'>
                    {valorPromocional == 0 ? originalPrice : discountedPrice}
                </div>
            </div>
        </Link>
    )
}