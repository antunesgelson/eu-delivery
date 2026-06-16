import Thumb from '@/assets/products/box.png';
import { CardapioDTO, CategoriaCardapioDTO } from '@/dto/cardapioDTO';
import { ProdutosDTO } from '@/dto/productDTO';

const productImage = {
    Bucket: 'local',
    ETag: 'local',
    Key: 'box.png',
    Location: Thumb.src,
};

export const localCardapio: CardapioDTO[] = [
    {
        id: 1,
        titulo: 'Assados',
        produtos: [
            {
                id: 101,
                titulo: 'Frango assado recheado',
                descricao: 'Frango assado inteiro com recheio especial, farofa temperada, calabresa, queijo coalho e finalizacao dourada na brasa.',
                valor: '65',
                imgs: [productImage],
                valorPromocional: 0,
                limitItens: 3,
                servingSize: 4,
                ingredientes: [
                    {
                        id: '1001',
                        nome: 'farofa de bacon',
                        valor: 8,
                        removivel: true,
                        quantia: 1,
                    },
                    {
                        id: '1002',
                        nome: 'linguica calabresa',
                        valor: 10,
                        removivel: true,
                        quantia: 1,
                    },
                    {
                        id: '1003',
                        nome: 'queijo coalho',
                        valor: 9,
                        removivel: true,
                        quantia: 1,
                    },
                    {
                        id: '1004',
                        nome: 'cebola caramelizada',
                        valor: 5,
                        removivel: true,
                        quantia: 1,
                    },
                    {
                        id: '1005',
                        nome: 'molho barbecue',
                        valor: 4,
                        removivel: true,
                        quantia: 1,
                    },
                    {
                        id: '1006',
                        nome: 'tempero da casa',
                        valor: 0,
                        removivel: false,
                        quantia: 1,
                    },
                ],
                adicionais: [
                    {
                        id: '1011',
                        nome: 'maionese extra',
                        valor: 18,
                    },
                    {
                        id: '1012',
                        nome: 'arroz branco',
                        valor: 15,
                    },
                    {
                        id: '1013',
                        nome: 'farofa crocante',
                        valor: 12,
                    },
                    {
                        id: '1014',
                        nome: 'molho barbecue extra',
                        valor: 6,
                    },
                    {
                        id: '1015',
                        nome: 'batata rustica',
                        valor: 18,
                    },
                ],
            },
            {
                id: 102,
                titulo: 'Frango assado sem recheio',
                descricao: 'Frango assado inteiro sem recheio, temperado e dourado no ponto.',
                valor: '60',
                imgs: [productImage],
                valorPromocional: 0,
                limitItens: 0,
                servingSize: 4,
                ingredientes: [],
                adicionais: [],
            },
            {
                id: 103,
                titulo: 'Meio frango assado',
                descricao: 'Meia porção de frango assado, ideal para uma refeição menor.',
                valor: '35',
                imgs: [productImage],
                valorPromocional: 0,
                limitItens: 0,
                servingSize: 2,
                ingredientes: [],
                adicionais: [],
            },
        ],
    },
    {
        id: 2,
        titulo: 'Defumados BBQ',
        produtos: [
            {
                id: 201,
                titulo: 'Costelinha BBQ Defumada',
                descricao: 'Costelinha suína defumada ao estilo BBQ, finalizada com molho barbecue.',
                valor: '89.90',
                imgs: [productImage],
                valorPromocional: 0,
                limitItens: 0,
                servingSize: 2,
                ingredientes: [],
                adicionais: [],
            },
        ],
    },
    {
        id: 3,
        titulo: 'Acompanhamentos',
        produtos: [
            {
                id: 301,
                titulo: 'Maionese',
                descricao: 'Porção de maionese caseira para acompanhar os assados.',
                valor: '18',
                imgs: [productImage],
                valorPromocional: 0,
                limitItens: 0,
                servingSize: 2,
                ingredientes: [],
                adicionais: [],
            },
            {
                id: 302,
                titulo: 'Arroz',
                descricao: 'Porção de arroz branco soltinho para completar a refeição.',
                valor: '15',
                imgs: [productImage],
                valorPromocional: 0,
                limitItens: 0,
                servingSize: 2,
                ingredientes: [],
                adicionais: [],
            },
        ],
    },
    {
        id: 4,
        titulo: 'Bebidas',
        produtos: [
            {
                id: 401,
                titulo: 'Coca-Cola 2L',
                descricao: 'Refrigerante Coca-Cola de 2 litros.',
                valor: '15',
                imgs: [productImage],
                valorPromocional: 0,
                limitItens: 0,
                servingSize: 1,
                ingredientes: [],
                adicionais: [],
            },
            {
                id: 402,
                titulo: 'Pureza 2L',
                descricao: 'Refrigerante Pureza de 2 litros.',
                valor: '15',
                imgs: [productImage],
                valorPromocional: 0,
                limitItens: 0,
                servingSize: 1,
                ingredientes: [],
                adicionais: [],
            },
        ],
    },
];

export const localCategorias: CategoriaCardapioDTO[] = localCardapio.map(({ id, titulo }) => ({
    id: String(id),
    titulo,
}));

export function getLocalProduct(productID: string): ProdutosDTO | undefined {
    return localCardapio
        .flatMap((categoria) => categoria.produtos)
        .find((produto) => String(produto.id) === productID);
}

export const localConfigData = [
    { chave: 'CASHBACK', valor: '0' },
    { chave: 'TELEFONE', valor: '(48) 99175-8185' },
    { chave: 'REDESSOCIAIS', valor: JSON.stringify({ facebook: '', instagram: '' }) },
];
