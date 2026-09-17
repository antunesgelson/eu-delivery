# Diagnóstico e implementação

## Produto e diagnóstico inicial

Loja de assados com cardápio, carrinho, retirada agendada e painel de operação/PDV. O frontend usava catálogo e benefícios locais; dashboard, histórico, agendamentos e relatórios continham pedidos e clientes gerados em memória. O gestor de catálogo/cupons usava localStorage. O acesso administrativo aceitava um token criado no navegador.

Havia uma API NestJS/TypeORM/MySQL em `eu-delivery-back`. O checkout estava incompleto, a validação de código não garantia vínculo ao telefone/consumo único, a sincronização automática de schema estava habilitada e a integração Mercado Pago continha lógica de outro produto. A implementação mantém NestJS, TypeORM, MySQL e os nomes principais de rotas, reorganizando os módulos e os contratos inseguros/incompletos. Os SDKs e módulos externos sem uso foram retirados.

## Mapa das telas

| Tela/fluxo | Entidades | API | Acesso |
|---|---|---|---|
| Login/recuperação | usuário, sessão, desafio | `/auth/*` | público com limites de tentativas; sessão para logout/me |
| Cardápio/detalhes | categoria, produto, estoque | `/categoria/lista/detalhes`, `/produto/:id` | leitura pública |
| Perfil/endereços | usuário, endereço | `/usuario`, `/endereco/*` | somente titular |
| Carrinho | pedido em rascunho, itens | `/pedido/carrinho`, `/pedido/carrinho/item/:id` | titular |
| Checkout | pedido, estoque, cupom, movimentos | `/pedido/finalizar`, `/pedido/horarios/:data` | titular; horários públicos |
| Histórico/acompanhamento | pedido, snapshots | `/pedido`, `/pedido/:id` | titular ou administrador |
| Cashback/fidelidade | usuário, movimentos, prêmio | `/usuario/beneficios` | titular |
| Catálogo administrativo | catálogo versionado, produtos/estoque | `/admin/catalogo` | administrador |
| Cupons | cupom, uso do cupom | `/cupom`, `/cupom/publicos` | escrita administrativa; leitura pública filtrada |
| Dashboard/agendamento | pedido, auditoria | `/admin/pedidos`, `/:id/status`, `/:id/pagamento`, `/:id` | administrador |
| PDV/rascunhos | pedido, cliente, rascunho | `/admin/pdv`, `/admin/pdv/rascunhos`, `/admin/clientes` | administrador; rascunhos por administrador |
| Relatórios/clientes | pedido, itens, cliente, benefícios | `/admin/relatorios`, `/admin/clientes`, `/:id/beneficios` | administrador |
| Configuração | configuração, auditoria | `/configuracao` | leitura pública de campos permitidos; escrita administrativa |
| Pagamento online | pagamento, pedido, auditoria | `/pagamento/:id/checkout`, `/pagamento/mercadopago/webhook` | titular; assinatura e consulta ao provedor no webhook |

## Regras e decisões

Confirmadas no código original: retirada aos sábados/domingos, janelas de 30 minutos entre 11h30 e 14h, mínimo R$ 35, estoque por dia/data, produtos compostos, meio frango consome meia unidade de frango, cashback de 3%, incompatibilidade de cupom com cashback e prêmio a cada seis pedidos.

Confirmada pelo usuário durante a implementação: **entrega com taxa fixa de R$ 10,00, CEP 88650-000**. O servidor recusa outros CEPs; a configuração administrativa pode alterar a regra posteriormente. A taxa aplicada é gravada no pedido e não muda quando a configuração é editada.

Decisões documentadas:

- Loja única; isolamento por cliente e perfil administrativo, sem organizações fictícias.
- Preços em centavos, snapshots dos itens, horário de serviço em America/Sao_Paulo. Sem alteração retroativa de preços.
- Finalizar reserva estoque/cupom/cashback numa transação. Idempotency-Key evita duplicidade. Catálogo usa versão para detectar edições concorrentes.
- Rascunhos PDV não reservam estoque e são recalculados ao gerar o pedido.
- Ajustes manuais de preço são exclusivos do administrador e ficam na auditoria.
- Pagamento presencial depende de confirmação administrativa. Online depende do provedor.
- Cashback só é creditado depois de pagamento confirmado e conclusão. **Sem expiração automática**: o código original só continha uma data fictícia, sem regra de prazo aprovada. Um estorno pode deixar saldo negativo se o crédito já tiver sido gasto; novos usos ficam bloqueados até compensação.
- Fidelidade conta pedidos concluídos. Resgate é registrado pelo administrador ao entregar o prêmio. Estornos invalidam prêmios ainda não elegíveis; entrega física já ocorrida não é desfeita automaticamente.
- Depois do início da produção, somente observações podem ser editadas. Trocar itens de um pedido finalizado exige cancelar e criar outro pedido, preservando o histórico.
- O login Google não vincula automaticamente uma conta existente apenas pela igualdade de e-mail.
- Integrações sem credenciais retornam indisponibilidade; o modo de desenvolvimento é identificado explicitamente.

## Segurança e validação

