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

import { IngredientesDTO, ProdutosDTO } from '@/dto/productDTO'
import { api } from '@/service/api'
import { useMutation, useQuery } from '@tanstack/react-query'

import { AxiosError } from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { FaMinusCircle } from 'react-icons/fa'
import { FaCirclePlus, FaCircleQuestion, FaClipboardQuestion } from 'react-icons/fa6'
import { HiViewGridAdd } from "react-icons/hi"
import { MdArrowRightAlt, MdAssignmentAdd } from "react-icons/md"

import ImageUploadField from '@/components/ImageUploader'
import CurrencyField from '@/components/ui/current'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import z from 'zod'


type Props = {
    category: { id: string; name: string; };
}
const Products = ({ category }: Props) => {
    const [step, setStep] = React.useState(1)
    const [product, setProduct] = useState<ProdutosDTO>({} as ProdutosDTO)

    // function handleNextStep(event: React.MouseEvent<HTMLButtonElement>, direction: 'next' | 'prev') {
    //     event.preventDefault()
    //     if (direction === 'next') {
    //         setStep((prevStep) => prevStep + 1)
    //     } else {
    //         setStep((prevStep) => prevStep - 1)
    //     }
    // }
    return (
        <section className="rounded-lg p-6  m-2 dark:bg-[#1d1d1d] dark:border dark:border-stone-500 dark:border-dashed ">
            <div className="w-full">
                <MultiStep size={3} currentStep={step} />
            </div>
            <div className="flex flex-col justify-between">
                <AnimatePresence mode='popLayout'>
                    {step == 1 &&
                        <motion.div
                            initial={{ opacity: 0, x: 25, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 25, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, }}>
                            <Step1
                                setStep={setStep}
                                category={category}
                                setProduct={setProduct}
                            />
                        </motion.div>}
                </AnimatePresence>

                <AnimatePresence mode='popLayout'>
                    {step == 2 &&
                        <motion.div
                            initial={{ opacity: 0, x: 25, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 25, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, }}>
                            <Step2
                                product={product}
                            />
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

                {/* <div className='flex justify-end pt-6'>
                    {step > 1 &&
                        <Button
                            onClick={(event) => handleNextStep(event, 'prev')}
                            className="flex items-center gap-1 text-sm mr-1"
                            variant={'outline'}>
                            <MdArrowRightAlt className='rotate-180' size={20} />
                            Voltar
                        </Button>}
                    <Button
                        type='submit'
                        onClick={(event) => handleNextStep(event, 'next')}
                        className="flex items-center gap-1 text-sm"
                        variant={'outline'}>
                        {step === 3 ? 'Finalizar' : 'Próximo'}
                        {step === 3 ? <MdSaveAlt size={20} /> : <MdArrowRightAlt size={20} />}
                    </Button>
                </div> */}
            </div>
        </section>
    )
}




const currencyStringToNumber = (val: string) => {
    if (!val) return 0;
    // Remove o prefixo 'R$ ', espaços, pontos e outros caracteres não numéricos
    const numericValue = val.replace(/[^\d,]/g, '').replace(',', '.');
    const parsedValue = parseFloat(numericValue);
    return isNaN(parsedValue) ? 0 : parsedValue;
};
const MAX_SIZE = 1024 * 1024 * 2; // 2MB
const schemaStep1 = z.object({
    titulo: z.string().min(1, 'Por favor, forneça um nome para este produto.'),
    descricao: z.string().min(1, 'Por favor, forneça uma descrição para este produto.'),
    valor: z
        .string({ message: 'Por favor, forneça o valor deste produto.' })
        .min(1, 'Por favor, forneça o valor deste produto.')
        .transform(currencyStringToNumber)
        .refine((val) => !isNaN(val), {
            message: 'Por favor, forneça um valor numérico válido.',
        }),
    valorPromocional: z
        .string({ message: 'Por favor, forneça o valor promocional deste produto.' })
        .min(1, 'Por favor, forneça o valor promocional deste produto.')
        .transform(currencyStringToNumber)
        .refine((val) => !isNaN(val), {
            message: 'Por favor, forneça um valor numérico válido.',
        }),
    limitItens: z.string().min(1, 'Por favor, forneça o limite de itens adicionais.').refine((val) => !isNaN(Number(val)), {
        message: 'Por favor, forneça um valor numérico válido.',
    }),
    servingSize: z.string().min(1, 'Por favor, forneça a quantidade de pessoas que este produto serve.').refine((val) => !isNaN(Number(val)), {
        message: 'Por favor, forneça um valor numérico válido.',
    }),
    imgs: z.array(z.instanceof(File))
        .min(1, { message: "Por favor, insira pelo menos uma imagem." })
        .refine(files => files.every(file => file.size <= MAX_SIZE), { message: "Cada imagem deve ter no máximo 5MB." })
        .refine(files => files.every(file => ['image/jpeg', 'image/png'].includes(file.type)), { message: "Formato de imagem inválido. Apenas JPEG e PNG são permitidos." })
});
type Step1Form = z.infer<typeof schemaStep1>
type Step1Props = {
    setStep: React.Dispatch<React.SetStateAction<number>>
    category: { id: string; name: string; };
    setProduct: React.Dispatch<React.SetStateAction<ProdutosDTO>>
}
const Step1 = ({ setStep, category, setProduct }: Step1Props) => {
    const methods = useForm<Step1Form>({
        resolver: zodResolver(schemaStep1),
    });
    const { register, handleSubmit, formState: { errors } } = methods;

    const { mutateAsync: handleAddProduct, isPending } = useMutation({
        mutationKey: ['create-product'],
        mutationFn: async ({ descricao, imgs, limitItens, servingSize, titulo, valor, valorPromocional }: Step1Form) => {
            const formData = new FormData();
            formData.append('descricao', descricao);
            formData.append('limitItens', String(limitItens));
            formData.append('servingSize', String(servingSize));
            formData.append('titulo', titulo);
            formData.append('valor', String(valor));
            formData.append('valorPromocional', String(valorPromocional));
            formData.append('categoriaId', category.id);
            imgs.forEach((img) => formData.append('imgs', img));
            const { data } = await api.post('/produto/cadastrar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return data
        }, onSuccess(data) {
            console.log(data)
            setStep((prevStep) => prevStep + 1)
            setProduct(data)
        }, onError(error: unknown) {
            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)

            } else {
                toast.error('Erro inesperado, tenta novamente mais tarde.')
            }
        },
    })

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit((data) => handleAddProduct(data))} className='space-y-2'>
                <h1 className=" text-3xl text-muted font-semibold uppercase py-8 flex items-center gap-1">
                    <HiViewGridAdd size={40} />
                    Adicionar Produto {'>'} {category.name}
                </h1>
                <div className=" grid grid-cols-2 gap-2">
                    <Input
                        type="text"
                        label='Nome'
                        questionContent="Nome do produto que será exibido no cardápio."
                        {...register('titulo')}
                        error={errors.titulo?.message}
                    />
                    <Input
                        type="number"
                        label="Limite de Adicionais"
                        questionContent="Este campo indica a quantidade máxima de adicionais que o cliente pode adicionar ao produto."
                        {...register('limitItens')}
                        error={errors.limitItens?.message}
                    />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <CurrencyField
                        name="valor"
                        label="Preço"
                        questionContent="Este campo indica o preço do produto que será exibido no cardápio."
                        error={errors.valor?.message}
                    />
                    <CurrencyField
                        name="valorPromocional"
                        label='Preço Promocional'
                        questionContent='Este campo indica o preço promocional do produto que será exibido no cardápio.'
                        error={errors.valorPromocional?.message}
                    />
                    <Input
                        type="number"
                        label="Tamanho da Porção"
                        questionContent='Este campo indica o tamanho da porção do produto que será exibido no cardápio. EX: serve 2 pessoas.'
                        {...register('servingSize')}
                        error={errors.servingSize?.message}
                    />
                </div>

                <ImageUploadField
                    name="imgs"
                    label="Imagem"
                    questionContent="Este campo indica a imagem do produto que será exibido no cardápio."
                    error={errors.imgs?.message}
                />

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
                    <Textarea
                        cols={20}
                        rows={8}
                        {...register('descricao')}
                        error={errors.descricao?.message}
                    />
                </div>

                <div className='flex justify-end pt-6'>
                    <Button
                        loading={isPending}
                        type='submit'
                        // onClick={(event) => handleNextStep(event, 'next')}
                        className="flex items-center gap-1 text-sm"
                        variant={'outline'}>
                        Próximo
                        <MdArrowRightAlt size={20} />
                    </Button>
                </div>
            </form>
        </FormProvider>
    )
}

