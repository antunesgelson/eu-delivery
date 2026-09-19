# Seleção e acompanhamento de pagamentos

A seleção consulta `GET /pagamento/metodos` pelo cliente HTTP centralizado. As opções só ficam disponíveis após a resposta da API; falhas oferecem nova tentativa. A finalização continua usando o carrinho e o contrato de checkout existentes.

O acompanhamento consulta `GET /pedido/:id` e abre o checkout com `POST /pagamento/:id/checkout`. A interface mostra o prazo enviado em `pagamentoExpiraEm`, no horário de Brasília, e os estados `pending`, `paid`, `refund_pending` e `refunded`.

- Ao vencer o prazo, o botão de pagamento fica bloqueado. A API concilia o pagamento antes de cancelar e devolver a reserva; o relógio do navegador não cancela o pedido.
- Aprovação após cancelamento mostra estorno pendente e mantém o pedido cancelado. A confirmação de estorno vem do webhook. A aplicação não solicita devolução financeira automaticamente.
- Falha ao atualizar preserva o último resumo e bloqueia o botão de pagamento até uma consulta bem-sucedida.
- Falha ao abrir o provedor permite tentar novamente no mesmo pedido. Após erro, a interface consulta novamente o estado, pois o pedido pode ter sido pago ou expirado durante a tentativa.

## Testes reproduzíveis

`tests/e2e/pagamento.spec.ts` contém três cenários de navegador:

1. Recuperação da consulta de métodos, finalização, vencimento com falha de conciliação, preservação da reserva, cancelamento após recuperação, aprovação tardia e confirmação de estorno.
2. Falha do provedor ao abrir o checkout, nova tentativa no mesmo pedido e confirmação de pagamento.
3. Falha na atualização do pedido, preservação do resumo e recuperação do botão de pagamento.

A fixture `tests/fixtures/payment-app.ts` inicia um frontend separado e usa `test/browser-payment-harness.cjs` do backend. O harness sobe a aplicação Nest real, aplica migrations em um banco MySQL temporário e substitui somente o gateway de pagamento. Os eventos percorrem o endpoint real de webhook com assinatura HMAC. A navegação para o checkout externo é interceptada pelo teste.

Pré-requisitos: dependências dos dois projetos instaladas, Chromium do Playwright disponível, MySQL local e usuário com permissão para criar e remover bancos de teste. O backend deve estar compilado:

```sh
# No backend
npm run build

# No frontend
npm run build
npm run test:e2e -- pagamento.spec.ts
```

Por padrão, o backend é localizado em `../eu-delivery-back`, e suas configurações MySQL são lidas de `.env.codex.local`. `E2E_BACKEND_DIR` permite indicar outro diretório; `E2E_BACKEND_ENV` permite indicar outro arquivo de ambiente (prefira caminho absoluto). Nunca versione credenciais.

Não é necessário subir manualmente os servidores nem fornecer uma conta administrativa para estes três cenários. O harness cria clientes e catálogo próprios, aceita apenas MySQL local e remove o banco `zanini_browser_*` que criou ao encerrar. Nenhuma migration nova foi necessária.

## Validação local — 18/09/2026

Os três cenários passaram com frontend compilado, API Nest e MySQL reais. A regressão completa também passou: 21 testes de navegador em dois minutos, cobrindo endereços, histórico, login, PDV, pagamentos e sessão. Builds dos dois projetos, lint e tipos do frontend passaram. O provedor foi simulado: os testes não fizeram cobranças e não substituem a homologação com Mercado Pago.
