# Integração do PDV

O PDV consulta clientes por nome, telefone (com ou sem máscara) ou e-mail. O cadastro usa validação de nome e telefone; quando o telefone já existe, seleciona o cliente existente. O pedido envia o ID escolhido, sem cadastrar novamente na finalização.

O saldo de cashback vem de `/admin/clientes/:id/beneficios`; endereços salvos vêm de `/admin/clientes/:id/enderecos`. Ao trocar de cliente, endereço e desconto são limpos. Rascunhos novos preservam o ID do cliente e o ajuste aplicado. Rascunhos antigos continuam abrindo, mas exigem selecionar o cadastro antes da finalização. O servidor confirma novamente o cliente ao gerar o pedido.

Cupom aceita texto e mostra o total antes do desconto, que é calculado pela API. Percentuais acompanham mudanças na quantidade. Cancelar a edição do ajuste preserva o valor anteriormente aplicado. Cashback acima do saldo ou do subtotal é recusado; a API continua validando o saldo na transação.

Todos os canais do PDV, incluindo balcão, exigem um cliente identificado conforme o contrato da API. As novas rotas de consulta são exclusivas de administradores e passam pelo proxy autenticado já existente.

## Verificação automatizada

Instale o navegador com `npx playwright install chromium`. Suba o frontend na porta 4051 e o backend na porta 4052, com migrations e seed aplicados em um banco local de desenvolvimento. A API deve usar `AUTH_DELIVERY_MODE=development`, pois a preparação consulta o código de teste para cadastrar um endereço sem enviar mensagens externas.

Defina `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD` com as credenciais administrativas desse ambiente e execute:

```sh
npm run build
npm run test:e2e
```

O build é necessário para as suítes de sessão e pagamento, que iniciam frontends separados em portas locais livres. A suíte completa também exige o backend compilado (`npm run build` no backend) e permissão MySQL para criar/remover o banco temporário de pagamentos; veja [configuração dos testes de pagamento](INTEGRACAO-PAGAMENTOS.md). Para rodar somente os cinco cenários do PDV, use `npm run test:e2e -- pdv.spec.ts`.

`E2E_BASE_URL` e `E2E_BACKEND_URL` permitem mudar as portas; a suíte recusa hosts remotos. Não coloque credenciais no Git. O cenário de pedido usa o produto demonstrativo “Frango assado recheado” (R$ 65), entrega de R$ 10 para CEP 88650-000 e horários aos fins de semana.

A suíte contém cinco cenários: pedido com cliente/endereço/cupom e rascunho após recarga; cadastro com validação; ajustes e limite de cashback; recuperação de falha na consulta; e rascunho que preserva o cancelamento da edição do cupom. Usa a API real, exceto pela falha 503 simulada no cenário de recuperação.

Os testes criam clientes identificados com `PDV E2E`, endereço, cupom, rascunho e pedido exclusivamente locais. Ao finalizar, cancelam os pedidos criados, removem os rascunhos e arquivam os cupons. Clientes e histórico de auditoria permanecem para rastreabilidade; use uma base de desenvolvimento descartável.

## Resultado local — 17/09/2026

- Cinco testes de navegador aprovados, com frontend e API reais.
- 28 testes HTTP/MySQL do backend aprovados, incluindo autorização das consultas de cliente/endereço e busca por telefone formatado.
- Builds e lint aprovados nos dois projetos.
- Pedido de R$ 65,00 com desconto de 10% e entrega de R$ 10,00 persistido com total de R$ 68,50; cancelado ao encerrar o teste.
- Nenhuma migration nova necessária para esta etapa.
