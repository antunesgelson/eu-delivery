'use client'

import Thumb from '@/assets/products/thumb.jpg';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';


const removeItems = [
    'Alface',
    'Tomate',
    'Queijo',
    'Picles',
    'Molho especial',
    'Pão de brioche',
]

const addItems = [
    { name: 'Bacon', price: 2.5 },
    { name: 'Cheese', price: 1.5 },
    { name: 'Avocado', price: 2.0 },
    { name: 'Tomato', price: 0.75 },
    { name: 'Lettuce', price: 0.5 },
    { name: 'Onion', price: 0.25 },
    { name: 'Pickles', price: 0.3 },
    { name: 'Mushrooms', price: 1.0 },
    { name: 'Egg', price: 1.2 },
    { name: 'Jalapenos', price: 0.9 },
    { name: 'Sriracha Sauce', price: 0.6 },
]
export default function ProductorDetails() {
    const [removeSelectedItems, setRemoveSelectedItems] = useState<Record<number, boolean>>({});
    const [addSelectedItems, setAddSelectedItems] = useState<Record<number, boolean>>({});

    const handleClick = (index: number, type: string) => {
        // Atualiza o estado para alternar a seleção do item clicado
        switch (type) {
            case 'remove':
                setRemoveSelectedItems(prev => ({ ...prev, [index]: !prev[index] }));
                break;
            case 'add':
                setAddSelectedItems(prev => ({ ...prev, [index]: !prev[index] }));
                break;
            default:
                break;
        }
    };

    return (
        <motion.main
            className="mt-16 overflow-x-hidden "
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        >

            <div className='bg-white p-4'>
                <div className='flex justify-center'>
                    <Image
                        className="rounded-lg object-cover object-center 2xl:h-[450px] lg:h-[300px]  max-h-[200px] lg:max-h-none  "
                        width={500}
                        height={500}
                        src={Thumb.src}
                        alt={`product-details`}
                    />
                </div>
                <h1 className="uppercase font-semibold my-1 ">Product-Details</h1>
                <p className="text-[12px]">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit,
                    neque pariatur. Quis repellendus exercitationem natus asperiores
                    epudiandae pariatur ipsam dicta repellat voluptas neque, accusantium
                    mollitia cumque officia, perferendis numquam minus!
                </p>
            </div>

            <div className='p-4 leading-3'>
                <h2 className="uppercase text-xl font-bold ">deseja remover algo?</h2>
                <span className='text-[12px]'>Selecione os itens que você <strong>NÃO</strong> quer no seu produto.</span>
            </div>

            <div className='bg-white p-4 flex flex-col gap-5'>
                {removeItems.map((item, index) => (
                    <div key={index} className={`flex items-center gap-2 text-sm duraton-300  ${removeSelectedItems[index] && 'line-through text-red-700'}  `} onClick={() => handleClick(index, 'remove')}>
                        <Checkbox variant='remove' checked={!!removeSelectedItems[index]} onChange={() => { }} />
                        <span>Remover {item}</span>
                    </div>
                ))}
            </div>

            <div className='p-4 leading-3 relative'>
                <h2 className="uppercase text-xl font-bold ">adicionais</h2>
                <span className='text-[12px]'>Que tal turbinar seu pedido?</span>

                <div className='absolute top-18 right-3 bg-gray-400 text-white rounded-xl p-1 font-semibold text-sm'>
                    Selecione até 1 itens
                </div>
            </div>

            <div className='bg-white p-4 flex flex-col gap-5'>
                {addItems.map((item, index) => (
                    <div key={index} className={`flex items-center gap-2  text-sm ${addSelectedItems[index] && 'text-emerald-600'}`} onClick={() => handleClick(index, 'add')}>
                        <Checkbox variant='add' checked={!!addSelectedItems[index]} onChange={() => { }} />
                        <span>{item.name} + <strong>R$ {item.price.toFixed(2)}</strong></span>
                    </div>
                ))}
            </div>


            <div className='p-4 leading-3'>
                <h2 className="uppercase text-xl font-bold ">observação</h2>
                <span className='text-[12px]'>Utilize somente para observações.</span>
            </div>

            <div className='bg-white p-4 flex flex-col gap-5'>
                <Textarea placeholder="Digite sua mensagem aqui." />
            </div>

            <div className='flex  justify-center w-full px-4 mb-6'>
                <Button className='w-full h-12 '>Adicionar ao carrinho</Button>
            </div>
        </ motion.main>
    )
}