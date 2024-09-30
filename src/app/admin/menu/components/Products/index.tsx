'use client'
import React, { useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { toast } from 'sonner'

import MultiStep from '@/components/MultiStep'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { IngredientesDTO } from '@/dto/productDTO'
import { api } from '@/service/api'
import { useQuery } from '@tanstack/react-query'

import { AxiosError } from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { FaMinusCircle } from 'react-icons/fa'
import { FaCirclePlus, FaCircleQuestion, FaClipboardQuestion } from 'react-icons/fa6'
import { HiViewGridAdd } from "react-icons/hi"
import { MdArrowRightAlt, MdAssignmentAdd, MdSaveAlt } from "react-icons/md"

const Products = () => {
    const [step, setStep] = React.useState(1)

    function handleNextStep(event: React.MouseEvent<HTMLButtonElement>, direction: 'next' | 'prev') {
        event.preventDefault()
        if (direction === 'next') {
            setStep((prevStep) => prevStep + 1)
        } else {
            setStep((prevStep) => prevStep - 1)
        }
    }
    return (
        <section className="rounded-lg p-6  m-2 dark:bg-[#1d1d1d] dark:border dark:border-stone-500 dark:border-dashed ">
            <div className="w-full">
                <MultiStep size={3} currentStep={step} />
            </div>
            <form className="flex flex-col justify-between">
                <AnimatePresence mode='popLayout'>
                    {step == 1 &&
                        <motion.div
                            initial={{ opacity: 0, x: 25, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 25, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, }}>
                            <Step1 />
                        </motion.div>}
                </AnimatePresence>

                <AnimatePresence mode='popLayout'>
                    {step == 2 &&
                        <motion.div
                            initial={{ opacity: 0, x: 25, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 25, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, }}>
                            <Step2 />
                        </motion.div>}
                </AnimatePresence>

                <AnimatePresence mode='popLayout'>
                    {step == 3 &&
                        <motion.div
                            initial={{ opacity: 0, x: 25, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 25, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, }}>
                            <Step3 />
                        </motion.div>}
                </AnimatePresence>

                <div className='flex justify-end pt-6'>
                    {step > 1 &&
                        <Button
                            onClick={(event) => handleNextStep(event, 'prev')}
                            className="flex items-center gap-1 text-sm mr-1"
                            variant={'outline'}>
                            <MdArrowRightAlt className='rotate-180' size={20} />
                            Voltar
                        </Button>}
                    <Button
                        onClick={(event) => handleNextStep(event, 'next')}
                        className="flex items-center gap-1 text-sm"
                        variant={'outline'}>
                        {step === 3 ? 'Finalizar' : 'Próximo'}
                        {step === 3 ? <MdSaveAlt size={20} /> : <MdArrowRightAlt size={20} />}
                    </Button>
                </div>
            </form>
        </section>
    )
}

const Step1 = () => {
    return (
        <div className='space-y-2'>
            <h1 className=" text-3xl text-muted font-semibold uppercase py-8 flex items-center gap-1">
                <HiViewGridAdd size={40} />
                Adicionar Produto
            </h1>
            <div className=" grid grid-cols-2 gap-2">
                <Input
                    type="text"
                    label='Nome'
                    questionContent="Nome do produto que será exibido no cardápio."
                />
                <div className=" ">
                    <Input
                        type="number"
                        label="Limite de Adicionais"
                        questionContent="Este campo indica a quantidade máxima de adicionais que o cliente pode adicionar ao produto."
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className=" ">
                    <Input
                        type="text"
                        label='Preço'
                        questionContent='Este campo indica o preço do produto que será exibido no cardápio.'
                    />
                </div>
                <div className=" ">
                    <Input
                        type="text"
                        label='Preço Promocional'
                        questionContent='Este campo indica o preço promocional do produto que será exibido no cardápio.'
                    />
                </div>
                <div className=" ">
                    <Input
                        type="number"
                        label="Tamanho da Porção"
                        questionContent='Este campo indica o tamanho da porção do produto que será exibido no cardápio. EX: serve 2 pessoas.'
                    />
                </div>
            </div>
            <div className="">
                <Input
                    type="file"
                    label="Imagem"
                    questionContent='Este campo indica a imagem do produto que será exibido no cardápio.'
                />
            </div>

            <div className="flex flex-col ">
                <Label className='text-xs text-muted flex items-center gap-2'>
                    Descrição
                    <FaCircleQuestion
                        className="text-muted hover:text-white cursor-pointer"
                        data-tooltip-id="descricao-tooltip"
                        data-tooltip-content="Este campo indica a descrição do produto que será exibido no cardápio."
                    />
                    <Tooltip id="descricao-tooltip" />
                </Label>
                <Textarea name="description" id="description" cols={20} rows={8}></Textarea>
            </div>
        </div>
    )
}


const Step2 = () => {
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [addSelectedItems, setAddSelectedItems] = useState<Record<number, boolean>>({});

    const { data: ingredientes } = useQuery({
        queryKey: ['list-ingredientes'],
        queryFn: async () => {
            try {
                const { data } = await api.get<IngredientesDTO[]>('/ingredientes')
                return data
            } catch (error: unknown) {
                if (error instanceof AxiosError && error.response) {
                    toast.error(error.response.data.message)

                } else {
                    toast.error('An unexpected error occurred')
                }
            }
        },
    });

    function handleToggle(index: number) {
        setAddSelectedItems(prev => ({ ...prev, [index]: !prev[index] }))
    }

    function handleIncrement(index: number, e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation();
        e.preventDefault();
        setQuantities(prev => ({ ...prev, [index]: (prev[index] || 1) + 1 }));
    }

    function handleDecrement(index: number, e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation();
        e.preventDefault();
        setQuantities(prev => ({ ...prev, [index]: (prev[index] || 1) > 1 ? prev[index] - 1 : 1 }));
    }


    return (
        <div className='space-y-2'>
            <h1 className=" text-3xl text-muted font-semibold uppercase  py-8 flex items-center gap-1">
                <FaClipboardQuestion size={40} />
                Vincular Ingrediente
            </h1>
            <span className="text-xs text-muted">Selecione os ingredientes que deseja vincular ao seu produto. Esses ingredientes serão utilizados para cadastrar os adicionais.</span>

            {ingredientes?.map((item, index) => (
                <div key={`${index}-${addSelectedItems[index]}`} className={`flex items-center justify-between w-full px-4 py-1 rounded-md dark:bg-dark-500`}>
                    <div className={`flex items-center gap-2 text-sm cursor-pointer ${addSelectedItems[index] ? 'text-white' : 'text-muted'}`}
                        onClick={() => handleToggle(index)}>
                        <Checkbox
                            checked={!!addSelectedItems[index]}
                            onChange={() => { }}
                            onClick={() => handleToggle(index)} />
                        <div className="flex flex-col ">
                            <span className='capitalize'>{item.nomeIngrediente} </span>
                            <p className="text-xs">R$ {item?.valorIngrediente?.toFixed(2)}</p>
                        </div>
                    </div>


                    <div className="flex items-center gap-6 ">
                        <div className="flex flex-col ">
                            <Label className={`text-muted text-xs flex items-center gap-1 ${!addSelectedItems[index] && 'opacity-50'}`}>
                                Removivel?
                                <FaCircleQuestion
                                    className="text-muted hover:text-white cursor-pointer"
                                    data-tooltip-id="removivel-tooltip"
                                    data-tooltip-content="Este campo indica se o ingrediente pode ser removido do produto."
                                />
                                <Tooltip id="removivel-tooltip" />
                            </Label>
                            <Switch disabled={!addSelectedItems[index]} />
                        </div>

                        <div className="flex flex-col">
                            <Label className={`text-muted text-xs flex items-center gap-1 ${!addSelectedItems[index] && 'opacity-50'}`}>
                                Quantia
                                <FaCircleQuestion
                                    className="text-muted hover:text-white cursor-pointer"
                                    data-tooltip-id="quantia-tooltip"
                                    data-tooltip-content="Este campo indica a quantidade do ingrediente em seu produto."
                                />
                                <Tooltip id="quantia-tooltip" />
                            </Label>
                            <div className='flex justify-center items-center '>
                                <button
                                    disabled={!addSelectedItems[index] || (quantities[index] || 1) <= 1}
                                    className='disabled:cursor-not-allowed disabled:opacity-30'
                                    onClick={(e) => handleDecrement(index, e)}>
                                    <FaMinusCircle
                                        className="dark:text-white-off text-dark-900"
                                        size={18}
                                    />
                                </button>
                                <div className={`text-2xl font-bold -mt-1 w-8 flex justify-center items-center ${!addSelectedItems[index] && 'opacity-50'}`}> {quantities[index] || 1}</div>
                                <button
                                    disabled={!addSelectedItems[index]}
                                    className='disabled:cursor-not-allowed disabled:opacity-30'
                                    onClick={(e) => handleIncrement(index, e)}>
                                    <FaCirclePlus
                                        className="dark:text-white-off text-dark-900"
                                        size={18}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

const Step3 = () => {
    const [addSelectedItems, setAddSelectedItems] = useState<Record<number, boolean>>({});
    const { data: ingredientes } = useQuery({
        queryKey: ['list-ingredientes'],
        queryFn: async () => {
            try {
                const { data } = await api.get<IngredientesDTO[]>('/ingredientes')
                return data
            } catch (error: unknown) {
                if (error instanceof AxiosError && error.response) {
                    toast.error(error.response.data.message)

                } else {
                    toast.error('An unexpected error occurred')
                }
            }
        },
    });

    function handleToggle(index: number) {
        setAddSelectedItems(prev => ({ ...prev, [index]: !prev[index] }))
    }

    return (
        <div className='space-y-2'>
            <h1 className=" text-3xl text-muted font-semibold uppercase  py-8 flex items-center gap-1">
                <MdAssignmentAdd size={40} />
                Cadastrar Adicionais
            </h1>
            <span className="text-xs text-muted">Selecione os ingredientes que deseja oferecer como adicionais.</span>
            <div className="grid grid-cols-2 gap-2">
                {ingredientes?.map((item, index) => (
                    <div key={`${index}-${addSelectedItems[index]}`} className={`flex items-center justify-between w-full px-4 py-1 rounded-md dark:bg-dark-500`}>
                        <div className={`flex items-center gap-2 text-sm cursor-pointer ${addSelectedItems[index] ? 'text-white' : 'text-muted'}`}
                            onClick={() => handleToggle(index)}>
                            <Checkbox
                                checked={!!addSelectedItems[index]}
                                onChange={() => { }}
                                onClick={() => handleToggle(index)} />
                            <div className="flex flex-col ">
                                <span className='capitalize'>{item.nomeIngrediente} </span>
                                <p className="text-xs">R$ {item?.valorIngrediente?.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Products;