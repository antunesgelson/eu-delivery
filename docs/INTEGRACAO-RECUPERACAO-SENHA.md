# Recuperação de senha

A página `/signin/redefinir` usa o cliente HTTP centralizado e React Query para solicitar instruções em `POST /auth/esqueci-senha` e trocar a senha em `POST /auth/redefinir-senha`.

- O formulário valida e-mail, senha de 12 a 128 caracteres e confirmação com React Hook Form/Zod. Falhas de rede ou indisponibilidade preservam os campos para nova tentativa. Durante o envio, campos e botão ficam bloqueados.
- A solicitação exibe a mesma confirmação para e-mails cadastrados e desconhecidos. Tokens de desenvolvimento não são mostrados na interface.
- Links incompletos são recusados antes do envio. Links vencidos ou usados, recusados pela API, oferecem a opção de solicitar novas instruções.
- Após a troca, a API revoga as sessões e consome os desafios da conta. O proxy Next limpa os cookies HttpOnly do navegador atual e a interface limpa o estado autenticado. Uma falha na troca preserva os cookies.
- O link “Esqueci minha senha” conserva o destino administrativo. O retorno ao login aceita somente caminhos locais, pelo helper `destinoSeguro`; links recebidos sem destino retornam ao formulário de login administrativo.

Nenhuma rota protegida nova, migration ou mudança no contrato produtivo do backend foi necessária. A recuperação permanece pública e sujeita aos limites de requisições da API.

## Testes

`tests/e2e/recuperacao-senha.spec.ts` usa a infraestrutura temporária já existente em `tests/fixtures/payment-app.ts` e `test/browser-payment-harness.cjs` do backend. O harness agora permite criar uma conta administrativa de teste e vencer um desafio de senha, exclusivamente no banco temporário criado pela suíte.

Os três cenários verificam:

1. Validação de e-mail, recuperação de falha de rede, confirmação genérica para conta existente/desconhecida, retorno ao destino original e recusa de link vencido.
2. Validação/confirmação da senha, indisponibilidade com preservação de campos/cookies, troca bem-sucedida, revogação de acesso e refresh em outro contexto de navegador, recusa do link usado e da senha antiga e login com a nova senha.
3. Links incompletos sem envio à API e solicitação de outro link com descarte de retorno externo.

Com dependências instaladas nos dois projetos, Chromium do Playwright e MySQL local disponível:

```sh
# No backend
npm run build

# No frontend
npm run build
npm run test:e2e -- recuperacao-senha.spec.ts
```

As configurações do banco temporário são as mesmas dos [testes de pagamento](INTEGRACAO-PAGAMENTOS.md). Não são necessárias credenciais administrativas existentes. A API roda com `AUTH_DELIVERY_MODE=development`, sem envio externo de e-mails. O fluxo SMTP ainda depende de homologação com o provedor.

## Validação local — 18/09/2026

Build, lint e tipos do frontend passaram. A regressão de login, sessão, pagamentos e recuperação de senha passou com 15 testes de navegador em 1,8 minuto. O harness do backend passou na verificação de sintaxe; suas alterações são exclusivas dos testes.
