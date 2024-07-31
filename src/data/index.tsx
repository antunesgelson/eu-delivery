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
                titulo: "Café [P]",
                descricao: "Este box de café é uma opção completa e personalizada para os amantes de um bom café.",
                valor: 100.00,
                img: Thumb.src,
                desconto: 0, // Sem desconto
                limitItens: 10,
                igredientes: [
                    { id: '1', nome: "baguete", valor: 5.00, removivel: true, quantia: 1 },
                    { id: '2', nome: "salame italiano", valor: 4.00, removivel: true, quantia: 1 },
                    { id: '3', nome: "queijo", valor: 5.40, removivel: true, quantia: 1 },
                    { id: '4', nome: "geleia", valor: 2.50, removivel: true, quantia: 1 },
                    { id: '5', nome: "pate", valor: 2.50, removivel: true, quantia: 1 },
                    { id: '6', nome: "bolinho", valor: 5.00, removivel: true, quantia: 1 },
                    { id: '7', nome: "bolachinha", valor: 5.00, removivel: true, quantia: 1 },
                    { id: '8', nome: "frutas", valor: 5.00, removivel: true, quantia: 1 },
                    { id: '9', nome: "suco integral", valor: 5.80, removivel: true, quantia: 1 },
                    { id: '10', nome: "drip coffe", valor: 5.40, removivel: true, quantia: 1 },
                    { id: '11', nome: "açucar sache", valor: 1.00, removivel: true, quantia: 1 },
                ],
                adicionais: [
                    { id: '1', nome: "baguete", valor: 5.00 },
                    { id: '2', nome: "salame italiano", valor: 4.00 },
                    { id: '3', nome: "queijo", valor: 5.40 },
                    { id: '4', nome: "geleia", valor: 2.50 },
                    { id: '5', nome: "pate", valor: 2.50 },
                    { id: '6', nome: "bolinho", valor: 5.00 },
                    { id: '7', nome: "bolachinha", valor: 5.00 },
                    { id: '8', nome: "frutas", valor: 5.00 },
                    { id: '9', nome: "suco integral", valor: 5.80 },
                    { id: '10', nome: "drip coffe", valor: 5.40 },
                    { id: '11', nome: "açucar sache", valor: 1.00 },
                ]
            }
        ]
    },

];


