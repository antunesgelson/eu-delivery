import classNames from "classnames";
import { motion } from "framer-motion";
import React from "react";
import { toast } from "sonner";

import { IngredientesDTO } from "@/dto/productDTO";
import { api } from "@/service/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { FaShoppingBasket } from "react-icons/fa";
import { GiBread, GiCampCookingPot } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import { IconType } from "react-icons/lib";
import { TiEdit } from "react-icons/ti";
import { Tooltip } from "react-tooltip";

import ModalAddIngredient from "@/components/Modal/AddIngredient";
import ModalEditIngredient from "@/components/Modal/EditIngredient";
import { Button } from "@/components/ui/button";

const Ingredients = () => {
    const [openModalAdd, setOpenModalAdd] = React.useState(false);
    const [openModalEdit, setOpenModalEdit] = React.useState(false);
    const [ingredientEdit, setIngredientEdit] = React.useState({} as IngredientesDTO);

    const { data: ingredientes, refetch: handleUpdateIngredients } = useQuery({
        queryKey: ['list-ingredients'],
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
    })


    return (
        <section className="h-full p-4">
            <div className="my-4 px-2 flex items-center justify-between border-b pb-4 border-white-off/20">
                <h1 className="text-3xl flex items-center gap-2 font-sans tracking-widest">
                    <FaShoppingBasket />
                    Ingredientes
                </h1>
                <Button className="flex items-center gap-1"
                    variant={'outline'}
                    onClick={() => setOpenModalAdd(!openModalAdd)}>
                    <GiCampCookingPot size={18} />
                    Novo Ingrediente
                </Button>
            </div>
            <div className="grid grid-cols-4 gap-3">
                {ingredientes?.map((ingrediente, index) => (
                    <motion.div key={ingrediente.id}
                        layout
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ delay: index * 0.1, duration: 0.7 }}>
                        <Card
                            Icon={GiBread}
                            ingrediente={ingrediente}
                            handleUpdateIngredients={handleUpdateIngredients}
                            setOpenModalEdit={setOpenModalEdit}
                            setIngredientEdit={setIngredientEdit}
                        />
                    </motion.div>
                ))}
            </div>

            <ModalAddIngredient
                open={openModalAdd}
                onClose={() => setOpenModalAdd(!openModalAdd)}
                handleUpdateIngredients={handleUpdateIngredients}
            />

            <ModalEditIngredient
                open={openModalEdit}
                onClose={() => setOpenModalEdit(!openModalEdit)}
                handleUpdateIngredients={handleUpdateIngredients}
                ingredientEdit={ingredientEdit}
            />
        </section>
    )
}
type CardProps = {
    Icon: IconType;
    ingrediente: IngredientesDTO;
    handleUpdateIngredients: () => void;
    setOpenModalEdit: (value: boolean) => void;
    setIngredientEdit: (value: IngredientesDTO) => void;
}

const Card = ({ Icon, ingrediente, handleUpdateIngredients, setOpenModalEdit, setIngredientEdit }: CardProps) => {

    const { mutateAsync: handleRemoveIngrediente, isPending } = useMutation({
        mutationKey: ['delete-ingredient'],
        mutationFn: async () => {
            const { data } = await api.delete(`/ingredientes/${ingrediente.id}`)
            return data
        }, onSuccess() {
            toast.success('Ingrediente removido com sucesso.')
            handleUpdateIngredients()
        }, onError(error: unknown) {
            if (error instanceof AxiosError && error.response) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Erro inesperado, tente novamente mais tarde.')
            }
        }
    })

    function handleEditIngrediente() {
        setOpenModalEdit(true)
        setIngredientEdit(ingrediente)
    }

    return (
        <div className="h-28 rounded-3xl flex justify-between items-center bg-white border-white dark:bg-dark-800 p-8 border dark:border-dark-400 shadow-sm drop-shadow-lg relative">
            <div className="flex flex-col">
                <h2 className="font-light text-muted capitalize ">{ingrediente.nome}</h2>
                <span className="font-semibold text-2xl py-1">R$ {ingrediente.valor.toFixed(2)} </span>
            </div>
            <div>
                <Icon size={50} className={classNames(
                    { 'text-green-600': ingrediente.nome == 'Receitas' },
                    { 'text-red-600 rotate-180': ingrediente.nome == 'Despesas' },
                    { 'text-muted dark:text-white': ingrediente.nome == 'Lucro Atual' },
                )} />
            </div>

            <div className="absolute top-2 right-4 ">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleEditIngrediente()}
                        className="hover:scale-150 duration-200"
                        data-tooltip-id="editar-tooltip"
                        data-tooltip-content="Editar">
                        <TiEdit className="   hover:text-blue-500" />
                    </button>
                    <Tooltip id="editar-tooltip" />

                    <Button loading={isPending} variant={'icon'} size={'iconxs'}
                        onClick={() => handleRemoveIngrediente()}
                        className="hover:scale-150 duration-200"
                        data-tooltip-id="remover-tooltip"
                        data-tooltip-content="Remover">
                        <IoClose className="hover:text-red-600" />
                    </Button>
                    <Tooltip id="remover-tooltip" />

                </div>
            </div>
        </div>
    )
}


export default Ingredients;