
export type IngredientesDTO = {
    id: string,
    nomeIngrediente: string,
    valorIngrediente: number,
    removivel: boolean,
    quantia: number
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