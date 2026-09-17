# Plano das próximas etapas

Atualizado em 17/09/2026. O item 1 foi implementado e validado localmente. Os itens 2 a 5 permanecem planejados.

## Ponto de partida

- Loja, painel e PDV integrados à API e ao banco local.
- Entrega confirmada: R$ 10,00 exclusivamente para o CEP 88650-000.
- Pagamento online: prazo confirmado de 15 minutos; verificação periódica a cada 30 segundos, com conciliação antes de liberar a reserva.
- Aprovação após cancelamento sinalizada como estorno pendente; devolução financeira executada no provedor e confirmada por webhook.
- Última validação: 27 testes de integração, builds e lint aprovados. Testes externos utilizaram contratos simulados, sem cobranças reais.
- Docker, credenciais externas e importação da base antiga continuam pendentes de validação ou definição.

## Ordem de execução

| Ordem | Entrega | Dependência | Critério de conclusão |
|---|---|---|---|
| 1 — concluído | Recuperação de falhas de conciliação e avisos no painel | Código e banco local existentes | Falhas ficam visíveis, a fila continua avançando e novas tentativas não duplicam efeitos |
| 2 | Verificações automatizadas e execução reproduzível | Ambiente de CI e Docker disponíveis para validação | Uma instalação limpa aplica migrations, sobe os serviços e passa nos testes |
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

- Organizar as alterações dos dois repositórios em versões correspondentes, com referência entre frontend, backend e migrations.
- Configurar CI para lint, build e testes HTTP/MySQL em banco temporário exclusivo.
- Transformar os cenários de navegador já utilizados em testes reproduzíveis: login, carrinho, checkout presencial, entrega, expiração e aviso de estorno.
- Validar Docker Compose desde um volume novo, incluindo aplicação de migrations e inicialização da API.
- Adicionar verificação de disponibilidade da API e do banco, sem retornar dados internos.
- Documentar os comandos que passaram e as versões efetivamente usadas.

Conclusão: instalação limpa reproduzível, testes críticos executados automaticamente e falhas impedindo a promoção da versão.

## 3. Homologação das integrações externas

| Integração | Insumos necessários | Cenários a validar |
|---|---|---|
| Mercado Pago | Credenciais e comprador de teste; URL de webhook acessível | Aprovação, recusa, vencimento, repetição de webhook, aprovação tardia e confirmação de estorno |
| WhatsApp | Gateway escolhido, contrato e contato de teste | Entrega do código, indisponibilidade, limite de tentativas e uso único |
| E-mail | SMTP e caixa de teste | Recebimento do link, expiração, uso único e revogação de sessões |
| Google | Client ID, secret e callback de homologação | Login, cancelamento, token inválido e conflito com conta existente |

Registrar separadamente resultados de testes de contrato e resultados obtidos com os provedores. Credenciais devem ficar nas configurações locais ou no gerenciador de segredos do ambiente, fora do Git e dos documentos.

Conclusão: evidências de cada fluxo externo habilitado, sem apresentar simulações locais como homologação do provedor. Publicação de ambiente e envio externo serão tratados na etapa de execução correspondente.

## 4. Dados e preparação da operação

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
- Ensaiar backup e restauração; verificar os dados restaurados.
- Documentar a sequência de atualização e a recuperação em caso de falha. Não presumir que reverter o código reverta alterações no banco.
- Ensaiar um ciclo operacional: pedido, pagamento, produção, entrega, cancelamento e estorno quando aplicável.

Conclusão: ambiente de homologação validado e procedimento revisável para a entrada em operação. A base antiga não recebe as migrations iniciais diretamente.

## 5. Melhorias posteriores

- **Relatórios por período e exportação:** permitir conferência de vendas, descontos, taxas e estornos. Totais devem corresponder aos pedidos e pagamentos persistidos.
- **Caixa:** definir abertura, fechamento, sangrias e diferenças antes de implementar um controle financeiro completo.
- **Entregadores:** definir responsáveis e estados de despacho/entrega se houver necessidade de acompanhamento operacional.
- **Mídia do catálogo:** avaliar armazenamento separado quando o volume de imagens justificar.

Essas melhorias ampliam o escopo. Não são requisitos para repetir a validação local já concluída.

## Próxima unidade de trabalho

Prosseguir com o item 2: tornar os testes de navegador reproduzíveis no repositório, configurar as verificações automatizadas e validar uma instalação limpa. O Docker precisa estar disponível para concluir a validação dos containers; isso não impede a preparação dos demais checks.
