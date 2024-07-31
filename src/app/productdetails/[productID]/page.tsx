'use client'
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

import { ModalSubstituir } from '@/components/Modal/Substituir';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

import { cardapio } from '@/data';

import Thumb from '@/assets/products/thumb.jpg';
import { IngredientesDTO } from '@/dto/productDTO';
import { FaPeopleGroup } from 'react-icons/fa6';

export default function ProductorDetails() {
    const [removeSelectedItems, setRemoveSelectedItems] = useState<Record<number, boolean>>({});
    const [addSelectedItems, setAddSelectedItems] = useState<Record<number, boolean>>({});
    const [removeItem, setRemoveItem] = useState<IngredientesDTO>({} as IngredientesDTO);
    const [openModal, setOpenModal] = useState(false);

    const handleClick = (index: number, type: string,) => {
        // Atualiza o estado para alternar a seleção do item clicado
        switch (type) {
            case 'remove':
                setRemoveSelectedItems(prev => {
                    const isCurrentlySelected = prev[index];
                    const newState = { ...prev, [index]: !isCurrentlySelected };
                    if (!isCurrentlySelected) {
                        setOpenModal(true);
                    }
                    return newState;
                });
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
            className="mt-14 overflow-x-hidden"
            initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>
            <div className='bg-white p-4'>
                <div className='flex justify-center'>
                    <Image
                        className="rounded-lg object-cover object-center 2xl:h-[450px] lg:h-[300px] max-h-[200px] lg:max-h-none"
                        width={500}
                        height={500}
                        src={Thumb.src}
                        alt={`product-details`}
                    />
                </div>
                <h1 className="uppercase font-semibold my-1">Product-Details</h1>
                <p className="text-[12px]">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit,
                    neque pariatur. Quis repellendus exercitationem natus asperiores
                    epudiandae pariatur ipsam dicta repellat voluptas neque, accusantium
                    mollitia cumque officia, perferendis numquam minus!
                </p>

                <span className='uppercase font-semibold text-sm flex items-center gap-1 text-muted mt-2'>serve até: <FaPeopleGroup size={20} />  {cardapio[0].itens[0].servingSize}</span>
            </div>

            <div className='p-4 leading-3 -mt-3'>
                <h2 className="uppercase text-xl font-bold">deseja remover algo?</h2>
                <span className='text-[12px]'>Selecione os itens que você <strong>NÃO</strong> quer no seu produto.</span>
            </div>

            <div className='bg-white p-4 flex flex-col gap-5'>
                {cardapio[0].itens[0]?.ingredientes.filter(item => item.removivel !== false).map((item, index) => (
                    <div key={index} className="flex flex-col gap-2 text-sm duration-300">
                        <div className={`flex items-center gap-2 ${removeSelectedItems[index] && 'line-through text-red-700'}`} onClick={() => { handleClick(index, 'remove'), setRemoveItem(item) }}>
                            <Checkbox variant='remove' checked={!!removeSelectedItems[index]} onChange={() => { }} />
                            <span className='capitalize'>Remover {item.nome}</span>
                        </div>
                        {/* {removeSelectedItems[index] && (
                            <div className="ml-6">
                                <p className="text-sm text-gray-500">Sugestões para trocar:</p>
                                <ul className="list-disc list-inside">
                                    {suggestionsForItem(item).map((suggestion, idx) => (
                                        <li key={idx} className="text-sm text-blue-500">{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        )} */}
                    </div>
                ))}
            </div>

            <div className='p-4 leading-3 relative'>
                <h2 className="uppercase text-xl font-bold">adicionais</h2>
                <span className='text-[12px]'>Que tal turbinar seu pedido?</span>

                <div className='absolute top-18 right-3 bg-gray-400 text-white rounded-xl p-1 font-semibold text-sm'>
                    Selecione até 1 itens
                </div>
            </div>

            <div className='bg-white p-4 flex flex-col gap-5'>
                {cardapio[0].itens[0]?.ingredientes?.map((item, index) => (
                    <div key={index} className={`flex items-center gap-2 text-sm ${addSelectedItems[index] && 'text-emerald-600'}`} onClick={() => handleClick(index, 'add')}>
                        <Checkbox variant='add' checked={!!addSelectedItems[index]} onChange={() => { }} />
                        <span className='capitalize'>{item.nome} + <strong>R$ {item.valor.toFixed(2)}</strong></span>
                    </div>
                ))}
            </div>

            <div className='p-4 leading-3'>
                <h2 className="uppercase text-xl font-bold">observação</h2>
                <span className='text-[12px]'>Utilize somente para observações.</span>
            </div>

            <div className='bg-white p-4 flex flex-col gap-5'>
                <Textarea
                    placeholder="Digite sua mensagem aqui."
                    rows={4}
                />
            </div>

            <ModalSubstituir
                open={openModal}
                onClose={() => setOpenModal(false)}
                product={removeItem}
            />
        </motion.main>
    )
}