JWT curto validado com issuer/audience/algoritmo e sessão real no banco, refresh opaco armazenado como hash e rotacionado, logout revoga sessão. Senhas usam scrypt. OTP tem hash, expiração, limite de tentativas, vínculo ao telefone e consumo único. Recuperação revoga sessões anteriores. DTOs rejeitam campos extras; CPF, CEP, dinheiro, quantidades, transições e limites são validados no servidor.

O navegador nunca recebe o refresh token via JSON. O proxy Next usa cookies HttpOnly/SameSite, valida Origin nas escritas e encaminha apenas rotas permitidas. A API tem autorização independente por recurso e perfil. Configurações públicas não incluem credenciais. Logs de erro registram tipo e identificador, sem senha/token. Credenciais removidas do código legado precisam ser rotacionadas no provedor se ainda estiverem em uso.

As atualizações para Next.js 15 e NestJS 11 removeram vulnerabilidades encontradas no levantamento. Overrides de PostCSS, Multer e UUID mantêm patches compatíveis nas dependências transitivas. Reavalie `npm audit` periodicamente.

## Validação e limites

Build e lint são executados nos dois projetos. A suíte HTTP/MySQL cria um banco temporário local `zanini_test_*`, aplica migrations e remove somente esse banco ao terminar. Exercita auth, isolamento, concorrência, idempotência, composição, cupons, cashback, PDV, entrega e webhooks. O provedor de pagamento é substituído por uma implementação de contrato nos testes; não há cobrança.

A validação de navegador usa ambiente isolado, login real da API, carrinho após recarga, cadastro de endereço, entrega, agendamento, pagamento presencial, envio/histórico e telas administrativas. Docker foi disponibilizado, mas não executado neste ambiente porque o CLI não estava instalado.

### Resultado da verificação local — 16/09/2026

- Build e lint aprovados nos dois repositórios.
- 27 testes de integração HTTP/MySQL aprovados, usando `DOTENV_CONFIG_PATH=.env.codex.local npm run test:e2e` no backend.
- `npm audit --omit=dev`: zero vulnerabilidades reportadas nos dois projetos.
- Pedido local de R$ 75,00, incluindo R$ 10,00 de entrega, passou por produção, pronto, pagamento presencial e conclusão pelo painel. Histórico persistido; cashback de R$ 2,25 e um pedido de fidelidade conferidos na API e no navegador.
- Salvamento de configurações, edição de observação/agendamento, catálogo, PDV e relatórios carregaram sem exceções JavaScript nos fluxos verificados.
- Arquivos de ambiente anteriores preservados. O ambiente de teste utiliza exclusivamente banco local; integrações externas não foram acionadas.

Não há migração automática de dados antigos: as tabelas do legado têm contratos diferentes e precisariam de uma amostra/exportação para mapear corretamente clientes, senhas, imagens e pedidos. As migrations iniciais falham se houver tabelas conflitantes; use um banco novo. Não se deve apontar esse conjunto de migrations diretamente para a base legada.

## Referências técnicas

- [Migração Next.js 15](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Guia de migração NestJS](https://docs.nestjs.com/migration-guide)
- [Webhooks do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications)

## Expiração implementada

Prazo confirmado: **15 minutos** para pedidos online novos. O checkout exibe o vencimento e bloqueia novas tentativas após o prazo. A API verifica reservas a cada 30 segundos, consulta pagamentos aprovados antes de cancelar e preserva estoque se o provedor falhar. A transação devolve estoque, cupom e cashback somente uma vez. Pedidos presenciais e antigos sem prazo permanecem inalterados.

Aprovação após cancelamento gera um alerta de estorno pendente no painel e uma mensagem para o cliente. O pedido continua cancelado. O estorno deve ser feito no provedor e é confirmado por webhook. Foram adicionados seis testes de integração para essas regras; nenhuma cobrança ou devolução real foi executada.

## Recuperação de conciliação implementada

Fila e tentativas persistidas, intervalos progressivos de 30 segundos a 10 minutos, retomada após interrupção e até quatro consultas simultâneas. A chamada externa ocorre sem bloquear o catálogo; antes de liberar estoque, o servidor confere novamente pedido, pagamento e responsável pela execução. Falhas não impedem pedidos seguintes de avançar.

O painel mostra duração, motivo, número de tentativas e próxima consulta. Administradores podem solicitar nova verificação uma vez por minuto por pedido; clientes não acessam esses endpoints. Eventos ficam na auditoria sem dados brutos do provedor. A migration `1789570000000-Conciliacao` foi aplicada somente no banco local.

Sete testes adicionados, totalizando 27, cobrem concorrência, recuperação e fila com mais de 50 falhas. Foram verificados no navegador a paginação, o agendamento manual, o tratamento de falha de carregamento e a remoção do aviso após resolução, usando cenários de interface controlados.

## Expansões sugeridas

- Importador do banco legado com relatório de reconciliação, antes de trocar uma instalação existente.
- Alertas externos sobre indisponibilidade prolongada do provedor, além do acompanhamento já existente no painel.
- Entregadores e acompanhamento da rota, se o volume de delivery exigir.
- Exportação de relatórios por período e conciliação financeira do caixa.