type Step2Props = {
    product: ProdutosDTO
}
const Step2 = ({ product }: Step2Props) => {
    const [selectedIngredients, setSelectedIngredients] = useState<Record<number, { quantia: number; removivel: boolean }>>({});

    const { data: ingredientes } = useQuery({
        queryKey: ['list-ingredientes'],
        queryFn: async () => {
            try {
                const { data } = await api.get<IngredientesDTO[]>('/ingredientes')
                console.log("caiu aqui", data)
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

    function handleToggle(ingredienteId: number) {
        setSelectedIngredients(prev => {
            if (prev[ingredienteId]) {
                // Se já estiver selecionado, removemos
                const newState = { ...prev };
                delete newState[ingredienteId];
                return newState;
            } else {
                // Se não estiver selecionado, adicionamos com valores padrão
                return {
                    ...prev,
                    [ingredienteId]: {
                        quantia: 1,
                        removivel: true
                    }
                };
            }
        });
    }


    function handleIncrement(ingredienteId: number, e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation();
        e.preventDefault();
        setSelectedIngredients(prev => {
            if (prev[ingredienteId]) {
                return {
                    ...prev,
                    [ingredienteId]: {
                        ...prev[ingredienteId],
                        quantia: prev[ingredienteId].quantia + 1
                    }
                };
            }
            return prev;
        });
    }

    function handleDecrement(ingredienteId: number, e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation();
        e.preventDefault();
        setSelectedIngredients(prev => {
            if (prev[ingredienteId] && prev[ingredienteId].quantia > 1) {
                return {
                    ...prev,
                    [ingredienteId]: {
                        ...prev[ingredienteId],
                        quantia: prev[ingredienteId].quantia - 1
                    }
                };
            }
            return prev;
        });
    }


    function handleToggleRemovivel(ingredienteId: number) {
        setSelectedIngredients(prev => {
            if (prev[ingredienteId]) {
                return {
                    ...prev,
                    [ingredienteId]: {
                        ...prev[ingredienteId],
                        removivel: !prev[ingredienteId].removivel
                    }
                };
            }
            return prev;
        });
    }



    // const { mutateAsync: handleAddIngredientToProduct } = useMutation({
    //     mutationKey: ['add-ingredient-to-product'],
    //     mutationFn: async () => {
    //         console.log('aqui')
    //         const { data } = await api.post('/produto/cadastrar', [
    //             {
    //                 produtoId: product.id,
    //                 ingredienteId: 3,
    //                 quantia: 1,
    //                 removivel: true
    //             }
    //         ])
    //         return data;
    //     }
    // })


    return (
        <form className='space-y-2'>
            <h1 className=" text-3xl text-muted font-semibold uppercase  py-8 flex items-center gap-1">
                <FaClipboardQuestion size={40} />
                Vincular Ingrediente {'>'} {product?.titulo}
            </h1>
            <span className="text-xs text-muted">Selecione os ingredientes que deseja vincular ao seu produto. Esses ingredientes serão utilizados para cadastrar os adicionais.</span>

            {ingredientes?.map((item) => {
                const igredientID = parseInt(item.id)
                return (
                    <div key={item.id} className={`flex items-center justify-between w-full px-4 py-1 rounded-md dark:bg-dark-500`}>
                        <div
                            className={`flex items-center gap-2 text-sm cursor-pointer ${selectedIngredients[igredientID] ? 'text-white' : 'text-muted'}`}
                            onClick={() => handleToggle(igredientID)}>
                            {/* <Checkbox
                                checked={!!selectedIngredients[igredientID]}
                                onCheckedChange={() => handleToggle(igredientID)}
                            /> */}

                            <input
                                className="peer h-6 w-6 shrink-0 rounded-sm checked:bg-red-600 border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 "
                                type="checkbox"
                                checked={selectedIngredients[igredientID]?.removivel || false}
                                onChange={() => handleToggle(igredientID)}
                            />
                            <div className="flex flex-col ">
                                <span className='capitalize'>{item.nome} </span>
                                <p className="text-xs">R$ {item?.valor.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 ">
                            <div className="flex flex-col ">
                                <Label className={`text-muted text-xs flex items-center gap-1 ${!selectedIngredients[igredientID] && 'opacity-50'}`}>
                                    Removivel?
                                    <FaCircleQuestion
                                        className="text-muted hover:text-white cursor-pointer"
                                        data-tooltip-id="removivel-tooltip"
                                        data-tooltip-content="Este campo indica se o ingrediente pode ser removido do produto."
                                    />
                                    <Tooltip id="removivel-tooltip" />
                                </Label>
                                <Switch
                                    disabled={!selectedIngredients[igredientID]}
                                    checked={selectedIngredients[igredientID]?.removivel || false}
                                    onCheckedChange={() => handleToggleRemovivel(igredientID)}
                                />
                            </div>

                            <div className="flex flex-col">
                                <Label className={`text-muted text-xs flex items-center gap-1 ${!selectedIngredients[igredientID] && 'opacity-50'}`}>
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
                                        disabled={!selectedIngredients[igredientID] || selectedIngredients[igredientID].quantia <= 1}
                                        className='disabled:cursor-not-allowed disabled:opacity-30'
                                        onClick={(e) => handleDecrement(igredientID, e)}>
                                        <FaMinusCircle
                                            className="dark:text-white-off text-dark-900"
                                            size={18}
                                        />
                                    </button>
                                    <div className={`text-2xl font-bold -mt-1 w-8 flex justify-center items-center ${!selectedIngredients[igredientID] && 'opacity-50'}`}>
                                        {selectedIngredients[igredientID]?.quantia || 1}
                                    </div>
                                    <button
                                        disabled={!selectedIngredients[igredientID]}
                                        className='disabled:cursor-not-allowed disabled:opacity-30'
                                        onClick={(e) => handleIncrement(igredientID, e)}>
                                        <FaCirclePlus
                                            className="dark:text-white-off text-dark-900"
                                            size={18}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}

            <div className='flex justify-end pt-6'>
                <Button
                    // onClick={(event) => handleNextStep(event, 'prev')}
                    className="flex items-center gap-1 text-sm mr-1"
                    variant={'outline'}>
                    <MdArrowRightAlt className='rotate-180' size={20} />
                    Voltar
                </Button>
                <Button
                    type='submit'
                    // onClick={(event) => handleNextStep(event, 'next')}
                    className="flex items-center gap-1 text-sm"
                    variant={'outline'}>
                    Próximo
                    <MdArrowRightAlt size={20} />
                </Button>
            </div>
        </form>
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
                                <span className='capitalize'>{item.nome} </span>
                                <p className="text-xs">R$ {item?.valor.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Products;