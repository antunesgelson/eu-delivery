# Configurações, cupons, relatórios e controles administrativos

## Configurações

`PUT /admin/configuracoes` exige administrador e recebe `{ configuracoes: [{ chave, valor }] }`. Valores continuam no formato das configurações existentes. A API valida todas as entradas, rejeita chaves repetidas e grava configurações e auditoria na mesma transação. O endpoint individual continua disponível.

A tela usa React Hook Form/Zod, mantém a edição após erro e reconsulta configurações, horários, carrinho e cardápio depois do sucesso. Horários abrangem sete dias, com uma pausa por dia. Janelas que atravessam a pausa não são oferecidas ao cliente. Telefone, endereço de retirada e links sociais são exibidos na loja.

## Cupons

O formulário valida código, desconto, quantidade, pedido mínimo e validade civil. Percentuais seguem o limite da API de 99%. A validade considera o calendário de São Paulo, inclusive o dia do vencimento.

As alterações aguardam a API antes de fechar o formulário. Reconsulta após erro distingue uma gravação confirmada cuja resposta se perdeu de uma gravação recusada. O ID do cadastro permanece estável para novas tentativas. Pausar, editar e excluir atualizam a lista confirmada; duplicar abre uma edição com novo código e status pausado.

## Relatórios

`GET /admin/relatorios?inicio=YYYY-MM-DD&fim=YYYY-MM-DD&page=1&limit=50` exige administrador. Datas são opcionais na API; sem filtro, consulta o histórico. A interface inicia no mês atual.

- O período usa `finalizadoEm`, do início do primeiro dia até o início do dia posterior à data final, no fuso da loja.
- Pedidos finalizados e pagos alimentam os indicadores e os agrupamentos mensais, por item e por cupom.
- `pedidosDetalhes` fornece pedidos paginados do mesmo recorte; a lista de clientes e seus saldos representa o cadastro atual.
- Valores brutos dos itens não incluem descontos do pedido.
- CSV exporta os registros exibidos. Nas listas paginadas o botão informa “Exportar página CSV”; o arquivo inclui o período e a página. Células iniciadas com caracteres de fórmula recebem proteção.
- Falha dos indicadores não impede consultar ou editar clientes.

## Navegação e operação

O menu consulta os horários e a quantidade de pedidos em andamento, permite pesquisar as opções, navegar em dispositivos móveis, abrir a conta e encerrar a sessão. Os atalhos do painel abrem o PDV e as configurações.

A agenda agrupa pedidos por qualquer dia da semana. O PDV permite pesquisar e filtrar produtos, ajustar quantidade/observação e persistir essas edições em rascunho. Ingredientes e adicionais existentes podem ser selecionados no produto; as remoções e substituições usam IDs, preservam ingredientes obrigatórios e são apresentados no carrinho, checkout, histórico e administrativo.

O cadastro administrativo de ingredientes/adicionais e a edição de estoque de dias úteis continuam sendo revisados. Essas pendências estão registradas em [Funções do sistema](FUNCOES-SISTEMA.md).

## Validação

- `tests/e2e/configuracoes.spec.ts`: persistência, horários, contato público, erros e recuperação.
- `tests/e2e/cupons-admin.spec.ts`: validação, erro de gravação, resposta perdida, edição, pausa e exclusão.
- `tests/e2e/relatorios-admin.spec.ts`: período, CSV, falha independente de indicadores e navegação móvel/logout.
- `tests/e2e/controles.spec.ts`: rascunho do PDV, agenda em dia útil e personalização até o pedido administrativo.
- Backend `test/loja.e2e-spec.ts`: transação das configurações, janelas de atendimento, acesso administrativo, limites civis e paginação do relatório.

Executar `npm run lint`, `npm run build` e `npm run test:integration` no frontend. O backend exige `npm run lint`, `npm run build` e `npm test`, usando banco MySQL local descartável conforme a infraestrutura de integração. As suítes não enviam mensagens reais a provedores.
