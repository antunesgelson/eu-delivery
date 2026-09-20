# Validação reproduzível da integração

A rotina `npm run test:integration` executa os testes de navegador com API real e MySQL local, sem depender de servidores previamente iniciados. Os workflows de GitHub Actions estão disponíveis nos dois repositórios. Os workflows passaram no GitHub Actions, incluindo API, 49 testes de navegador e instalação Docker em volume novo. A execução Docker também passou localmente.

## Requisitos e execução local

- Node.js 22.13+; `.nvmrc` seleciona a linha 22 nos dois projetos.
- Frontend e backend em diretórios irmãos, ou `E2E_BACKEND_DIR` apontando para o backend.
- MySQL local e credenciais com permissão de criar/remover bancos temporários.
- Chromium do Playwright instalado.

```sh
# Backend
npm ci
npm run lint
npm run build
DOTENV_CONFIG_PATH=.env.codex.local npm run test:e2e

# Frontend
npm ci
npx playwright install chromium
npm run lint
npm run build
npm run test:integration
```

As credenciais MySQL podem vir de `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER` e `MYSQL_PASSWORD`. Na ausência delas, a rotina lê esses quatro campos do arquivo `.env.codex.local` do backend. `E2E_BACKEND_ENV` permite indicar outro arquivo. `MYSQL_DB` do ambiente não é utilizado como destino dos testes.

Para uma verificação específica:

```sh
npm run test:integration -- operacao.spec.ts
npm run test:integration -- pdv.spec.ts sessao.spec.ts
```

Os cinco arquivos que antes exigiam servidores abertos — endereços, histórico, login, PDV e sessão — recebem, cada um, um banco vazio `zanini_ci_*`, todas as migrations, seed, administrador temporário e portas livres. Os demais continuam usando o harness `zanini_browser_*` e seus escopos isolados. Reiniciar a API entre suítes também isola os limites de autenticação, preservando as regras da aplicação.

A rotina desliga integrações externas e não reutiliza credenciais de provedores. Os testes de pagamento substituem o gateway pelo contrato simulado existente. Os bancos criados e os processos iniciados pela rotina são encerrados ao concluir ou falhar; `SIGINT`/`SIGTERM` também iniciam o encerramento. Interrupção forçada do sistema pode exigir a inspeção dos recursos temporários restantes.

Uma execução aprovada grava `artifacts/integration.json`: versão do Node, commits e indicador de alterações locais dos dois repositórios, hashes dos lockfiles, nomes/hashes das migrations e suítes executadas. O arquivo não contém credenciais e não é versionado. Enquanto houver alterações locais, os commits registrados não representam sozinhos todo o código validado.

## Verificações da API

| Rota pública | Resultado |
|---|---|
| `GET /health/live` | `200 {"status":"ok"}` quando o processo responde |
| `GET /health/ready` | `200` após consultar o banco e confirmar ausência de migrations pendentes; `503 {"status":"unavailable"}` em falha ou timeout |

As respostas usam `Cache-Control: no-store` e não retornam host, versão do banco, SQL, stack ou credenciais. São sondas técnicas públicas; as rotas privadas mantêm os guards existentes. Não são encaminhadas pelo proxy genérico do frontend.

## Docker local

`compose.yaml` do frontend reutiliza os serviços do Compose do backend e acrescenta o Next. A ordem é banco saudável → migrations concluídas → API saudável → frontend. O seed é explícito e não roda no startup normal.

O Compose é destinado ao desenvolvimento local, com autenticação de teste e portas publicadas somente em loopback. Para configurá-lo:

```sh
cp ../eu-delivery-back/.env.example .env.docker.local
# Preencha as senhas MySQL, JWT_SECRET e, para seed, ADMIN_EMAIL/ADMIN_PASSWORD.
docker compose --env-file .env.docker.local up --build -d --wait
# Opcional: dados e administrador de desenvolvimento.
docker compose --env-file .env.docker.local run --rm api node dist/database/seed.js
```

Frontend: `http://localhost:4051`; API: `http://localhost:4052`; MySQL: `127.0.0.1:3308`. `WEB_PORT`, `API_PORT` e `MYSQL_HOST_PORT` alteram as portas publicadas. Para outra porta do frontend, ajuste também `FRONTEND_URL`/`CORS_ORIGINS`.

O proxy valida a origem das escritas contra `FRONTEND_URL`, pois o endereço interno do container difere do endereço público. Sem essa configuração, utiliza a origem da requisição Next. Headers `X-Forwarded-*` não ampliam a lista de origens permitidas. O teste Docker verifica login com a origem configurada e rejeição de origem ausente, `null` ou externa.

A verificação automatizada usa seu próprio projeto Compose, portas dinâmicas, credenciais aleatórias e volume novo:

```sh
npm run test:docker
```

Ela verifica migrations, seed, catálogo pelo frontend, login administrativo, repetição das migrations, preservação dos dados após reinício e falha/recuperação do banco. Ao encerrar, remove somente os containers e volumes do projeto exclusivo que criou. O resultado aprovado fica em `artifacts/docker.json`. O script falha se o Docker estiver indisponível; não apresenta a validação de configuração como execução dos containers.

A rotina inclui também um [ensaio de backup e restauração](BACKUP-ATUALIZACAO.md): dois pedidos criados pela API, dump SQL privado, restauração em outro banco vazio, comparação integral e verificação pela API/frontend restaurados. O artefato contém somente hash, tamanho e contagens; o SQL temporário é removido ao encerrar.

