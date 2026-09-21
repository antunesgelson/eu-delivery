# Integração das funções do sistema

Escopo atualizado pelo usuário: concluir as demais funções; integração de métodos de pagamento fora desta etapa. A ausência de credenciais externas não impede avançar nas funções locais.

## Implementado na revisão atual

- Configurações: gravação em lote atômico na API, sete dias e intervalos, contato/redes sociais, retirada e faixas de entrega; validação e preservação de edição após falha. Informações de contato aparecem na loja.
- Cupons administrativos: React Hook Form/Zod, confirmação de persistência antes de fechar o formulário, bloqueio de operações simultâneas, reconciliação de resposta perdida e datas civis. Duplicação abre uma nova edição para revisão.
- Relatórios: filtros por período de finalização no fuso de São Paulo; indicadores, meses, produtos, cupons e pedidos usam o mesmo recorte de pedidos finalizados e pagos. Pedidos paginados e exportação CSV da página exibida; clientes e saldos representam o cadastro atual. Falhas dos indicadores não impedem consultar clientes.
- Navegação: horários consultados da API, contador de pedidos em andamento, busca no menu, conta e logout, menu móvel. Atalhos de novo pedido e configurações conectados.
- Revisão operacional em validação: agenda dos sete dias; filtros, pesquisa, edição de quantidade/observação e rascunhos do PDV; personalização do produto por identificador e telefone de contato sem duplicar o código do país.

## Evidências atuais

- Backend: lint/build e 40 testes HTTP/MySQL aprovados em 21/09/2026. Novos cenários verificam atomicidade das configurações, intervalos e limites de período com paginação de relatórios.
- Frontend: lint/build aprovados; cupons, configuração, filtros/exportação e navegação móvel passaram nos testes direcionados. A regressão completa encontrou um teste de clientes que interceptava a URL antiga sem parâmetros; seu seletor foi atualizado e os três testes de clientes passaram novamente.
- Alterações mais recentes de PDV/agenda/personalização estão em validação. O resultado completo deve ser registrado antes de considerar esta etapa concluída.

## Revisão ainda necessária

- Cadastro administrativo de ingredientes/adicionais: a API de pedidos suporta opções, mas o editor atual de catálogo ainda não permite cadastrá-las.
- Estoque de dias úteis: verificar a configuração por data no catálogo junto dos novos horários e agrupamentos da agenda.
- Conferir as ações ativas restantes e a apresentação em telas pequenas; componentes antigos sem uso não comprovam falha em rota ativa.
- Concluir regressão, publicar os commits correspondentes e verificar o CI da versão atual.

Login, perfil, endereços, checkout, histórico, benefícios, clientes, cardápio, PDV e operação já possuem testes de integração. A revisão mantém essa cobertura.

Contas externas são necessárias para comprovar entrega real de WhatsApp/e-mail ou login Google. Nenhuma dessas entregas reais foi validada. Pagamentos não fazem parte dos novos trabalhos desta etapa.
