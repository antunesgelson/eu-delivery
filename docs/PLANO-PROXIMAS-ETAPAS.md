# Plano das próximas etapas

Atualizado em 20/09/2026. O item 1 foi implementado e validado. O item 2 passou em instalação limpa local, Docker e GitHub Actions: 49 testes de navegador e 37 testes HTTP/MySQL. As versões estão nas branches de integração dos dois repositórios; a proteção remota da branch ainda não foi configurada. O item 3 depende do ambiente e das contas de teste. O item 4 já tem ensaio de restauração e procedimento de atualização; ainda depende das definições operacionais. O item 5 permanece planejado.

## Ponto de partida

- Loja, painel e PDV integrados à API e ao banco local.
- Entrega confirmada: R$ 10,00 exclusivamente para o CEP 88650-000.
- Pagamento online: prazo confirmado de 15 minutos; verificação periódica a cada 30 segundos, com conciliação antes de liberar a reserva.
- Aprovação após cancelamento sinalizada como estorno pendente; devolução financeira executada no provedor e confirmada por webhook.
- Última validação (20/09): CI integrado aprovado com lint/build, 49 testes de navegador, 37 testes HTTP/MySQL 8.4 e Docker em volume vazio. Localmente, Docker também passou em login, controle de origem, migrations repetidas, reinício e falha/recuperação do banco. Veja as [execuções e commits](VALIDACAO-INTEGRACAO.md).
- Provedores externos ainda não foram homologados; não houve cobrança nem envio de mensagens reais. Credenciais, gateway de WhatsApp e eventual importação da base antiga continuam pendentes de definição.

## Ordem de execução

| Ordem | Entrega | Dependência | Critério de conclusão |
|---|---|---|---|
| 1 — concluído | Recuperação de falhas de conciliação e avisos no painel | Código e banco local existentes | Falhas ficam visíveis, a fila continua avançando e novas tentativas não duplicam efeitos |
| 2 — validado | Verificações automatizadas e execução reproduzível | Ambiente de CI e Docker disponíveis para validação | Uma instalação limpa aplica migrations, sobe os serviços e passa nos testes |
| 3 | Homologação das integrações externas | Credenciais de teste, URLs e contas destinadas à homologação | Evidências de ponta a ponta para cada integração habilitada |
| 4 | Preparação dos dados e da operação | Decidir entre banco novo e importação do legado; definir hospedagem | Restauração e eventual importação ensaiadas; procedimento de atualização documentado |
| 5 | Relatórios e melhorias operacionais | Conclusão dos fluxos essenciais e definição das necessidades da loja | Totais conciliados por período e tarefas operacionais verificadas com a equipe |

## 1. Conciliação: recuperação e visibilidade

### Situação corrigida

A rotina anterior selecionava até 50 pedidos por vencimento, registrava erros somente nos logs e mantinha o catálogo bloqueado durante a consulta ao provedor. A implementação atual persiste a próxima tentativa, permite avanço dos demais pedidos e consulta o provedor antes de iniciar a transação de estoque.

### Escopo entregue

- Persistir tentativas por pedido: quantidade, próxima execução, última falha categorizada e última conciliação bem-sucedida.
- Selecionar somente tentativas elegíveis e distribuir o processamento para que falhas antigas não ocupem todos os lotes.
- Aplicar intervalos progressivos entre novas tentativas. Intervalos implementados: 30 segundos, 1, 2, 5 e 10 minutos, mantendo o prazo de pagamento de 15 minutos.
- Mostrar no painel pedidos vencidos que aguardam verificação, duração da pendência e opção administrativa de solicitar nova tentativa, com limite de frequência e auditoria.
- Separar falhas de comunicação de divergências de valor, moeda, recebedor ou referência; não expor tokens nem respostas brutas do provedor.
- Reduzir o tempo de bloqueio do catálogo durante consultas externas. Revalidar estado e pagamento dentro da transação antes de cancelar, cobrindo a chegada simultânea de webhooks.
- Preservar reservas quando a verificação não puder ser concluída e manter o tratamento de aprovação tardia já implementado.

### Critérios de aceite

- Com mais de 50 pedidos vencidos e falhas persistentes nos primeiros, os seguintes continuam sendo processados.
- Reiniciar a API não perde o histórico de tentativas nem libera uma reserva duas vezes.
- Dois processos simultâneos e um webhook concorrente não duplicam devoluções nem cancelam um pedido já conciliado como pago.
- Timeout do provedor não mantém o catálogo bloqueado durante toda a chamada externa.
- Apenas administradores acessam as pendências e solicitam novas tentativas.
- Alertas desaparecem quando a pendência é resolvida; falhas de carregamento aparecem na interface.

## 2. Verificações automatizadas e execução reproduzível

