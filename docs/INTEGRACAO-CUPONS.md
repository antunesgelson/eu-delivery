# Cupons e troca de cashback

A seleção de cupons usa `GET /cupom/publicos` e aplica/remove o código com `PUT /pedido/carrinho`. O desconto exibido para um cupom aplicado vem de `descontoCupom`, calculado pela API.

- O formulário valida o código com React Hook Form/Zod, remove espaços externos e envia letras maiúsculas. Campos e ações ficam bloqueados durante a gravação.
- A lista distingue carregamento, indisponibilidade com nova tentativa e ausência de cupons públicos. Um código recebido pode ser usado mesmo sem cupons na lista.
- A validade é exibida como data civil, sem conversão de fuso. O mínimo do pedido e a disponibilidade orientam os botões; a API revalida todas as regras na aplicação e na finalização.
- Abrir a seleção não altera o cashback. A aplicação de um cupom válido faz a troca na transação existente da API; código inexistente ou inelegível preserva o benefício anterior.
- Remoção atualiza os valores do carrinho pela resposta da API. A finalização invalida também a consulta de cupons públicos, para reconsultar a quantidade disponível.
- A seleção `/cupom` exige sessão pelo guard `ClientWrapper`, com retorno após login. O middleware continua exclusivo de `/admin`; o endpoint de listagem de cupons permanece público. Carrinho sem itens não permite aplicar um código.

Não houve mudança no contrato produtivo do backend nem nova migration. A infraestrutura de testes passou a permitir saldo inicial em contas temporárias. O escopo `integrationSuite: 'cupons'` cria API/banco próprios para esses cenários, evitando compartilhar limites de autenticação com outras suítes.

## Testes — 18/09/2026

`tests/e2e/cupons.spec.ts` contém quatro cenários:

1. Recuperação da listagem, validade no fuso de São Paulo, restrição de mínimo, validação do código, recuperação de falha de gravação, aplicação e remoção com valores persistidos.
2. Navegação e códigos recusados preservam o cashback; aplicação válida troca o benefício e atualiza o total.
3. Cupom privado é aplicado pelo código, persiste no checkout e não pode ser reutilizado pelo mesmo cliente após finalizar o pedido.
4. Lista vazia, bloqueio do carrinho sem itens e exigência de sessão para selecionar cupons.

Os quatro cenários passaram com frontend, API e MySQL reais em banco temporário, sem cobranças externas. A regressão completa também passou: 31 testes de navegador em 2,2 minutos. Build, lint e tipos do frontend foram aprovados. O pedido criado é cancelado ao encerrar os testes; o banco temporário é removido.

```sh
# No backend, com dependências e MySQL local configurados
npm run build

# No frontend
npm run build
npm run test:e2e -- cupons.spec.ts
```

Consulte os [pré-requisitos da infraestrutura temporária](INTEGRACAO-PAGAMENTOS.md). Para a suíte completa, consulte também as [credenciais e serviços locais necessários](TESTES-PDV.md).
