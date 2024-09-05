import { ProdutosDTO } from "./productDTO";

export type CategoriaCardapioDTO = {
    id: string;
    titulo: string;
}


export type CardapioDTO = {
    id: number;
    titulo: string;
    produtos: ProdutosDTO[];
}