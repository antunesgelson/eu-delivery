# Edição administrativa de clientes

As visualizações de clientes, cashback e fidelidade em `/admin/dashboard?view=reports` usam o formulário `EditarCliente` para atualizar o cadastro com `PUT /admin/clientes/:id`.

## Contrato e comportamento

- Nome obrigatório, e-mail opcional, CPF com dígitos verificadores e nascimento válido sem data futura são validados com React Hook Form e Zod. CPF e nascimento compartilham os helpers do perfil em `src/utils/validacaoCliente.ts`.
- O telefone aceita DDD e formatação, com ou sem prefixo `55`, e é enviado somente com números e código do país. O CPF tem máscara na tela e é enviado somente com números.
- Ao limpar os campos opcionais, o formulário envia `email: null`, `tel: null`, `dataDeNascimento: null` e `cpf: ""`. Antes, os valores vazios viravam `undefined` e eram omitidos da requisição, mantendo os dados antigos no banco.
- A data de nascimento permanece uma data civil `YYYY-MM-DD`, sem conversão de fuso.
- Falhas de gravação e conflitos de dados únicos mostram a mensagem da API e preservam o formulário. Reconsultas da listagem não substituem a edição aberta.
- Durante o envio, campos, cancelamento e fechamento ficam bloqueados. Uma trava impede envios simultâneos.
- O sucesso atualiza as consultas de clientes, seleção de cliente no PDV, detalhe do cliente, pedidos, operação e relatórios.
- A busca aguarda 300 ms após a digitação, limita o texto a 100 caracteres e cancela requisições substituídas. Estados de carregamento e erro não aparecem como lista vazia. A navegação entre páginas fica bloqueada enquanto consulta os dados.
- A falha dos indicadores financeiros tem recuperação própria e não impede consultar ou editar clientes.

O backend já aceita esses valores e protege as rotas administrativas. Não foram alterados o código produtivo do backend, as migrations ou as rotas protegidas do frontend.

## Testes

`tests/e2e/clientes-admin.spec.ts` executa três cenários com frontend/API reais e banco MySQL temporário, usando `integrationSuite: 'clientes-admin'`:

1. Validação impede requisições inválidas; normalização, persistência, leitura no perfil e limpeza dos opcionais funcionam, inclusive com navegador no fuso de Tóquio. Uma tentativa de edição administrativa pelo cliente recebe `403`.
2. Conflito real de e-mail (`409`) e indisponibilidade (`503`) preservam o rascunho. Durante o envio, os campos e o cancelamento ficam bloqueados e Escape não fecha o formulário.
3. Recuperação da listagem, busca sem resultados, busca por e-mail e edição mesmo com indicadores indisponíveis. A reconsulta da listagem preserva o texto digitado.

```sh
# Backend: necessário para a infraestrutura temporária
npm run build

# Frontend
npm run build
npm run test:e2e -- clientes-admin.spec.ts perfil.spec.ts agendamento-admin.spec.ts
```

Pré-requisitos: [infraestrutura de testes de integração](INTEGRACAO-PAGAMENTOS.md).

## Validação local — 18/09/2026

Build, lint e tipos do frontend aprovados. Os nove cenários de clientes administrativos, perfil e agendamentos passaram em 26,2 segundos. A suíte agora contém 40 cenários; a execução completa dos 37 anteriores passou na etapa de agendamentos.