- Versões correspondentes publicadas na branch `codex/integracao-ci-20260919` dos dois repositórios, com backend fixado por commit no workflow e migrations registradas nas evidências.
- Workflows aprovados nos dois projetos para lint, build e testes HTTP/MySQL em banco temporário exclusivo. O frontend também aprovou navegador e Docker. Os repositórios atuais são públicos; se o backend se tornar privado, será necessária credencial de leitura específica. A configuração dos checks como obrigatórios na proteção da branch permanece pendente.
- Cobertura inicial do PDV adicionada em `tests/e2e/pdv.spec.ts` (ver [execução](TESTES-PDV.md)): seleção/cadastro de clientes, endereço, cashback, cupom, rascunho e pedido persistido.
- Histórico integrado à repetição transacional de pedidos; dois cenários de navegador em `tests/e2e/historico.spec.ts` (ver [contrato e validação](INTEGRACAO-HISTORICO.md)). A suíte do backend passou a 32 testes.
- Endereços conectados ao checkout, com cadastro, edição, seleção, favoritos e exclusão; dois cenários em `tests/e2e/enderecos.spec.ts` cobrem entrega até finalização e acompanhamento, troca para retirada e recuperação de falhas (ver [contrato e validação](INTEGRACAO-ENDERECOS.md)). A suíte do backend passou a 33 testes.
- Login integrado com validação de telefone e credenciais, confirmação explícita do código, reenvio preservado após recarga e retorno seguro à rota de origem; quatro cenários em `tests/e2e/login.spec.ts` (ver [contrato e testes](INTEGRACAO-LOGIN.md)).
- Renovação de sessão distingue credencial recusada de indisponibilidade da API; cinco cenários em `tests/e2e/sessao.spec.ts` verificam cookies, recuperação do carrinho e acesso administrativo com um proxy local de falhas (ver [contrato e testes](INTEGRACAO-SESSAO.md)).
- Seleção e acompanhamento de pagamentos com recuperação de falhas, prazo da API, bloqueio após vencimento, aprovação tardia e confirmação de estorno; três cenários em `tests/e2e/pagamento.spec.ts` usam API real e MySQL temporário, com gateway simulado (ver [contrato e execução](INTEGRACAO-PAGAMENTOS.md)).
- Recuperação de senha com validação, tratamento de links incompletos/vencidos/usados, encerramento da sessão local após troca e retorno seguro ao login; três cenários em `tests/e2e/recuperacao-senha.spec.ts` usam API real e contas temporárias, sem e-mail externo (ver [contrato e execução](INTEGRACAO-RECUPERACAO-SENHA.md)).
- Perfil com validação de CPF/data, edição preservada durante reconsultas, limpeza de campos opcionais e sincronização com a sessão; três cenários em `tests/e2e/perfil.spec.ts`. A conexão MySQL foi corrigida para preservar datas civis, com regressão HTTP/MySQL no fuso de São Paulo (ver [contrato e execução](INTEGRACAO-PERFIL.md)).
- Cupons com carregamento/erro/lista vazia, validade sem conversão de fuso, valor confirmado pela API e troca de cashback somente após aplicação válida; quatro cenários em `tests/e2e/cupons.spec.ts`, incluindo cupom privado e uso único (ver [contrato e execução](INTEGRACAO-CUPONS.md)).
- Benefícios com extrato de cashback, prêmios disponíveis/entregues, atualização manual e tratamento de saldo negativo; três cenários em `tests/e2e/beneficios.spec.ts` percorrem crédito, uso, estorno, cancelamento e entrega administrativa (ver [contrato e execução](INTEGRACAO-BENEFICIOS.md)).
- Agendamentos administrativos com consulta de horários, remarcação, observação e recuperação de falhas; três cenários em `tests/e2e/agendamento-admin.spec.ts` verificam atualização no painel e no cliente, transferência de reserva e preservação do pedido quando falta estoque (ver [contrato e execução](INTEGRACAO-AGENDAMENTO-ADMIN.md)).
- Clientes administrativos com validação, normalização, limpeza persistida de campos opcionais e edição preservada após falhas; três cenários em `tests/e2e/clientes-admin.spec.ts`, incluindo conflito real de cadastro e consulta independente dos indicadores (ver [contrato e execução](INTEGRACAO-CLIENTES-ADMIN.md)).
- Cardápio conectado do cadastro administrativo ao pedido do cliente, incluindo imagem, preço, categoria ativa/rascunho, estoque por data e composição. Quatro cenários em `tests/e2e/cardapio.spec.ts` verificam atualização em sessões separadas, concorrência, resposta perdida e baixa de estoque (ver [contrato e execução](INTEGRACAO-CARDAPIO.md)).
- Operação administrativa com confirmação de pagamento no recebimento, conclusão pelo cartão, bloqueio de comandos durante envio, recuperação de resposta perdida e envio sequencial em lote. Cinco cenários em `tests/e2e/operacao.spec.ts` verificam painel, cliente, estoque e benefícios (ver [contrato e execução](INTEGRACAO-OPERACAO.md)).
- `npm run test:integration` executa os 49 cenários em bancos/servidores temporários e registra commits, hashes de lockfiles e migrations em um artefato local.
- Compose integrado e `npm run test:docker` aprovados localmente e no CI em volume novo, migrations, login, controle de origem, reinício e recuperação do banco. O proxy usa a origem pública configurada; os testes de endereços e cardápio escolhem datas futuras para não depender do horário da execução.
- Sondas `/health/live` e `/health/ready` implementadas e testadas, sem dados internos.
- Comandos, versões e configuração do CI documentados em [validação reproduzível](VALIDACAO-INTEGRACAO.md).

