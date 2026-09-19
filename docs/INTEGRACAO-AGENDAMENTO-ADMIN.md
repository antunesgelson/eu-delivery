# Edição administrativa de agendamentos

O painel `/admin/dashboard`, incluindo a visualização `?view=scheduled`, permite editar agendamentos e observações usando a API autenticada e o cliente HTTP centralizado.

## Comportamento

- O formulário consulta `GET /pedido/:id` ao abrir e os horários de `GET /pedido/horarios/:data` quando a data muda. A remarcação exige um horário disponível; trocar a data limpa a seleção anterior.
- React Hook Form e Zod validam os campos e o limite de 500 caracteres da observação. Reconsultas e falhas preservam os campos alterados. Carregamento, indisponibilidade, ausência de horários e nova tentativa aparecem na interface.
- Pedidos em análise enviam `PATCH /admin/pedidos/:id` com `obs` e `dataEntrega` no formato `YYYY-MM-DDTHH:mm:00-03:00`. Pedidos em produção ou prontos permitem alterar somente `obs`; os demais estados bloqueiam a edição.
- O backend existente valida o estado do pedido, os horários e a capacidade de estoque dentro da transação. Falta de estoque mantém a data e a reserva originais, e o frontend mantém a edição para correção.
- O formulário bloqueia envios simultâneos. Após salvar, invalida as consultas de operação, pedidos, catálogo e relatórios. Os detalhes selecionados acompanham os dados atualizados da listagem.
- Datas, horários e classificação dos dias no painel usam `America/Sao_Paulo`, independentemente do fuso do navegador.
- A listagem de agendados mostra falhas de carregamento com opção de tentar novamente.

Não foram adicionadas rotas protegidas, migrations ou mudanças no código produtivo do backend. As regras de acesso continuam nas rotas administrativas e na API. O harness do backend ganhou helpers exclusivos de teste para consultar a reserva por data e simular capacidade insuficiente.

## Testes

`tests/e2e/agendamento-admin.spec.ts` usa frontend e API reais, com MySQL temporário e `integrationSuite: 'agendamento'`. O administrador usa o fuso `Asia/Tokyo` e o cliente usa `America/Sao_Paulo`.

1. Falhas de listagem, consulta de horários e gravação permitem recuperação; uma data sem horários bloqueia o envio. A remarcação atualiza os detalhes administrativos, o acompanhamento do cliente e a reserva por data.
2. Capacidade insuficiente gera conflito real da API sem alterar pedido ou reserva. Após corrigir a capacidade, a mesma edição pode ser salva.
3. Pedido em produção aceita somente observação, valida seu tamanho e mantém a data original.

```sh
# No backend
npm run build

# No frontend
npm run build
npm run test:e2e -- agendamento-admin.spec.ts
```

Os pré-requisitos são os da [infraestrutura temporária de integração](INTEGRACAO-PAGAMENTOS.md). Os pedidos criados nestes cenários usam pagamento no recebimento.

## Validação local — 18/09/2026

Build, lint e tipos do frontend aprovados. A suíte completa passou com 37 testes de navegador em 2,4 minutos. O frontend local na porta 4051 foi reiniciado com o build atualizado.
