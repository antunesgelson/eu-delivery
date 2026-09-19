# Perfil do cliente

A página protegida `/profile` consulta `GET /usuario` e salva em `PUT /usuario` pelo cliente HTTP centralizado. O formulário usa React Hook Form/Zod e mantém o telefone verificado somente para leitura.

- Nome e e-mail têm os limites do contrato da API. CPF opcional valida os dígitos verificadores; aniversário opcional exige uma data real, sem data futura, considerando o calendário de São Paulo.
- O envio remove espaços externos de nome/e-mail e a máscara do CPF. Limpar e-mail ou aniversário envia `null`; limpar CPF envia string vazia. Telefone e permissões não fazem parte do payload.
- Consultas em segundo plano atualizam campos intactos e preservam campos editados. Se a consulta falhar, o formulário mantém as alterações e exige recuperar a consulta antes de salvar.
- Falhas de gravação, inclusive conflito de e-mail, preservam a edição. Durante a gravação, campos e botão ficam bloqueados. Uma consulta anterior é cancelada antes da escrita para não sobrescrever sua resposta.
- Após sucesso, os dados retornados pela API atualizam o formulário e o cache; a sessão é reconsultada para atualizar o nome exibido no cabeçalho.

## Correção no backend

O teste com aniversário em `1996-02-29` revelou uma conversão indevida na conexão MySQL: `DATE` era interpretado como instante UTC e depois formatado pelo TypeORM no fuso local, retornando o dia anterior.

`src/database/data-source.ts` agora configura `dateStrings: ['DATE']`. Datas civis, incluindo aniversário, validade de cupom e data de estoque, permanecem strings `YYYY-MM-DD`. Colunas `DATETIME` continuam representando instantes. Não há migration nem alteração dos dados armazenados.

## Execução e validação — 18/09/2026

`tests/e2e/perfil.spec.ts` contém três cenários com frontend/API reais e MySQL temporário:

1. Validação, CPF com máscara, persistência de aniversário em ano bissexto, atualização da sessão, telefone preservado e limpeza de campos opcionais.
2. Recuperação de falhas no carregamento e na gravação, preservação da edição e bloqueio durante o envio.
3. Falha e recuperação da consulta em segundo plano sem perder o rascunho, atualização de campos intactos e correção após conflito real de e-mail.

Usa a [infraestrutura temporária de integração](INTEGRACAO-PAGAMENTOS.md), com contas criadas por autenticação de desenvolvimento, sem envio externo de mensagens.

```sh
# No backend
npm run build
TZ=America/Sao_Paulo DOTENV_CONFIG_PATH=.env.codex.local npm run test:e2e

# No frontend
npm run build
npm run test:e2e -- perfil.spec.ts pagamento.spec.ts
```

Resultado: 34 testes HTTP/MySQL e seis testes de navegador aprovados. Builds dos dois projetos e verificação de lint/tipos do frontend aprovados. A suíte completa de navegador contém 27 cenários; nesta etapa foram executados os seis de perfil e pagamentos.
