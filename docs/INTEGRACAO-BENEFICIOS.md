# Cashback, fidelidade e prêmios

A página protegida `/cashback` consome `GET /usuario/beneficios` por React Query e pelo cliente HTTP centralizado. O contrato está tipado em `src/dto/beneficiosDTO.ts`.

- Exibe até 50 movimentações retornadas pela API: crédito, uso, devolução de cashback e reversão de crédito após estorno. Cada registro mostra valor, data no horário de Brasília e link para o pedido correspondente.
- Mostra os prêmios válidos retornados pela API, distinguindo disponíveis e entregues. O progresso representa o ciclo atual; um prêmio disponível ganha destaque mesmo quando o contador reinicia após seis pedidos.
- A entrega continua sendo registrada exclusivamente pela equipe, no endpoint administrativo existente. O cliente consulta o estado e recebe a orientação de combinar a retirada com a loja.
- O saldo negativo após reversão é exibido com explicação; a opção de utilizar cashback só fica disponível com saldo positivo e consulta sem erro.
- Atualização manual reconsulta saldo, extrato e prêmios. Falha inicial oferece nova tentativa; falha posterior preserva a última consulta, mostra um aviso e bloqueia a opção de usar o saldo até recuperar a consulta.

Não houve alteração nas regras de crédito, fidelidade ou estorno, no código produtivo do backend, nas migrations ou nas rotas protegidas.

## Testes

`tests/e2e/beneficios.spec.ts` usa frontend/API reais e MySQL temporário, com `integrationSuite: 'beneficios'` para isolar as contas e os limites de requisições.

Os três cenários verificam:

1. Seis pedidos pagos e concluídos geram R$ 11,70 de cashback e um prêmio; após registro administrativo da entrega, a página mostra o prêmio entregue. A tentativa de resgate pelo cliente recebe `403`.
2. Pagamento online confirmado e pedido concluído geram crédito; um segundo pedido usa o saldo. O estorno do primeiro produz saldo negativo e reversão no extrato; cancelar o segundo devolve o cashback e recompõe o saldo. Os eventos percorrem o webhook real, com gateway financeiro simulado.
3. Falhas no carregamento e na atualização permitem recuperação, preservam os valores da última consulta e bloqueiam a opção de utilização enquanto a consulta falha.

```sh
# No backend
npm run build

# No frontend
npm run build
npm run test:e2e -- beneficios.spec.ts
```

Os pré-requisitos são os da [infraestrutura temporária de integração](INTEGRACAO-PAGAMENTOS.md). Nenhuma cobrança, mensagem externa ou alteração de saldo fora do banco temporário é realizada.

## Validação local — 18/09/2026

Build, lint e tipos do frontend aprovados. A regressão de benefícios, cupons e pagamentos passou com dez testes de navegador em 25,5 segundos. O frontend local foi reiniciado com o build atualizado. A suíte completa agora contém 34 cenários; nesta etapa foram executados os dez ligados a benefícios e pagamentos.
