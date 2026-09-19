# Renovação de sessão e falhas temporárias da API

O frontend diferencia recusa da credencial de renovação de indisponibilidade temporária. O carrinho continua persistido na API, e a renovação reaproveita os cookies HttpOnly existentes.

## Comportamento

- Uma resposta 401 de uma rota autenticada inicia a renovação já centralizada no cliente HTTP. Após sucesso, a requisição original é repetida uma vez.
- Respostas 400, 401 ou 403 de `/auth/refresh` indicam credencial recusada pelo contrato atual. O proxy apaga os cookies e o contexto remove o estado privado da sessão.
- Falhas de rede, limite temporário (429) e respostas 5xx preservam os cookies. O erro de renovação é propagado para a tela como falha temporária, sem ser substituído pelo 401 original.
- Se a conta ainda não foi carregada em uma página protegida, a interface mostra **Tentar novamente**. A página e seus parâmetros são mantidos, sem redirecionar para login durante a falha.
- O middleware administrativo também retorna indisponibilidade temporária sem apagar cookies. Recarregar após a recuperação da API renova a sessão antes de abrir a página protegida.
- Quando o backend confirma que a sessão foi revogada, o cliente volta ao login com a rota original preservada. A sessão não é mantida apenas porque existem cookies.

Nenhuma migration, endpoint novo ou mudança na duração das credenciais foi necessária. O fluxo existente de renovação continua serializando requisições simultâneas no mesmo cliente HTTP.

## Verificação reproduzível

Pré-requisitos: API local de desenvolvimento e credenciais `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`, conforme [TESTES-PDV.md](TESTES-PDV.md). O primeiro cenário usa `AUTH_DELIVERY_MODE=development` e o produto demonstrativo 302; cria um cliente isolado, adiciona um item sem finalizar pedido e remove essa linha ao concluir.

```sh
npm run build
npm run test:e2e -- sessao.spec.ts
```

A fixture `tests/fixtures/session-app.ts` inicia um frontend de produção e uma ponte HTTP em portas locais livres. A ponte encaminha as chamadas à API real e injeta apenas as falhas previstas nos testes. Isso exercita o proxy Next, os cookies, o contexto de autenticação e o middleware, sem mudar a configuração da API ou interromper os serviços de desenvolvimento. Os processos auxiliares são encerrados ao final. Nenhuma mensagem externa é enviada.

Cinco cenários:

1. Falha 503 na renovação, preservação dos cookies, recuperação pelo botão e persistência do carrinho após recarga.
2. Limite 429 seguido de renovação bem-sucedida.
3. Revogação real na API, remoção de cookies e retorno ao login com parâmetros.
4. Indisponibilidade e recuperação da renovação na rota administrativa protegida.
5. Falha 503 na consulta da conta, sem renovação indevida, seguida de nova tentativa.

As contas e sessões locais criadas permanecem no banco de desenvolvimento. As sessões usadas nos cenários administrativos não alteram senha, permissões, pedidos ou carrinho do administrador.

## Resultado local — 18/09/2026

Os cinco cenários novos passaram isoladamente. A rodada completa também passou: **18 testes de navegador**, incluindo login, PDV, histórico e checkout. Build, lint e checagem TypeScript do frontend aprovados. O backend foi exercitado pelos testes sem alteração de código nesta etapa.
