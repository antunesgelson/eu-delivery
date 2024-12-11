'use client'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import React, { useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { toast } from 'sonner'

import ImageUploadField from '@/components/ImageUploader'
import MultiStep from '@/components/MultiStep'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import CurrencyField from '@/components/ui/current'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { ImgDTO } from '@/dto/imgDTO'
import { IngredientesDTO, ProdutosDTO } from '@/dto/productDTO'
import { api } from '@/service/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { FormProvider, useForm } from 'react-hook-form'
import z from 'zod'

import { FaMinusCircle } from 'react-icons/fa'
import { FaCirclePlus, FaCircleQuestion, FaClipboardQuestion } from 'react-icons/fa6'
import { HiViewGridAdd } from "react-icons/hi"
import { IoMdCloseCircle } from 'react-icons/io'
import { MdArrowRightAlt, MdAssignmentAdd, MdSaveAlt } from "react-icons/md"

type Props = {
    productID: number
    setMenu: React.Dispatch<React.SetStateAction<string>>;
    category: { id: string; name: string; };

}
const EditProduct = ({ productID, setMenu, category }: Props) => {
    const [step, setStep] = React.useState(1)
    const [product, setProduct] = useState<ProdutosDTO>({} as ProdutosDTO)

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
                                productID={productID}
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
                                setStep={setStep}
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
                            <Step3
                                setStep={setStep}
                                product={product}
                                setMenu={setMenu}
                            />
                        </motion.div>}
                </AnimatePresence>
            </div>
        </section>
    )
}

{/* Cadastrar Produto na Categoria Selecionada */ }
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
        .string()
        .min(1, 'Por favor, forneça o valor deste produto.')
        .refine((val) => !isNaN(currencyStringToNumber(val)), {
            message: 'Por favor, forneça um valor numérico válido.',
        }),
    valorPromocional: z
        .string()
        .min(1, 'Por favor, forneça o valor promocional deste produto.')
        .refine((val) => !isNaN(currencyStringToNumber(val)), {
            message: 'Por favor, forneça um valor numérico válido.',
        }),
    limitItens: z
        .string()
        .min(1, 'Por favor, forneça o limite de itens adicionais.')
        .refine((val) => !isNaN(Number(val)), {
            message: 'Por favor, forneça um valor numérico válido.',
        }),
    servingSize: z
        .string()
        .min(1, 'Por favor, forneça a quantidade de pessoas que este produto serve.')
        .refine((val) => !isNaN(Number(val)), {
            message: 'Por favor, forneça um valor numérico válido.',
        }),
    imgs: z
        .array(z.instanceof(File))
        .min(1, { message: 'Por favor, insira pelo menos uma imagem.' })
        .refine((files) => files.every((file) => file.size <= MAX_SIZE), {
            message: 'Cada imagem deve ter no máximo 2MB.',
        })
        .refine(
            (files) => files.every((file) => ['image/jpeg', 'image/png'].includes(file.type)),
            { message: 'Formato de imagem inválido. Apenas JPEG e PNG são permitidos.' }
        ),
});

