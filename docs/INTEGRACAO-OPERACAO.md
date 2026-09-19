# Operação de pedidos: administrativo e cliente

O painel em `/admin/dashboard` consulta `GET /admin/pedidos?status=active`. A aba de agendamentos usa a mesma consulta e separa pedidos em análise com data futura. As ações usam `PATCH /admin/pedidos/:id/status` e `PATCH /admin/pedidos/:id/pagamento` pelo cliente HTTP centralizado; o acompanhamento do cliente continua consultando `GET /pedido/:id`.

## Comportamento integrado

- Pedidos com pagamento no recebimento avançam de análise para produção, pronto e finalizado. A finalização no cartão e nos detalhes só fica disponível quando o pedido está pronto e pago.
- A confirmação manual registra o recebimento do pagamento. Após a confirmação, o controle fica bloqueado. Pagamentos online são confirmados pelo provedor, conforme a regra existente no backend.
- Uma operação bloqueia novos comandos até terminar o envio e a reconsulta. O envio de agendamentos em lote é sequencial e para na primeira falha, inclusive quando a atualização da listagem falha. Ao tentar novamente, somente pedidos que continuam agendados entram no lote.
- Cancelamento e envio à produção mantêm os detalhes se a API recusar a alteração. O pedido sai da lista correspondente após a consulta confirmar seu novo estado.
- A consulta também ocorre após erros de escrita: se a API persistir uma alteração e a resposta se perder, o painel recupera o estado salvo sem repetir a ação automaticamente.
- Falha na atualização mantém a última listagem visível, apresenta uma nova tentativa e bloqueia ações até recuperar a consulta. Uma falha no primeiro carregamento mostra o estado de erro existente.
- As mutações invalidam pedidos, acompanhamento individual, operação, benefícios, relatórios, catálogo público/administrativo e indicadores individuais do cliente. Sessões de navegador distintas observam as alterações pelas consultas periódicas já existentes.

Esta etapa altera o frontend e seus testes. Transições, autorização, reserva de estoque e concessão de benefícios continuam sendo validadas transacionalmente pelo backend existente; não há novas rotas protegidas nem migrations.

## Testes de ponta a ponta

`tests/e2e/operacao.spec.ts` usa API Nest real, MySQL temporário e sessões separadas de administrador e cliente:

1. Recupera falha ao enviar à produção, acompanha preparo/pronto, confirma pagamento no recebimento com resposta retida e verifica bloqueio de novos comandos. Finaliza pelo cartão e confere status, cashback e fidelidade do cliente.
2. Preserva os detalhes após falha de cancelamento; simula uma resposta perdida após persistência e confere remoção do cartão, cancelamento no cliente e devolução de estoque.
3. Verifica a recusa de produção enquanto o pagamento online está pendente, aprova pelo webhook simulado e confirma que o controle financeiro manual fica bloqueado.
4. Preserva cartões durante indisponibilidade da listagem, bloqueia ações e recupera a consulta por nova tentativa.
5. Interrompe um lote de três pedidos na segunda operação e retoma somente os dois pedidos ainda agendados.

```sh
# Backend
npm run build

# Frontend
npm run build
npm run test:e2e -- operacao.spec.ts
```

Pré-requisitos e isolamento: [infraestrutura dos testes de pagamento](INTEGRACAO-PAGAMENTOS.md). O provedor de pagamento é simulado; os testes não fazem cobranças nem enviam mensagens externas.

## Validação local — 19/09/2026

Os cinco cenários novos e os quatro de cardápio passaram juntos em 56,5 segundos. Os nove cenários de agendamentos, benefícios e pagamentos também passaram na execução de regressão. Builds de frontend/backend, lint e tipos do frontend foram aprovados.

A primeira execução revelou duas falhas nos testes: o cardápio procurava pedidos para hoje nos agendamentos futuros, e a preparação da operação excedia o limite de login por IP. O teste de cardápio passou a escolher a visualização pela data confirmada; a suíte de operação reutiliza a sessão administrativa. As regras da aplicação foram preservadas.
