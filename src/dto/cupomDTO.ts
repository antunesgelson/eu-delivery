export type CupomDTO = {
    descricao: string
    id: string
    listaPublica: boolean
    nome: string
    quantidade: number
    status: boolean
    tipo: "porcentagem" | "valor_fixo";
    unicoUso: boolean
    validade: string
    valor: number
    valorMinimoGasto: number
}