## GitHub Actions

O workflow do backend (`.github/workflows/ci.yml`) instala dependências via `npm ci`, executa lint, build e testes HTTP com MySQL 8.4 temporário e compila a imagem Docker.

O workflow do frontend (`.github/workflows/integration.yml`) obtém os dois repositórios, instala via lockfiles, valida ambos, executa toda a suíte de navegador e o teste Docker em volume novo. Falhas encerram o job; evidências são guardadas por sete dias. Os workflows rodam também nas branches `codex/integracao-*`, permitindo validar a versão proposta antes do merge. Nenhum workflow publica imagens ou faz deploy.

Referências e configuração remota:

- As versões correspondentes estão publicadas na branch `codex/integracao-ci-20260919` dos dois repositórios. Os checkouts locais originais foram preservados. A abertura automática de PR foi recusada pelo conector GitHub (`403 Resource not accessible by integration`); as branches estão disponíveis para revisão.
- `BACKEND_REF` pode substituir o commit/tag compatível; o padrão desta entrega é `475b72d5e866096ff41e77c32a9ca681137cdd02`. A execução manual também aceita `backend_ref`. Use uma referência fixa para registrar uma versão revisável.
- Se o backend for privado, configure `BACKEND_READ_TOKEN` com leitura de conteúdo desse repositório. O `GITHUB_TOKEN` do frontend não concede automaticamente acesso ao backend privado. A credencial serve ao checkout e não é persistida no Git.
- Pull requests usam `pull_request`, sem executar código de PR por `pull_request_target`. PRs sem acesso ao backend privado não terão a integração concluída.
- Configure os jobs como verificações obrigatórias na proteção da branch para impedir merge sem validação. Essa configuração remota não foi alterada aqui.

As referências efetivamente testadas e as migrations ficam no artefato da integração, permitindo associar frontend e backend sem presumir que suas branches avançam juntas.

## Evidências — 19 e 20/09/2026

- Node.js **22.23.2**, Next.js **15.5.25**, MySQL **9.7.1**.
- **49 testes de navegador aprovados** pela rotina isolada; nenhum banco `zanini_ci_*` restou após o encerramento.
- **37 testes HTTP/MySQL aprovados**, incluindo as sondas de disponibilidade.
- Builds dos dois projetos, lint de ambos e tipos do frontend aprovados.
- `npm ci` e build também passaram em cópias temporárias limpas dos dois projetos, sem `node_modules`, builds anteriores ou arquivos `.env`.
- Workflows aprovados pelo Actionlint **1.7.12**; configuração integrada aprovada por `docker compose config --quiet` com Compose **5.5.1**, sem daemon.
- Docker Desktop 4.91.0 e Engine 29.8.0: execução completa aprovada em **20/09/2026**, registrada em `artifacts/docker.json`. Foram verificados volume vazio, catálogo/login, bloqueio de origens inválidas, migrations repetidas, reinício e falha/recuperação do banco. Containers e volume exclusivos foram removidos ao final. O script aguarda o Engine por até 60 segundos antes de criar recursos e consulta novamente a porta da API após reiniciar.
- Backend aprovado no [GitHub Actions, execução 35468714263](https://github.com/antunesgelson/eu-delivery-back/actions/runs/35468714263), commit `475b72d5e866096ff41e77c32a9ca681137cdd02`: lint, build, 37 testes HTTP/MySQL 8.4 e imagem Docker.
- Após a correção da origem pública, lint, build e os sete testes locais de endereços/sessão passaram novamente.
- Os quatro testes de cardápio passaram novamente em 20/09, incluindo o agendamento em data futura, independente do horário de execução.
- Em 20/09, a [execução integrada 35501915196](https://github.com/antunesgelson/eu-delivery/actions/runs/35501915196) aprovou os 49 testes de navegador no commit frontend `969aeb53c6ef0b5d485538958550339fa355016f`, usando o backend fixado em `475b72d5e866096ff41e77c32a9ca681137cdd02`. O job completo passou, incluindo lint/build, os 37 testes HTTP/MySQL, Docker em volume novo e publicação das evidências.
- A atualização documental do backend, commit `02b5b22`, também passou no [CI 35502171638](https://github.com/antunesgelson/eu-delivery-back/actions/runs/35502171638).

Referências utilizadas: [ordem de inicialização do Compose](https://docs.docker.com/compose/how-tos/startup-order/), [checkout e acesso entre repositórios](https://github.com/actions/checkout), [configuração do Node no Actions](https://github.com/actions/setup-node).

A atualização final desta documentação não altera o código validado. A homologação dos provedores permanece pendente; consulte o [roteiro de preparação](HOMOLOGACAO-INTEGRACOES.md).

## Ensaio de restauração — 20/09/2026

O commit frontend `45f7214e277e5989f1f3e1f276920fc31c9cf692` passou no [CI integrado 35502800119](https://github.com/antunesgelson/eu-delivery/actions/runs/35502800119): lint/build, 37 testes HTTP/MySQL, 49 testes de navegador e Docker com backup/restauração em outro banco. A execução local também passou e registrou 5 migrations, 2 usuários, 2 pedidos, 2 itens, 1 registro de estoque, 1 movimento de benefício e 6 registros de auditoria. O banco restaurado teve estrutura e conteúdo idênticos à origem, seguidos de verificações pela API e frontend.