Verificado: instalação limpa reproduzível e testes críticos executados automaticamente. A exigência desses checks para merge depende da proteção remota da branch; nenhum merge ou deploy foi feito nesta etapa.

## 3. Homologação das integrações externas

O usuário confirmou em 19/09 que ainda não existe ambiente com credenciais de teste. O [roteiro de preparação](HOMOLOGACAO-INTEGRACOES.md) relaciona as configurações e os contratos implementados; a execução externa permanece pendente.

| Integração | Insumos necessários | Cenários a validar |
|---|---|---|
| Mercado Pago | Credenciais e comprador de teste; URL de webhook acessível | Aprovação, recusa, vencimento, repetição de webhook, aprovação tardia e confirmação de estorno |
| WhatsApp | Gateway escolhido, contrato e contato de teste | Entrega do código, indisponibilidade, limite de tentativas e uso único |
| E-mail | SMTP e caixa de teste | Recebimento do link, expiração, uso único e revogação de sessões |
| Google | Client ID, secret e callback de homologação | Login, cancelamento, token inválido e conflito com conta existente |

Registrar separadamente resultados de testes de contrato e resultados obtidos com os provedores. Credenciais devem ficar nas configurações locais ou no gerenciador de segredos do ambiente, fora do Git e dos documentos.

Conclusão: evidências de cada fluxo externo habilitado, sem apresentar simulações locais como homologação do provedor. Publicação de ambiente e envio externo serão tratados na etapa de execução correspondente.

## 4. Dados e preparação da operação

Avanço em 20/09: ensaio de backup/restauração aprovado localmente e no CI em banco descartável, com dois pedidos, pagamento presencial dividido, estoque, cashback e idempotência. O [procedimento de backup e atualização](BACKUP-ATUALIZACAO.md) documenta a execução e a recuperação. Isso não conclui a preparação operacional: hospedagem, dados reais, retenção dos backups e eventual legado ainda precisam ser definidos.

### Se a operação começar com banco novo

- Cadastrar catálogo, preços, estoque, horários, contatos e administrador reais.
- Conferir a área de entrega aprovada e o fluxo de recebimento com a equipe.
- Evitar dados demonstrativos no ambiente operacional.

### Se houver dados antigos a preservar

- Trabalhar sobre uma exportação ou cópia isolada da base antiga.
- Mapear clientes, endereços, produtos, pedidos, cupons, saldos e credenciais de acesso compatíveis.
- Preparar importação repetível, com relatório de registros aceitos, rejeitados e divergentes.
- Conferir quantidades, valores, vínculos e saldos antes de qualquer troca de base.

### Preparação comum

- Definir hospedagem, domínio, configurações e responsável pela operação.
- Backup/restauração ensaiados localmente em dados descartáveis; repetir no ambiente e no volume operacional definidos.
- Sequência de atualização e recuperação documentada. Reverter o código não reverte alterações no banco.
- Ensaiar um ciclo operacional: pedido, pagamento, produção, entrega, cancelamento e estorno quando aplicável.

Conclusão: ambiente de homologação validado e procedimento revisável para a entrada em operação. A base antiga não recebe as migrations iniciais diretamente.

## 5. Melhorias posteriores

- **Relatórios por período e exportação:** permitir conferência de vendas, descontos, taxas e estornos. Totais devem corresponder aos pedidos e pagamentos persistidos.
- **Caixa:** definir abertura, fechamento, sangrias e diferenças antes de implementar um controle financeiro completo.
- **Entregadores:** definir responsáveis e estados de despacho/entrega se houver necessidade de acompanhamento operacional.
- **Mídia do catálogo:** avaliar armazenamento separado quando o volume de imagens justificar.

Essas melhorias ampliam o escopo. Não são requisitos para repetir a validação local já concluída.

## Próxima unidade de trabalho

A validação operacional entre cliente e administrativo foi implementada: pagamento no recebimento, avanço até a conclusão, cancelamento, recuperação de falhas e envio em lote estão cobertos. O teste de cardápio também distingue pedidos para hoje dos agendamentos futuros.

Avançar para o item 3: definir o gateway de WhatsApp, preparar o ambiente e as contas de teste e executar o roteiro de homologação. O usuário confirmou que esse ambiente ainda não existe. As branches de integração estão disponíveis para revisão; a tentativa de abrir PR pelo conector GitHub foi recusada por falta de permissão (`403`), sem impedir o envio das branches nem os checks. Proteção da branch, merge e deploy não foram alterados.
