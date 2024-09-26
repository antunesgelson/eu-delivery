import { AdicionaisDTO, IngredientesDTO } from "./productDTO"

export type ItensDTO = {
    adicionais: AdicionaisDTO[]
    id: number
    ingredientes: IngredientesDTO[]
    obs: string
    quantidade: number
    valor: number
    valorAdicionais: number
}


export type CartDTO = {
    id: number
    status: string
    itens: ItensDTO[]
    cashBack: number
    dataEntrega: null
    endereco: null
    obs: string
    valorTotalPedido: number
}