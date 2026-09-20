# Assados Zanini — loja e painel

Frontend Next.js 15, React, React Query, Tailwind, React Hook Form e Zod, integrado à API NestJS em `../eu-delivery-back`.

## Execução local

Requer Node.js 22.13+ e npm. Primeiro inicie o banco e a API seguindo o README do backend.

```sh
npm ci
cp -n .env.example .env.local
npm run dev -- -p 4051
```

Abra http://localhost:4051. `BACKEND_URL` é uma variável **do servidor Next**, com padrão `http://127.0.0.1:4052`. As chamadas do navegador usam `/api/backend`; tokens ficam em cookies HttpOnly. Não coloque segredos em `NEXT_PUBLIC_*`.

```sh
npm run lint
npm run build
npm start
```

O desenvolvimento usa `.next` e o build de produção usa `.next-production`, permitindo executar a compilação sem disputar os arquivos do servidor de desenvolvimento.

Para usar o ambiente isolado preparado durante a implementação, no backend execute `npm run start:local`. O arquivo `.env.codex.local`, ignorado pelo Git, aponta para o banco local de desenvolvimento e contém as credenciais administrativas locais. As configurações anteriores de `.env` foram preservadas.

## Fluxos conectados

- Cardápio e detalhes: catálogo persistido, ingredientes/adicionais validados pela API.
- Login: senha administrativa, código de WhatsApp e Google quando configurados; refresh, logout e recuperação de senha.
- Perfil e endereços: dados do próprio cliente.
- Carrinho: persistência por cliente, preços recalculados no checkout, cupons e saldo real.
- Retirada e entrega: horários do servidor; entrega de **R$ 10,00 exclusivamente para o CEP 88650-000**, conforme regra confirmada.
- Pedidos: finalização idempotente, histórico com preços gravados e acompanhamento periódico. Pagamento online tem prazo de 15 minutos, com liberação automática de reservas após conciliação; o painel sinaliza pagamentos recebidos após cancelamento.
- Painel: produção, cancelamento, pagamento presencial, conclusão, edição de observação/agendamento e aceitação automática. Pendências de conciliação mostram motivo, tentativas e próxima consulta, com reprocessamento administrativo limitado.
- PDV: clientes, estoque, ajustes administrativos, pagamento dividido e rascunhos salvos no servidor.
- Gestão: catálogo, estoque por data, cupons, clientes, relatórios, fidelidade e configurações.

As alterações administrativas exigem autorização também no backend. O carrinho exige login. Pagamento online só aparece quando todas as variáveis do provedor estiverem configuradas.

## Integrações opcionais

- Google: configure o client ID e secret no servidor Next e o mesmo client ID na API. Callback: `/api/auth/google/callback`.
- WhatsApp: o backend envia o código pelo gateway configurado. Em `AUTH_DELIVERY_MODE=development`, o código aparece explicitamente como código de desenvolvimento; nenhuma mensagem é enviada.
- Mercado Pago: confirmação exclusivamente por webhook assinado e consulta ao provedor. Sem credenciais, use pagamento no recebimento para desenvolvimento.
- Cadastro de endereços funciona manualmente sem credenciais de mapas. Login Google não cria eventos no calendário.

## Documentação

- [Diagnóstico, decisões e contratos](docs/IMPLEMENTACAO-BACKEND.md)
- [Plano das próximas etapas](docs/PLANO-PROXIMAS-ETAPAS.md)
- [Validação isolada, CI e Docker](docs/VALIDACAO-INTEGRACAO.md)
- [Preparação da homologação externa](docs/HOMOLOGACAO-INTEGRACOES.md)
- [API, migrations, Docker e testes](../eu-delivery-back/README.md)
- Swagger da API: http://localhost:4052/docs

## Limitações operacionais

As migrations inicializam um banco novo. Dados de uma instalação antiga exigem importação revisada; esta implementação não foi aplicada a banco de produção. Integrações externas estão preparadas e foram verificadas por testes de contrato, sem envio de mensagens nem cobranças reais. Relatórios apresentam os últimos 12 meses e os 50 itens com maior volume, além de listagens paginadas de pedidos/clientes.