type Step1Form = z.infer<typeof schemaStep1>
type Step1Props = {
    setStep: React.Dispatch<React.SetStateAction<number>>
    productID: number
    setProduct: React.Dispatch<React.SetStateAction<ProdutosDTO>>
    category: { id: string; name: string; };

}
const Step1 = ({ setStep, productID, setProduct, category }: Step1Props) => {
    const queryClient = useQueryClient();
    const methods = useForm<Step1Form>({
        resolver: zodResolver(schemaStep1),
    });
    const { register, handleSubmit, reset, setValue, formState: { errors } } = methods;

    function numberToCurrencyString(value: number): string {
        // Converte o número para o formato '40,00'
        return value?.toFixed(2).replace('.', ',');
    }

    const { data: product } = useQuery({
        queryKey: ['product-info', productID],
        queryFn: async () => {
            try {
                const { data } = await api.get<ProdutosDTO>(`/produto/${productID}`)
                return data
            } catch (error: unknown) {
                if (error instanceof AxiosError && error.response) {
                    toast.error(error.response.data.message)
                } else {
                    toast.error('Erro inesperado, tente novamente mais tarde.')
                }
            }
        },
    });
    const { mutateAsync: handleAddProduct, isPending } = useMutation({
        mutationKey: ['create-product'],
        mutationFn: async ({ descricao, imgs, limitItens, servingSize, titulo, valor, valorPromocional }: Step1Form) => {
            const formData = new FormData();

            formData.append('descricao', descricao);
            formData.append('limitItens', String(limitItens));
            formData.append('servingSize', String(servingSize));
            formData.append('titulo', titulo);
            formData.append('valor', String(valor.replaceAll('.','').replace(',','.')));
            formData.append('valorPromocional', String(valorPromocional.replaceAll('.','').replace(',','.')));
            formData.append('categoriaId', category.id);
            imgs.forEach((img) => formData.append('imgs', img));

            const { data } = await api.post('/produto/cadastrar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return data;

        }, onSuccess(data) {
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

    async function handleRemoveFoto(img: ImgDTO) {
        const removeImage = async () => {
            await api.delete(`/produto/${productID}/${img.ETag}`);
            queryClient.setQueryData<ProdutosDTO>(['product-info', productID], (oldData) => {
                if (oldData) {
                    return {
                        ...oldData,
                        imgs: oldData.imgs.filter((foto) => foto.ETag !== img.ETag),
                    };
                }
                return oldData;
            });
        };
        toast.promise(
            removeImage(),
            {
                loading: 'Removendo imagem...',
                success: 'Imagem removida com sucesso! 🎉',
                error: (error) => error?.message || 'Tente novamente mais tarde.',
            }
        );
    }

    React.useEffect(() => {
        if (!product) return;
        reset({
            titulo: product.titulo,
            limitItens: String(product.limitItens),
            valor: numberToCurrencyString(Number(product.valor)),
            valorPromocional: numberToCurrencyString(product.valorPromocional),
            servingSize: String(product.servingSize),
            descricao: product.descricao,
        });
    }, [product, reset, productID]);

    React.useEffect(() => {
        if (!product || !product.imgs) return;

        const fetchFilesFromUrls = async () => {
            const filePromises = product.imgs.map(async (img) => {
                const response = await fetch(img.Location);
                const blob = await response.blob();

                const fileName = img.Key.split('/').pop() || 'image.jpg';

                // Deduzir o tipo da imagem baseado na extensão do arquivo
                let type = '';
                if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
                    type = 'image/jpeg';
                } else if (fileName.endsWith('.png')) {
                    type = 'image/png';
                } else {
                    // Caso a extensão não seja suportada, você pode decidir o que fazer aqui.
                    // Por exemplo, simplesmente atribuir um tipo default ou não incluir o arquivo.
                    console.warn('Extensão de imagem não reconhecida:', fileName);
                    // Como fallback, você poderia tentar:
                    type = blob.type;
                }

                return new File([blob], fileName, { type });
            });

            const files = await Promise.all(filePromises);
            setValue('imgs', files);
        };

        fetchFilesFromUrls();
    }, [product, setValue]);


    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit((data) => handleAddProduct(data))} className='space-y-2'>
                <h1 className=" text-3xl text-muted font-semibold uppercase py-8 flex items-center gap-1">
                    <HiViewGridAdd size={40} />
                    Editar Produto {'>'} {product?.titulo}
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

                <div className=" grid grid-cols-4 gap-2">
                    {product?.imgs && product?.imgs.length > 0
                        ? <h3 className="col-span-4 text-xs text-muted ">Imagens:</h3>
                        : <span className="whitespace-nowrap text-muted-foreground text-sm text-center">Nenhuma imagem cadastrada.</span>}
                    {product?.imgs &&
                        product?.imgs.map((img, index: number) => (
                            <div className="relative w-full h-full  " key={index}>
                                <Image
                                    priority
                                    width={500}
                                    height={500}
                                    className="rounded-md  object-cover object-center h-28 2xl:h-[320px] lg:h-[220px] border-[5px] border-[#FFFFFF54]"
                                    alt={img.ETag}
                                    src={img?.Location}
                                />

                                <IoMdCloseCircle
                                    size={20}
                                    onClick={() => handleRemoveFoto(img)}
                                    className=" text-red-500 cursor-pointer hover:scale-150 duration-300 absolute top-1 right-1 bg-white border border-black rounded-full"
                                />
                            </div>
                        ))
                    }
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
                    <Textarea
                        cols={20}
                        rows={8}
                        {...register('descricao')}
                        error={errors.descricao?.message}
                    />
                </div>
                <div className='flex justify-end pt-6'>
                    <Button
                        type='submit'
                        variant={'outline'}
                        loading={isPending}
                        className="flex items-center gap-1 text-sm">
                        Próximo
                        <MdArrowRightAlt size={20} />
                    </Button>
                </div>
            </form>
        </FormProvider>
    )
}



{/* Vincular Ingrediente ao Produto */ }
type Step2Props = {
    product: ProdutosDTO
    setStep: React.Dispatch<React.SetStateAction<number>>
}

interface SelectedIngredient {
    quantia: number;
    removivel: boolean;
}
const Step2 = ({ product, setStep }: Step2Props) => {
    const [selectedIngredients, setSelectedIngredients] = useState<Record<number, SelectedIngredient>>({});


    const { data: ingredientes } = useQuery({
        queryKey: ['list-ingredientes'],
        queryFn: async () => {
            try {
                const { data } = await api.get<IngredientesDTO[]>('/ingredientes')
                console.log('list-ingredientes ->', data)
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



    const { mutateAsync: handleAddIngredientToProduct, isPending } = useMutation({
        mutationKey: ['add-ingredient-to-product'],
        mutationFn: async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault(); // Prevent the default form submission behavior
            e.stopPropagation(); // Prevent the event from bubbling up the DOM tree
            const payloadIngredientes = Object.entries(selectedIngredients).map(([key, value]) => {
                console.log('key ->', key)
                return ({
                    produtoId: product.id,
                    ingredienteId: Number(key),   // VERIFICAR ID DO INGREDIENTE ESTÀ ERRADO NA HORA DE SALVAR 
                    quantia: value.quantia,
                    removivel: value.removivel
                })
            })
            const { data } = await api.post('/produto/adicionar-ingredientes', payloadIngredientes)

            return data;
        }, onSuccess(data) {
            console.log('success ->', data)
            setStep((prevStep) => prevStep + 1)

        }, onError(error: unknown) {
            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)

            } else {
                toast.error('An unexpected error occurred')
            }
        }
    })


    const { data: productDetails, } = useQuery({
        queryKey: ['details', product.id],
        queryFn: async () => {
            try {
                const { data } = await api.get<ProdutosDTO>(`/produto/${product.id}`)
                console.log('data-details ->', data)
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
    });

    React.useEffect(() => {
        if (productDetails) {
            productDetails.ingredientes.forEach(item => {
                handleToggle(parseInt(item.id));
            });
        }
    }, [productDetails]);

    React.useEffect(() => {
        console.log('selectedIngredients ->', selectedIngredients)
    }, [selectedIngredients]);


    return (
        <form onSubmit={(e) => { handleAddIngredientToProduct(e) }} className='space-y-2'>
            <h1 className=" text-3xl text-muted font-semibold uppercase  py-8 flex items-center gap-1">
                <FaClipboardQuestion size={40} />
                Vincular Ingrediente {'>'} {product?.titulo}
            </h1>
            <span className="text-xs text-muted">Selecione os ingredientes que deseja vincular ao seu produto. Esses ingredientes serão utilizados para cadastrar os adicionais.</span>

            {ingredientes?.map((item) => {
                const igredientID = parseInt(item.id)
                return (
                    <div key={item.id} className={`flex items-center justify-between w-full px-4 py-1 rounded-md dark:bg-dark-500`}>
                        <div className={`flex items-center gap-2 text-sm cursor-pointer ${selectedIngredients[igredientID] ? 'text-white' : 'text-muted'}`}>
                            <Checkbox
                                checked={!!selectedIngredients[igredientID]}
                                onCheckedChange={() => handleToggle(igredientID)}
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
                    variant={'outline'}
                    className="flex items-center gap-1 text-sm mr-1"
                    onClick={() => setStep((prevStep) => prevStep - 1)}>
                    <MdArrowRightAlt className='rotate-180' size={20} />
                    Voltar
                </Button>
                <Button
                    type='submit'
                    variant={'outline'}
                    loading={isPending}
                    className="flex items-center gap-1 text-sm"
                    disabled={!Object.keys(selectedIngredients).length}>
                    Próximo
                    <MdArrowRightAlt size={20} />
                </Button>
            </div>
        </form>
    )
}

{/* Vincular Adicional ao Produto */ }
type Step3Props = {
    product: ProdutosDTO
    setStep: React.Dispatch<React.SetStateAction<number>>
    setMenu: React.Dispatch<React.SetStateAction<string>>
}
const Step3 = ({ setStep, product, setMenu }: Step3Props) => {
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
                    toast.error('Erro inesperado, tente novamente mais tarde.')
                }
            }
        },
    });

    function handleToggle(ingredientID: number) {
        setAddSelectedItems(prev => ({ ...prev, [ingredientID]: !prev[ingredientID] }))
    }


    const { mutateAsync: handleAddAdicionalToProduct, isPending } = useMutation({
        mutationKey: ['add-adicional-to-product'],
        mutationFn: async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            e.stopPropagation();
            const adicionalArray = Object.entries(addSelectedItems)
                .filter(([value]) => value) // Filtra apenas os itens que estão `true`
                .map(([key]) => ({
                    ingredienteId: Number(key),
                    produtoId: product.id
                }));
            const { data } = await api.post('/produto/adicional', adicionalArray)

            return data
        }, onSuccess(data) {
            console.log('success ->', data)
            toast.success('Produto cadastrado com sucesso!')
            setMenu('ingredients')
        }, onError(error: unknown) {
            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Erro inesperado, tente novamente mais tarde. ')
            }
        },
    })

    return (
        <form onSubmit={(e) => handleAddAdicionalToProduct(e)} className='space-y-2'>
            <h1 className=" text-3xl text-muted font-semibold uppercase  py-8 flex items-center gap-1">
                <MdAssignmentAdd size={40} />
                Cadastrar Adicionais {'>'} {product?.titulo}
            </h1>
            <span className="text-xs text-muted">Selecione os ingredientes que deseja oferecer como adicionais.</span>
            <div className="grid grid-cols-2 gap-2">
                {ingredientes?.map((item) => {
                    const igredientID = parseInt(item.id)
                    return (
                        <div key={`${igredientID}-${addSelectedItems[igredientID]}`} className={`flex items-center justify-between w-full px-4 py-1 rounded-md dark:bg-dark-500`}>
                            <div className={`flex items-center gap-2 text-sm cursor-pointer ${addSelectedItems[igredientID] ? 'text-white' : 'text-muted'}`}>
                                <Checkbox
                                    checked={!!addSelectedItems[igredientID]}
                                    onCheckedChange={() => handleToggle(igredientID)}
                                />
                                <div className="flex flex-col ">
                                    <span className='capitalize'>{item.nome} </span>
                                    <p className="text-xs">R$ {item?.valor.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className='flex justify-end pt-6'>
                <Button
                    variant={'outline'}
                    onClick={() => setStep((prevStep) => prevStep - 1)}
                    className="flex items-center gap-1 text-sm mr-1">
                    <MdArrowRightAlt className='rotate-180' size={20} />
                    Voltar
                </Button>
                <Button
                    loading={isPending}
                    type='submit'
                    variant={'outline'}
                    className="flex items-center gap-1 text-sm">
                    Finalizar
                    <MdSaveAlt size={20} />
                </Button>
            </div>
        </form>
    )
}
export default EditProduct;