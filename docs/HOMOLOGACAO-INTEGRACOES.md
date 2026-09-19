# Preparação da homologação externa

Em 19/09/2026, foi confirmado que ainda não existe ambiente com credenciais de teste. Os testes automatizados existentes usam contratos simulados; não comprovam entrega de mensagens nem processamento pelo provedor.

## Configuração a preparar

Parta dos arquivos `.env.example` dos dois repositórios e mantenha os valores preenchidos fora do Git. Utilize banco e contas exclusivos de homologação. O Compose atual é local e fixa autenticação de desenvolvimento; ele não é um ambiente de homologação externa pronto.

| Componente | Variáveis no servidor | Contrato implementado |
|---|---|---|
| Backend | `JWT_SECRET`, `MYSQL_*`, `FRONTEND_URL`, `CORS_ORIGINS` | API e banco separados da operação; origem do frontend nas URLs e no CORS |
| Frontend | `BACKEND_URL`, `FRONTEND_URL` | Proxy para a API e origem pública do frontend |
| Mercado Pago, backend | `MERCADO_PAGO_TOKEN`, `MERCADO_PAGO_COLLECTOR_ID`, `MERCADO_PAGO_WEBHOOK_SECRET`, `MERCADO_PAGO_NOTIFICATION_URL`, `MERCADO_PAGO_SANDBOX=true` | Webhook na API: `/pagamento/mercadopago/webhook`; os quatro primeiros campos habilitam a opção online |
| WhatsApp, backend | `WHATSAPP_GATEWAY_URL`, `WHATSAPP_GATEWAY_TOKEN` | POST JSON com `numero` terminado em `@c.us` e `mensagem`, autenticação Bearer; exige gateway compatível ou adaptador |
| E-mail, backend | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Envia o link para `/signin/redefinir` na origem `FRONTEND_URL` |
| Google | `GOOGLE_CLIENT_ID` nos dois projetos; `GOOGLE_CLIENT_SECRET` somente no frontend servidor | Callback: `<FRONTEND_URL>/api/auth/google/callback` |

Para entrega real de WhatsApp/e-mail, `AUTH_DELIVERY_MODE` no backend deve sair de `development` (por exemplo, `provider`). O modo `development` devolve códigos/tokens de teste na resposta e não envia mensagens. Use somente destinatários de teste definidos para a execução.

As rotas acima descrevem o código atual. A escolha do gateway de WhatsApp e a compatibilidade das contas de pagamento ainda precisam ser verificadas com os respectivos provedores. Marcar `MERCADO_PAGO_SANDBOX=true` não substitui credenciais e contas de teste.

## Roteiro de execução

1. Definir URLs do frontend/API, conta compradora de teste, telefone e caixa de e-mail de teste.
2. Configurar os servidores e conferir `/health/ready`; aplicar migrations no banco exclusivo.
3. Mercado Pago: criar pedido online, aprovar/recusar, aguardar vencimento, repetir webhook e verificar aprovação tardia/estorno. Conferir estado do pedido, reserva, estoque e benefícios após cada cenário.
4. WhatsApp: receber e usar o código; verificar reenvio, vencimento, reutilização e recuperação após indisponibilidade do gateway.
5. E-mail: receber o link, redefinir senha, verificar vencimento/reutilização e revogação das sessões anteriores.
6. Google, se habilitado: login, cancelamento, token recusado e conflito com conta existente.

Para cada execução, registrar data, commits dos dois repositórios, cenário, resultado esperado/obtido e identificadores de teste que permitam conferir o provedor. Não incluir tokens, códigos de acesso, links de redefinição ou dados pessoais nas evidências versionadas. Enquanto algum cenário não tiver sido executado com o provedor, manter seu resultado como pendente.
