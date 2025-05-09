'use client'
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';


import { ModalSubstituir } from '@/components/Modal/Substituir';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

import { FaMinusCircle } from 'react-icons/fa';
import { FaCirclePlus, FaPeopleGroup } from 'react-icons/fa6';

import { AdicionaisDTO, IngredientesDTO, ProdutosDTO } from '@/dto/productDTO';
import useCart from '@/hook/useCart';
import { api } from "@/service/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from 'axios';

type Props = {
    params: { productID: string }
}
export default function ProductorDetails({ params }: Props) {
    const [removeSelectedItems, setRemoveSelectedItems] = React.useState<Record<number, boolean>>({});
    const [addSelectedItems, setAddSelectedItems] = useState<Record<number, boolean>>({});

    const [removeItem, setRemoveItem] = useState<IngredientesDTO>({} as IngredientesDTO);
    const [openModal, setOpenModal] = useState(false);

    const [countProduct, setCountProduct] = useState<number>(1);
    const [showMenu, setShowMenu] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);

    const [itemValueUnit, setItemValueUnit] = useState(0); //valor de cada unidade do produto
    const [itemValueFinish, setItemValueFinish] = useState(0); // valor final do produto
    const [desconto, setDesconto] = useState<number>(0);
    const [obs, setObs] = useState<string>('');
    const router = useRouter();
    const { handleUpdateCart } = useCart();


    function handleRemove(index: number) {
        setRemoveSelectedItems(prev => {
            const isCurrentlySelected = prev[index];
            const newState = { ...prev, [index]: !isCurrentlySelected };
            if (!isCurrentlySelected) {
                setOpenModal(true);
            }
            return newState;
        });
    };

    function handleAdicional(item: AdicionaisDTO) {
        const adicionalID = parseInt(item.id)
        let checked
        setAddSelectedItems(prev => {
            checked = prev[adicionalID];
            return { ...prev, [adicionalID]: !prev[adicionalID] }
        });
        const valorTotal = item.valor * countProduct;
        if (checked) {
            setItemValueUnit(prev => prev - item.valor)
            setItemValueFinish(prev => prev - valorTotal)
        } else {
            setItemValueUnit(prev => prev + item.valor)
            setItemValueFinish(prev => prev + valorTotal)
        }
    }

    function handleIncrement() {
        setItemValueFinish(prev => prev + itemValueUnit)
        setCountProduct(prevState => prevState + 1)
    }

    function handleDecrement() {
        setItemValueFinish(prev => prev - itemValueUnit)
        setCountProduct(prevState => countProduct >= 2 ? prevState - 1 : prevState)
    }


    const { data: productDetails, } = useQuery({
        queryKey: ['product-details', params.productID],
        queryFn: async () => {
            try {
                const { data } = await api.get<ProdutosDTO>(`/produto/${params.productID}`)
                console.log('ProdutosDTO', data);
                return data
            } catch (error: unknown) {
                console.log(error)
                if (error instanceof AxiosError && error.response) {
                    toast.error(error.response.data.message)
                } else {
                    toast.error('An unexpected error occurred')
                }
            }
        },
        staleTime: Infinity, // Para garantir que o cache não seja sobrescrito automaticamente
    });

    const { mutateAsync: handleAddItem, isPending } = useMutation({
        mutationKey: ['add-product'],
        mutationFn: async () => {
            const ingredientesIds = productDetails?.ingredientes
                .filter(item => item.removivel !== false)
                .map(item => {
                    const isRemoved = removeSelectedItems[productDetails.ingredientes.indexOf(item)];
                    return isRemoved && item.replace ? item.replace.id : item.id;
                });

            const adicionaisIds = Object.keys(addSelectedItems)
                .filter(key => addSelectedItems[parseInt(key)])
                .map(key => parseInt(key));

            const { data } = await api.post('/pedido/carrinho', {
                produtoId: parseInt(params.productID),
                ingredientes: ingredientesIds,
                adicionais: adicionaisIds,
                obs: obs,
                quantidade: countProduct
            });
            return data;
        },
        onSuccess(data) {
            console.log(data);
            handleUpdateCart()
            router.push('/');
        },
        onError(error: unknown) {
            console.log(error)
            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Erro inesperado, tente novamente mais tarde.')
            }
        },
    });


    const controlMenu = useCallback(() => {
        if (typeof window !== 'undefined') {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
                // If the user has reached the bottom of the page, show the menu
                setShowMenu(true);
            } else if (window.scrollY > lastScrollY) {
                // If the user is scrolling down, hide the menu
                setShowMenu(false);
            } else {
                // If the user is scrolling up, show the menu
                setShowMenu(true);
            }
            setLastScrollY(window.scrollY); // Remember current page location to use in the next move
        }
    }, [setShowMenu, setLastScrollY, lastScrollY]);

    useEffect(() => {
        if (!productDetails) return
        const value = parseInt(productDetails?.valor)
        const discountPercentage = ((value - productDetails?.valorPromocional) / value) * 100;
        setDesconto(discountPercentage)
        console.log('productDetails atualizado', productDetails);
        const valueItem = parseInt(productDetails.valor)
        setItemValueUnit(valueItem)
        setItemValueFinish(valueItem)
    }, [productDetails]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', controlMenu);
            // cleanup function
            return () => {
                window.removeEventListener('scroll', controlMenu);
            };
        }
    }, [lastScrollY, controlMenu]);
    return (
        <div className='relative'>
            <motion.main
                className="mt-14 overflow-x-hidden mb-20"
                initial={{ opacity: 0, y: 100, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>
                <div className='bg-white p-4'>
                    <div className='relative'>
                        <div className=' bg-stone-200 blur-sm rounded-md absolute top-0 bottom-0 right-0 left-0 ' />
                        <div className="relative">
                            {productDetails && productDetails?.valorPromocional > 0 &&
                                <div className="absolute -top-1 right-0 text-white bg-red-600 px-2 py-1 transform translate-x-1/2">
                                    <span className="font-bold mr-14 ml-2 ">-{desconto?.toFixed(2)}%</span>
                                    <div className="absolute top-0 left-3 h-full w-6  bg-red-600 -translate-x-full skew-x-[30deg] z-10" />
                                </div>
                            }

                            {/* {productDetails && productDetails?.imgs?.length == 0 && 'Nenhuma imagem cadastrada.'} */}
                            {/* {productDetails && productDetails.imgs.map((img) => (
                                <Image
                                    key={img.Key}
                                    priority
                                    width={500}
                                    height={500}
                                    className="rounded-lg object-cover object-center lg:max-h-none"
                                    alt={productDetails?.titulo || 'Produto'}
                                    src={img.Location}
                                />
                            ))} */}

                            {productDetails &&
                                <Image
                                    priority
                                    width={500}
                                    height={500}
                                    className="rounded-lg object-cover object-center lg:max-h-none"
                                    alt={productDetails?.titulo || 'Produto'}
                                    src={productDetails?.imgs[0]?.Location}
                                />
                            }
                        </div>
                    </div>

                    <h1 className="uppercase font-semibold my-1">{productDetails?.titulo}</h1>
                    <p className="text-xs">{productDetails?.descricao}</p>
                    <span className='uppercase font-semibold text-sm flex items-center gap-1 text-muted mt-2'>
                        <FaPeopleGroup size={20} />
                        serve até: {productDetails?.servingSize} {productDetails && productDetails?.servingSize > 1 ? 'pessoas' : 'pessoa'}
                    </span>
                </div>
                {/* REMOVER/SUBISTITUIR INGREDIENTE */}
                <div className='p-4 leading-3 -mt-3'>
                    <h2 className="uppercase text-xl font-bold">deseja remover algo?</h2>
                    <span className='text-xs'>Selecione os itens que você <strong>NÃO</strong> quer no seu produto.</span>
                </div>
                <div className='bg-white p-4 flex flex-col gap-5'>
                    {productDetails?.ingredientes.filter(item => item.removivel !== false).map((item, index) => (
                        <div key={index} className="flex flex-col gap-2 text-sm duration-300">
                            <div className={`flex items-center gap-2 ${removeSelectedItems[index] && 'line-through text-red-700'}`} onClick={() => { handleRemove(index); setRemoveItem(item) }}>
                                <Checkbox variant='remove' checked={!!removeSelectedItems[index]} onChange={() => { }} />
                                <span className='capitalize'>Remover {item.nome}</span>
                            </div>
                            <AnimatePresence>
                                {removeSelectedItems[index] && item.replace && (
                                    <motion.div
                                        className="ml-6"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}>
                                        <p className="text-sm text-gray-500">Substituído por:</p>
                                        <ul className="list-disc list-inside">
                                            <li className="text-sm text-blue-500 capitalize">{item?.replace?.nome}</li>
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* ADICIONAIS */}
                <div className='p-4 leading-3 relative'>
                    <h2 className="uppercase text-xl font-bold">adicionais</h2>
                    <span className='text-xs'>Que tal turbinar seu pedido?</span>
                    <div className='absolute top-18 right-3 bg-gray-400 text-white rounded-xl p-1 font-semibold text-sm'>
                        Selecione até {productDetails?.limitItens} itens
                    </div>
                </div>
                <div className='bg-white p-4 flex flex-col gap-5'>
                    {productDetails?.adicionais?.map((item) => {
                        const adicionalID = parseInt(item.id)
                        return (
                            <div key={adicionalID} className={`flex items-center gap-2 text-sm ${addSelectedItems[adicionalID] && 'text-emerald-600'}`} onClick={() => handleAdicional(item)}>
                                <Checkbox variant='add' checked={!!addSelectedItems[adicionalID]} />
                                <span className='capitalize'>{item.nome} + <strong>R$ {item.valor.toFixed(2)}</strong></span>
                            </div>
                        )
                    })}
                </div>
                <div className='p-4 leading-3'>
                    <h2 className="uppercase text-xl font-bold">observação</h2>
                    <span className='text-xs'>Utilize somente para observações.</span>
                </div>
                <div className='bg-white p-4 flex flex-col gap-5'>
                    <Textarea
                        placeholder="Digite sua mensagem aqui."
                        rows={4}
                        value={obs}
                        onChange={(e) => setObs(e.target.value)}
                    />
                </div>
                {productDetails && (
                    <ModalSubstituir
                        open={openModal}
                        onClose={() => setOpenModal(false)}
                        removeProduct={removeItem}
                        productDetails={productDetails}
                        itemValueFinish={itemValueFinish}
                    />
                )}
            </motion.main>
            <AnimatePresence>
                {showMenu &&
                    <motion.div
                        className='fixed bottom-0 left-0 right-0 bg-white p-2 flex justify-between items-center border'
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        transition={{ duration: 0.5 }}>
                        <div className='flex justify-center items-center w-32 '>
                            <button
                                className='disabled:opacity-50 disabled:cursor-not-allowed duration-300'
                                disabled={countProduct <= 1}
                                onClick={handleDecrement}>
                                <FaMinusCircle size={30} />
                            </button>
                            <div className=' text-4xl font-bold -mt-1 w-12 flex justify-center items-center '>{countProduct}</div>
                            <button onClick={handleIncrement}>
                                <FaCirclePlus size={30} />
                            </button>
                        </div>
                        <Button
                            loading={isPending}
                            variant={'success'}
                            className='ml-3 w-full flex justify-between p-2 text-lg h-12'
                            onClick={() => handleAddItem()}>
                            <span className='ml-3'>Adicionar</span>
                            <div className='bg-white text-primary p-1 rounded-lg text-base font-bold'>
                                R$ {itemValueFinish.toFixed(2)}
                            </div>
                        </Button>
                    </motion.div>
                }
            </AnimatePresence>
        </div>
    )
}