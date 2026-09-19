# Endereços e entrega no checkout

O cliente pode cadastrar ou gerenciar endereços a partir do seletor de recebimento. Cadastro e edição mantêm o retorno ao pedido; na lista, **Entregar aqui** seleciona o endereço pela API e volta à tela de origem após a confirmação. Uma falha mantém o cadastro disponível para tentar novamente, sem reenviar o formulário de criação.

O parâmetro `returnTo` aceita somente `/checkout` ou `/cart`. Acesso normal à lista continua permitindo gerenciar endereços sem alterar o pedido. Outras URLs são ignoradas.

## Contrato com a API

- `POST /endereco`, `GET /endereco/todos`, `GET /endereco/:id`, `PUT /endereco` e `DELETE /endereco/:id` usam a sessão do titular pelo proxy autenticado.
- `PUT /endereco` exige um ID. Antes da correção, omitir esse campo permitia ao ORM encontrar um endereço arbitrário do usuário.
- A seleção envia `PUT /pedido/carrinho` com `tipoRecebimento: "delivery"` e `enderecoId`. O servidor valida o titular, o CEP/bairro atendido e a taxa; somente a resposta confirmada atualiza o carrinho da interface.
- Seleção recusada não altera endereço, canal ou taxa do carrinho. Trocar para retirada remove a taxa de entrega.
- O pedido mantém uma cópia do endereço selecionado. Editar ou excluir um cadastro não reescreve essa cópia nem pedidos anteriores; para atualizar a entrega do carrinho, escolha o endereço novamente após editar. A edição iniciada pelo checkout apresenta essa orientação.
- Acompanhamento usa o canal persistido para apresentar **Pronto para entrega**, a taxa e o endereço; retirada continua com suas próprias mensagens.

Nenhuma migration ou rota protegida nova foi necessária.

## Testes locais — 17/09/2026

Pré-requisitos e credenciais: [testes do PDV](TESTES-PDV.md). A API deve usar autenticação de desenvolvimento, catálogo demonstrativo com produto 101 a R$ 65, entrega de R$ 10 para CEP 88650-000 e horário disponível. Nenhuma mensagem ou cobrança externa é realizada.

```sh
npm run test:e2e -- enderecos.spec.ts
```

Dois cenários aprovados com API real e frontend em build de produção:

1. Validação do formulário, cadastro pelo checkout, edição, falha 503 simulada na seleção e nova tentativa, persistência após recarga, agendamento, pagamento no recebimento, finalização de entrega por R$ 75 e acompanhamento da mudança de status feita na API.
2. CEP fora da área sem alteração do carrinho, correção e seleção, favorito persistido, retorno ao carrinho, retirada com taxa zero, descarte de URL externa em `returnTo` e exclusão persistida.

Os testes criam clientes identificados como `Endereços E2E`. O pedido criado é cancelado ao final para liberar a reserva; cadastros, carrinhos e histórico local permanecem na base de desenvolvimento. Os testes recusam hosts remotos.

A suíte HTTP/MySQL passou com 33 testes, incluindo edição sem ID, isolamento entre titulares, favorito único e exclusão. Builds e lint dos dois projetos aprovados.

Para validar em produção local, execute `npm run build` e `npm run start`. Evite dois servidores `next dev` simultâneos no mesmo checkout: ambos usam `.next`. O build de produção usa `.next-production`, separado do desenvolvimento.
