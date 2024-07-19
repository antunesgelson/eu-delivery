import Thumb from '@/assets/products/thumb.jpg';

export const cardapio = [
    {
        id: '1',
        secao: "Novidades",
        itens: [
            {
                id: '101',
                titulo: "Burger Costela",
                descricao: "Hambúrguer de costela bovina, molho barbecue, cebola caramelizada, queijo cheddar em um pão de brioche.",
                valor: 29.90,
                img: Thumb.src,
                desconto: 10 // 10% de desconto
            }
        ]
    },
    {
        id: '2',
        secao: "Combos",
        itens: [
            {
                id: '201',
                titulo: "Combo Clássico",
                descricao: "Burger clássico, batatas fritas médias e refrigerante.",
                valor: 39.90,
                img: Thumb.src,
                desconto: 5 // 5% de desconto
            }
        ]
    },
    {
        id: '3',
        secao: "Burgers",
        itens: [
            {
                id: '301',
                titulo: "Cheeseburger",
                descricao: "Hambúrguer de carne bovina, queijo cheddar, alface, tomate, cebola, picles e molho especial em um pão de brioche.",
                valor: 22.90,
                img: Thumb.src,
                desconto: 0 // Sem desconto
            }
        ]
    },
    {
        id: '4',
        secao: "Batatas Fritas",
        itens: [
            {
                id: '401',
                titulo: "Batatas Fritas com Cheddar e Bacon",
                descricao: "Porção de batatas fritas cobertas com cheddar derretido e pedaços de bacon crocante.",
                valor: 18.90,
                img: Thumb.src,
                desconto: 10 // 10% de desconto
            }
        ]
    },
    {
        id: '5',
        secao: "Bebidas",
        itens: [
            {
                id: '501',
                titulo: "Refrigerante Lata",
                descricao: "Escolha entre Coca-Cola, Fanta, Sprite ou Guaraná.",
                valor: 4.90,
                img: Thumb.src,
                desconto: 0 // Sem desconto
            }
        ]
    },
    {
        id: '6',
        secao: "Sobremesas",
        itens: [
            {
                id: '601',
                titulo: "Sundae",
                descricao: "Sorvete de baunilha com calda de chocolate ou morango e chantilly.",
                valor: 9.90,
                img: Thumb.src,
                desconto: 5 // 5% de desconto
            }
        ]
    },
    {
        id: '7',
        secao: "Vegetarianos",
        itens: [
            {
                id: '701',
                titulo: "Burger Vegetariano",
                descricao: "Hambúrguer de grão-de-bico, alface, tomate, cebola roxa, picles e molho tahine em um pão de brioche.",
                valor: 27.90,
                img: Thumb.src,
                desconto: 0 // Sem desconto
            }
        ]
    },
    {
        id: '8',
        secao: "Frango Crocante",
        itens: [
            {
                id: '801',
                titulo: "Sanduíche de Frango Crocante",
                descricao: "Peito de frango empanado e frito, alface, tomate e maionese em um pão de brioche.",
                valor: 24.90,
                img: Thumb.src,
                desconto: 10 // 10% de desconto
            }
        ]
    },
    {
        id: '9',
        secao: "Milkshakes",
        itens: [
            {
                id: '901',
                titulo: "Milkshake de Oreo",
                descricao: "Milkshake de baunilha com pedaços de biscoito Oreo.",
                valor: 14.90,
                img: Thumb.src,
                desconto: 5 // 5% de desconto
            }
        ]
    },
    {
        id: '10',
        secao: "Cafés",
        itens: [
            {
                id: '1001',
                titulo: "Café Expresso",
                descricao: "Café expresso tradicional.",
                valor: 4.50,
                img: Thumb.src,
                desconto: 0 // Sem desconto
            }
        ]
    },
];
