import { AddressDTO } from "./addressDTO"
import { AdicionaisDTO, IngredientesDTO, ProdutosDTO } from "./productDTO"

export type ItensDTO = {
    adicionais: AdicionaisDTO[]
    id: number
    ingredientes: IngredientesDTO[]
    obs: string
    quantidade: number
    valor: number
    valorAdicionais: number
    produto: ProdutosDTO
}


export type CartDTO = {
    id: number
    status: string
    itens: ItensDTO[]
    cupomId: string
    cashBack: number
    dataEntrega: null
    endereco: AddressDTO
    obs: string
    valorTotalPedido: number
}