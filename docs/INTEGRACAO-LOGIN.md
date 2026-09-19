# Login por telefone e acesso administrativo

## Fluxo integrado

- O telefone passa pelo formulário React Hook Form/Zod antes de `POST /auth/wp`. Máscaras são removidas e o prefixo brasileiro é enviado uma única vez, conforme o contrato da API (10 ou 11 dígitos nacionais).
- O código de seis dígitos é enviado por **Confirmar código**, com proteção contra envios simultâneos. Código incorreto ou falha de rede mantém a tela disponível para nova tentativa; o tratamento de erro também funciona quando não existe resposta HTTP.
- **Reenviar código** respeita o intervalo de um minuto. Após sucesso, a URL passa a carregar o novo `desafioId` e o prazo da próxima solicitação; recarregar preserva esses dados. O prazo da interface é apenas informativo: o servidor continua responsável pelo limite, pela validade e pelo uso único do código.
- Um link sem telefone ou identificador válido oferece retorno ao login.
- Após autenticar, o cliente volta à rota solicitada, incluindo parâmetros. Redirecionamentos aceitam caminhos internos, recusando URLs externas, barras invertidas e caracteres de controle. A mesma regra é compartilhada pelos callbacks do servidor.
- O login administrativo valida e-mail e senha antes de chamar a API, bloqueia o botão durante o envio e mantém a validação de permissão administrativa no servidor.
- A interface explica falhas ou indisponibilidade do login Google. A integração externa do provedor ainda exige homologação própria.

As sessões continuam usando os cookies HttpOnly definidos pelo proxy. Tokens não são retornados ao JavaScript da página. Nenhuma rota protegida ou migration nova foi necessária nesta etapa; os endpoints de autenticação existentes foram reutilizados.

## Testes locais

Use os serviços locais, catálogo de desenvolvimento e credenciais descritos em [TESTES-PDV.md](TESTES-PDV.md). A API deve estar em `AUTH_DELIVERY_MODE=development`: o teste usa o código de desenvolvimento retornado pela API e não envia WhatsApp real.

```sh
npm run test:e2e -- login.spec.ts
```

Cenários:

1. Validação do telefone, código incorreto, falha de transporte simulada, nova tentativa, retorno ao checkout com parâmetros, recarga autenticada e cookies HttpOnly.
2. Espera real de um minuto, reenvio, recarga, recusa do desafio anterior pelo servidor e entrada usando o novo código.
3. Validação administrativa, rejeição de senha incorreta, bloqueio durante envio e acesso à rota protegida.
4. Link incompleto e rejeição de destino externo após login.

O teste de reenvio tem limite de dois minutos para respeitar o intervalo real do servidor. Não executa chamadas aos provedores Google, WhatsApp ou e-mail. As contas locais criadas automaticamente pela autenticação e suas sessões permanecem na base de desenvolvimento.

## Resultado local — 18/09/2026

Os quatro cenários de login foram aprovados com a API real e o frontend em build de produção. Os nove cenários existentes de PDV, histórico e endereços/checkout também passaram. Na rodada conjunta, 12 passaram inicialmente; o teste restante foi corrigido para ler a resposta antes da navegação e passou na reexecução isolada. Build, lint e checagem TypeScript aprovados.

Os 33 testes HTTP/MySQL do backend foram aprovados na etapa anterior de endereços; esta etapa não alterou o código do backend.
