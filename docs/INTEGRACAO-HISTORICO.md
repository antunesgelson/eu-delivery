# Histórico e repetição de pedidos

O histórico usa a listagem real de pedidos com dez registros por página. O resumo consulta o total e o pedido mais recente separadamente, para não mudar ao navegar para páginas antigas. Datas são exibidas no fuso da loja (`America/Sao_Paulo`). A API desempata a ordenação pelo ID do pedido para manter a paginação estável.

Pedidos de entrega mostram a modalidade e o endereço gravados na compra, em vez do texto fixo de retirada.

## Pedir novamente

`POST /pedido/:id/repetir` exige autenticação e o cabeçalho `Idempotency-Key` com 8–100 caracteres alfanuméricos, hífen ou sublinhado. O ID deve pertencer ao próprio usuário e representar um pedido finalizado no checkout, mesmo que depois cancelado. Rascunhos e pedidos de outros usuários são recusados, inclusive quando o solicitante é administrador.

A transação bloqueia catálogo e cliente, copia produtos, quantidades, observações, ingredientes selecionados, adicionais e substituições, validando o catálogo atual. Os preços são recalculados. Os itens existentes no carrinho são preservados; os limites acumulados por produto e o máximo de 100 linhas também são conferidos.

Se algum produto ou opção estiver indisponível, ou os limites forem excedidos, nenhuma parte da repetição é salva. Uma repetição bem-sucedida é registrada na auditoria; requisições concorrentes ou reenviadas com a mesma chave retornam o carrinho atual sem adicionar os itens outra vez. A chave não pode ser reutilizada para outro pedido.

A interface mantém a chave após um erro e bloqueia novos cliques enquanto a ação está em andamento. Em caso de sucesso, atualiza o cache do carrinho e abre `/cart`.

Somente os itens do pedido antigo são copiados: endereço, agendamento, pagamento, cupom e cashback antigos não são reaplicados. As configurações já existentes no carrinho atual continuam sendo validadas. Repetir não reserva estoque, não finaliza a compra e não executa cobrança; a reserva ocorre no checkout.

O endpoint passa pelo proxy autenticado existente em `/api/backend/pedido/:id/repetir`. A autorização é feita pelo backend. Nenhuma migration nova é necessária.

## Validação local — 17/09/2026

- 32 testes HTTP/MySQL aprovados no backend, incluindo quatro casos novos de repetição: personalizações/preços/concorrência, rollback por indisponibilidade, limites do carrinho e isolamento entre usuários.
- Dois cenários Playwright aprovados com frontend e API reais: paginação/endereço e repetição após perda da resposta.
- Builds e lint aprovados nos dois projetos.

Para repetir os testes de navegador, use os serviços, o seed e as credenciais locais descritos em [Testes do PDV](TESTES-PDV.md):

```sh
npm run test:e2e -- historico.spec.ts
```

A preparação cria um cliente de teste e 11 pedidos locais, cancelados imediatamente para liberar suas reservas. Esses registros permanecem no histórico do cliente de teste. O segundo cenário deixa dois itens no carrinho desse cliente, sem finalizar a compra. Uma falha de transporte é simulada depois que a API responde com sucesso, para verificar o reenvio da mesma operação.
