'use client'
import { CardapioDTO } from "@/dto/cardapioDTO";
import { api } from "@/service/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { FaCoffee, FaShoppingBasket } from "react-icons/fa";
import { ImCancelCircle } from "react-icons/im";
import { MdSaveAlt } from "react-icons/md";
import { TbSquareRoundedPlus } from "react-icons/tb";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useForm } from "react-hook-form";
import { PiTrash } from "react-icons/pi";
import { Tooltip } from "react-tooltip";
import { z } from "zod";

type Props = {
    setMenu: React.Dispatch<React.SetStateAction<string>>
    setSelectedCategory: React.Dispatch<React.SetStateAction<{ id: string, name: string } | null>>
    productID: number | null
    setProductID: React.Dispatch<React.SetStateAction<number | null>>
}
const MenuProfile = ({ setMenu, setSelectedCategory, setProductID, productID }: Props) => {
    const [open, setOpen] = React.useState(false);
    const [showIcon, setShowIcon] = React.useState<number | null>(null);
    const [openModalRemoveProduct, setOpenModalRemoveProduct] = React.useState(false);

    const { data: cardapio, refetch: handleUpdateCategory } = useQuery({
        queryKey: ['list-categories-details'],
        queryFn: async () => {
            try {
                const { data } = await api.get<CardapioDTO[]>('/categoria/lista/detalhes')
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

    function handleWapperRemoveProduct(productID: number) {
        setProductID(productID)
        setOpenModalRemoveProduct(!openModalRemoveProduct)
    }

    function handleEditProduct(productID: number) {
        setProductID(productID)
        setMenu('edit-products')
    }



    return (
        <div className="min-h-screen h-full dark:bg-dark-400 bg-white 2xl:w-64 lg:w-60 p-4">
            <div className="flex justify-between items-center p-2">
                <div className="text-start ">
                    <h1 className="text-white text-md font-bold leading-5">Cardápio</h1>
                    <p className="text-muted text-xs leading-4 italic">Natal</p>
                </div>
                <div className="flex justify-center items-center h-14">
                    <img src="https://github.com/antunesgelson.png" className="h-14 w-14 rounded-full" />
                </div>
            </div>
            <section className="mt-6">
                <div className="flex items-center justify-between">
                    <h2 className="font-sans tracking-widest">Categorias</h2>
                    <button onClick={() => setOpen(true)}>
                        <TbSquareRoundedPlus
                            size={20}
                            data-tooltip-id={`categories-tooltip`}
                            data-tooltip-content={'Adicionar nova categoria.'}
                            className=" dark:hover:text-white hover:text-black text-muted  rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 "
                        />
                        <Tooltip id={`categories-tooltip`} />
                    </button>
                </div>

                <div className="mt-3">
                    {cardapio?.map((item, index) => {
                        return (
                            <div key={index} className="flex justify-between items-center p-2 ">
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger className="flex justify-between items-center gap-2">
                                            <div className="flex items-center gap-2 ">
                                                <FaCoffee className="dark:text-white text-muted-foreground" />
                                                <p className="line-clamp-1">{item.titulo}</p>

                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="">
                                            <div className="group cursor-pointer flex justify-between items-center pb-4 -mt-1 ">
                                                <span className="text-xs font-sans tracking-widest  dark:text-muted group-hover:dark:text-white line-clamp-1">Adicionar Produto</span>
                                                <button
                                                    className="relative"
                                                    data-tooltip-id={`products-tooltip`}
                                                    data-tooltip-content={'Adicionar novo produto.'}
                                                    onClick={() => {
                                                        setSelectedCategory({ id: String(item.id), name: item.titulo });
                                                        setMenu('products');
                                                    }}>
                                                    <TbSquareRoundedPlus className="group-hover:dark:text-white text-muted rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100" size={15} />
                                                    <Tooltip id={`products-tooltip`} className="z-50" />
                                                </button>
                                            </div>
                                            <AnimatePresence>
                                                {item.produtos.map((produto,) => (
                                                    <motion.div key={produto.id}
                                                        layout
                                                        className="  text-xs w-full h-full dark:bg-dark-400/50 flex justify-between items-center group"
                                                        onClick={() => { handleEditProduct(produto.id) }}
                                                        onMouseEnter={() => setShowIcon(produto.id)}
                                                        onMouseLeave={() => setShowIcon(null)}>
                                                        <p className="line-clamp-1 cursor-pointer group-hover:text-dark-900 dark:group-hover:text-white group-hover:translate-x-1 group-hover:underline underline-offset-2 duration-300 text-muted py-2">
                                                            {produto.titulo}
                                                        </p>
                                                        <AnimatePresence>
                                                            {showIcon == produto.id &&
                                                                <motion.div
                                                                    onClick={() => { handleWapperRemoveProduct(produto.id) }}
                                                                    initial={{ x: 30, opacity: 0, scale: 0.2, rotate: '100deg', filter: 'blur(20px)' }}
                                                                    animate={{ x: 0, opacity: 1, scale: 1, rotate: '0deg', filter: 'blur(0px)' }}
                                                                    whileTap={{ scale: 1.2 }}
                                                                    exit={{ x: -30, opacity: 0, scale: 0.2, rotate: '100deg', filter: 'blur(20px)' }}
                                                                    transition={{ duration: 0.3 }}
                                                                    data-tooltip-id="removeProduct-tooltip"
                                                                    data-tooltip-content="Remover este produto.">
                                                                    <Button
                                                                        size={'icon'}
                                                                        variant={'icon'}
                                                                        className="group -mt-1  ">
                                                                        <PiTrash className=" hover:bg-black hover:text-red-400 h-6 w-6 p-1 hover:p-1.5 rounded-full  duration-300 " size={5} />
                                                                    </Button>
                                                                    <Tooltip id="removeProduct-tooltip" />
                                                                </motion.div>
                                                            }
                                                        </AnimatePresence>
                                                    </motion.div>
                                                ))}

                                            </AnimatePresence>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        )
                    })}

                    <Accordion type="single" collapsible className="w-full ">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="flex justify-between items-center gap-2">
                                <div className="flex items-center gap-2 font-sans tracking-widest">
                                    <FaShoppingBasket className="dark:text-white text-muted-foreground" />
                                    Ingredientes
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="group cursor-pointer flex justify-between items-center pb-4 -mt-1">
                                    <span className="text-xs font-sans tracking-widest  dark:text-muted group-hover:dark:text-white">Adicionar Ingrediente</span>
                                    <button onClick={() => { }}>
                                        <TbSquareRoundedPlus className="group-hover:dark:text-white text-muted rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100" size={15} />
                                    </button>
                                </div>
                                <div className="  text-xs w-full h-full dark:bg-dark-400/50  ">
                                    <p className="line-clamp-1 cursor-pointer hover:text-dark-900 dark:hover:text-white hover:translate-x-1 hover:underline underline-offset-2 duration-300 text-muted py-2">ingrediente.titulo</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>
            <ModalAddCategory
                open={open}
                onClose={() => setOpen(false)}
                handleUpdateCategory={handleUpdateCategory}
            />

            <ModalRemoveProduct
                open={openModalRemoveProduct}
                onClose={() => setOpenModalRemoveProduct(false)}
                handleUpdateCategory={handleUpdateCategory}
                productID={productID}
            />
        </div>
    );
}

const schemaAddCategory = z.object({
    title: z.string().min(3, 'O título deve conter no mínimo 3 caracteres.')
})

type schemaAddCategoryForm = z.infer<typeof schemaAddCategory>

type ModalProps = {
    open: boolean
    onClose: () => void
    handleUpdateCategory: () => void
}
const ModalAddCategory = ({ open, onClose, handleUpdateCategory }: ModalProps) => {
    const { handleSubmit, register, formState: { errors } } = useForm<schemaAddCategoryForm>({
        resolver: zodResolver(schemaAddCategory)
    })
    const { mutateAsync: handleAddCatory, isPending } = useMutation({
        mutationKey: ['add-category'],
        mutationFn: async ({ title }: schemaAddCategoryForm) => {
            const { data } = await api.post('/categoria', {
                titulo: title
            })
            return data
        }, onSuccess() {
            toast.success('Categoria adicionada com sucesso.')
            handleUpdateCategory()
            setTimeout(() => {
                onClose()
            }, 200);
        }, onError(error: unknown) {
            console.log(error)

            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)
            } else {
                toast.error('An unexpected error occurred')
            }
        }
    })
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form className="space-y-3" onSubmit={handleSubmit((data) => handleAddCatory(data))}>
                    <DialogHeader>
                        <DialogTitle className="dark:text-white-off">Adicionar Categoria</DialogTitle>
                        <DialogDescription >
                            Insira o título da nova categoria e clique em salvar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="">
                        <Input
                            label="Título"
                            placeholder="Nome da categoria"
                            questionContent="Insira o nome da categoria."
                            {...register('title')}
                            error={errors.title?.message}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            loading={isPending}
                            className="flex items-center gap-1"
                            variant={'outline'}
                            type="submit">
                            <MdSaveAlt />
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>

        </Dialog >
    )
}


type ModalRemoveProps = {
    open: boolean
    onClose: () => void
    handleUpdateCategory: () => void
    productID: number | null
}

const ModalRemoveProduct = ({ open, onClose, handleUpdateCategory, productID }: ModalRemoveProps) => {
    const { mutateAsync: handleRemoveProduct, isPending } = useMutation({
        mutationKey: ['add-category'],
        mutationFn: async () => {
            const { data } = await api.delete(`/produto/${productID}`)
            return data
        }, onSuccess() {
            toast.success('Produto removido com sucesso.')
            handleUpdateCategory()
            setTimeout(() => {
                onClose()
            }, 200);
        }, onError(error: unknown) {
            onClose()
            console.log(error)
            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)
            } else {
                toast.error('An unexpected error occurred')
            }
        }
    })
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] space-y-3">
                <DialogHeader>
                    <DialogTitle className="dark:text-white-off">Remover Produto</DialogTitle>
                    <DialogDescription >
                        tem certeza que deseja remover este produto?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        loading={isPending}
                        onClick={() => handleRemoveProduct()}
                        className="flex items-center gap-1"
                        variant={'outline'}>
                        <ImCancelCircle />
                        Remover
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}
export default MenuProfile;