export const historicDetails = [
    {
        id: "1",
        date: "01/09/2021",
        time: "18:30",
        canBeRated: true,
        items: [
            {
                quantity: 2,
                name: "FRANÇA",
                customizations: ["sem Cebola", "com Cebola Caramelizada"],
                price: 69.00
            },
            {
                quantity: 1,
                name: "POTE MAIONESE",
                price: 3.00
            },
            {
                quantity: 1,
                name: "MILK SHAKE MORANGO",
                price: 17.00
            }
        ],
        subtotal: 89.00,
        deliveryFee: "Grátis!",
        total: 89.00,
        address: "Rua Vani Correa, 247, Bom Viver, Biguaçu",
        paymentMethod: [
            {
                type: "Cashback",
                amount: 12.61
            },
            {
                type: "Visa",
                amount: 76.39
            }
        ]
    },
    {
        id: "2",
        date: "02/09/2021",
        time: "12:15",
        canBeRated: true,
        items: [
            {
                quantity: 1,
                name: "HAMBÚRGUER VEGETARIANO",
                customizations: ["sem queijo", "extra alface"],
                price: 25.00
            },
            {
                quantity: 1,
                name: "BATATA FRITA",
                price: 10.00
            }
        ],
        subtotal: 35.00,
        deliveryFee: "Grátis!",
        total: 35.00,
        address: "Av. Brasil, 500, Centro, Florianópolis",
        paymentMethod: [
            {
                type: "Mastercard",
                amount: 35.00
            }
        ]
    },
    {
        id: "3",
        date: "03/09/2021",
        time: "20:45",
        canBeRated: true,
        items: [
            {
                quantity: 3,
                name: "PIZZA MARGHERITA",
                customizations: ["com manjericão", "com alho"],
                price: 35.00
            },
            {
                quantity: 1,
                name: "REFRIGERANTE 2L",
                price: 10.00
            }
        ],
        subtotal: 115.00,
        deliveryFee: "5.00",
        total: 120.00,
        address: "Rua das Palmeiras, 123, Trindade, Florianópolis",
        paymentMethod: [
            {
                type: "Pix",
                amount: 120.00
            }
        ]
    },
    {
        id: "4",
        date: "04/09/2021",
        time: "13:00",
        canBeRated: false,
        items: [
            {
                quantity: 2,
                name: "SALADA CAESAR",
                customizations: ["sem croutons", "extra frango"],
                price: 30.00
            },
            {
                quantity: 1,
                name: "ÁGUA MINERAL",
                price: 5.00
            }
        ],
        subtotal: 65.00,
        deliveryFee: "Grátis!",
        total: 65.00,
        address: "Rua Santa Catarina, 45, Campinas, São José",
        paymentMethod: [
            {
                type: "American Express",
                amount: 65.00
            }
        ]
    },
    {
        id: "5",
        date: "05/09/2021",
        time: "19:30",
        canBeRated: false,
        items: [
            {
                quantity: 1,
                name: "SUSHI COMBO",
                customizations: ["sem wasabi", "extra gengibre"],
                price: 85.00
            },
            {
                quantity: 1,
                name: "TEMPURÁ DE CAMARÃO",
                price: 20.00
            }
        ],
        subtotal: 105.00,
        deliveryFee: "7.00",
        total: 112.00,
        address: "Rua das Flores, 789, Kobrasol, São José",
        paymentMethod: [
            {
                type: "Dinheiro",
                amount: 112.00
            }
        ]
    },
    {
        id: "6",
        date: "06/09/2021",
        time: "14:45",
        canBeRated: false,
        items: [
            {
                quantity: 1,
                name: "PASTEL DE CARNE",
                customizations: ["com queijo", "sem azeitona"],
                price: 8.00
            },
            {
                quantity: 1,
                name: "SUCO DE LARANJA",
                price: 6.00
            }
        ],
        subtotal: 14.00,
        deliveryFee: "Grátis!",
        total: 14.00,
        address: "Av. Beira-Mar, 1010, Centro, Florianópolis",
        paymentMethod: [
            {
                type: "Cashback",
                amount: 14.00
            }
        ]
    },
    {
        id: "7",
        date: "07/09/2021",
        time: "11:30",
        canBeRated: false,
        items: [
            {
                quantity: 2,
                name: "TAPIOCA",
                customizations: ["com coco", "com leite condensado"],
                price: 15.00
            },
            {
                quantity: 1,
                name: "CAFÉ EXPRESSO",
                price: 4.00
            }
        ],
        subtotal: 34.00,
        deliveryFee: "Grátis!",
        total: 34.00,
        address: "Rua do Sol, 256, Ingleses, Florianópolis",
        paymentMethod: [
            {
                type: "Visa",
                amount: 34.00
            }
        ]
    },
    {
        id: "8",
        date: "08/09/2021",
        time: "18:00",
        canBeRated: false,
        items: [
            {
                quantity: 1,
                name: "FRANGO À PARMEGIANA",
                customizations: ["sem batata frita", "com arroz integral"],
                price: 45.00
            },
            {
                quantity: 1,
                name: "SUCO DE UVA",
                price: 7.00
            }
        ],
        subtotal: 52.00,
        deliveryFee: "3.00",
        total: 55.00,
        address: "Rua das Acácias, 789, Estreito, Florianópolis",
        paymentMethod: [
            {
                type: "Mastercard",
                amount: 55.00
            }
        ]
    },
    {
        id: "9",
        date: "09/09/2021",
        time: "13:45",
        canBeRated: false,
        items: [
            {
                quantity: 1,
                name: "HAMBÚRGUER ARTESANAL",
                customizations: ["com queijo cheddar", "com bacon"],
                price: 28.00
            },
            {
                quantity: 1,
                name: "CERVEJA ARTESANAL",
                price: 12.00
            }
        ],
        subtotal: 40.00,
        deliveryFee: "Grátis!",
        total: 40.00,
        address: "Rua São João, 300, Coqueiros, Florianópolis",
        paymentMethod: [
            {
                type: "Pix",
                amount: 40.00
            }
        ]
    },
    {
        id: "10",
        date: "10/09/2021",
        time: "20:00",
        canBeRated: false,
        items: [
            {
                quantity: 1,
                name: "ESPAGUETE À BOLONHESA",
                customizations: ["com queijo ralado", "sem pimenta"],
                price: 32.00
            },
            {
                quantity: 1,
                name: "SUCO DE ABACAXI",
                price: 6.00
            }
        ],
        subtotal: 38.00,
        deliveryFee: "4.00",
        total: 42.00,
        address: "Rua das Oliveiras, 22, Itacorubi, Florianópolis",
        paymentMethod: [
            {
                type: "American Express",
                amount: 42.00
            }
        ]
    },
    {
        id: "11",
        date: "11/09/2021",
        time: "17:30",
        canBeRated: false,
        items: [
            {
                quantity: 1,
                name: "BOLO DE CHOCOLATE",
                customizations: ["com cobertura extra", "sem granulado"],
                price: 18.00
            },
            {
                quantity: 1,
                name: "CHÁ GELADO",
                price: 5.00
            }
        ],
        subtotal: 23.00,
        deliveryFee: "Grátis!",
        total: 23.00,
        address: "Rua das Laranjeiras, 123, Abraão, Florianópolis",
        paymentMethod: [
            {
                type: "Visa",
                amount: 23.00
            }
        ]
    }
]

