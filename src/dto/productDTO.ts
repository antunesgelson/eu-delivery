
type ReplaceDTO = {
    id: string,
    nome: string,
    valor: number,
    removivel: boolean,
    quantia: number,
}
export type IngredientesDTO = {
    id: string,
    nome: string,
    valor: number,
    removivel: boolean,
    quantia: number,
    replace?: ReplaceDTO
}

export type AdicionaisDTO = {
    id: string,
    nome: string,
    valor: number,
}

export type ProdutosDTO = {
    id: number,
    titulo: string,
    descricao: string,
    valor: string,
    img: string,
    desconto: number,
    limitItens: number,
    servingSize: number,
    ingredientes: IngredientesDTO[],
    adicionais: AdicionaisDTO[]
}