# Backup, restauração e atualização

Este procedimento cobre o banco criado pelas migrations atuais. A escolha da hospedagem, a retenção dos backups e a eventual importação de uma base antiga ainda dependem da definição da operação.

## Ensaio automatizado em banco descartável

```sh
npm run test:docker
```

Além da instalação e recuperação do banco, a rotina executa `scripts/restore-smoke.mjs` dentro do projeto Compose exclusivo do teste:

1. Cria um cliente e dois pedidos pela API: um pendente e outro concluído, pago com duas parcelas presenciais e com cashback creditado.
2. Para frontend e API, incluindo a rotina de conciliação, para manter a origem sem escritas durante a conferência.
3. Exporta estrutura e dados com `mysqldump`, usando transação consistente, dados binários em hexadecimal e ordenação por chave primária. O SQL é salvo com permissão `0600` no diretório temporário privado do teste.
4. Cria outro banco vazio no mesmo MySQL descartável. A criação falha se o destino já existir. Importa o SQL nesse banco, preservando a origem.
5. Compara o SHA-256 dos dumps determinísticos da origem e da restauração. Isso cobre estrutura e linhas de todas as tabelas, incluindo migrations, vínculos, reservas e chaves de idempotência.
6. Inicia a API usando o banco restaurado, confirma prontidão, lê os dois pedidos com a sessão restaurada e confere o catálogo pelo frontend. Reenvia a mesma solicitação do pedido pendente e exige o mesmo identificador, sem duplicação.

`artifacts/docker.json` registra tamanho/hash do backup, contagens das tabelas conferidas e resultado da verificação pela aplicação. O SQL, senhas e tokens não são publicados como artefatos. O encerramento remove o SQL temporário, os containers e o volume exclusivo do teste.

Os pagamentos desse ensaio são presenciais, persistidos no próprio pedido. A tabela de pagamentos online permanece vazia. O teste não substitui homologação de provedor, restauração em outro servidor ou ensaio com volume de dados operacional.

## Backup de um ambiente definido

Antes da execução operacional, registrar os commits/imagens dos dois projetos, versão do MySQL e migrations aplicadas. Reservar uma janela sem alterações de schema; uma transação de leitura consistente não protege o dump contra DDL concorrente. Essa limitação e as opções de exportação estão descritas no [manual do MySQL 8.4](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html).

Para o Compose local atual, o núcleo do comando de exportação é:

```sh
umask 077
ZANINI_BACKUP_DIR=/caminho/privado/fora-do-repositorio
mkdir -p "$ZANINI_BACKUP_DIR"
ZANINI_BACKUP_TMP=$(mktemp "$ZANINI_BACKUP_DIR/backup.XXXXXX")
docker compose --env-file .env.docker.local exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --user="$MYSQL_USER" --single-transaction --no-tablespaces --set-gtid-purged=OFF --hex-blob "$MYSQL_DATABASE"' \
  > "$ZANINI_BACKUP_TMP" && mv "$ZANINI_BACKUP_TMP" "$ZANINI_BACKUP_TMP.sql"
```

Não imprima essa saída no terminal: ela contém dados e credenciais armazenados pela aplicação. Na automação operacional, escreva primeiro em arquivo temporário com permissões restritas, confira a saída zero do processo e só então promova o arquivo a backup válido. Registre hash, tamanho, horário e versão de origem. O arquivo deve ter armazenamento e retenção definidos, com cópia fora do servidor da aplicação.

O dump de um único banco, sem `--databases`, permite carregar os dados em outro nome de banco. A importação usa o cliente `mysql` apontando para esse destino vazio; veja o [procedimento oficial de restauração SQL](https://dev.mysql.com/doc/refman/8.4/en/reloading-sql-format-dumps.html). Não reutilize um banco já em operação como destino do ensaio.

O backup do banco não inclui configurações externas, `JWT_SECRET`, credenciais dos provedores nem arquivos fora do banco. As imagens atuais do catálogo ficam persistidas no banco; se o armazenamento mudar, os arquivos correspondentes também precisarão entrar no procedimento de recuperação. A configuração dos serviços deve ser recuperável por um mecanismo separado.

## Sequência de atualização

1. Selecionar versões compatíveis do frontend e backend, com checks aprovados, e revisar as novas migrations.
2. Ensaiar a atualização e a restauração em uma cópia isolada, conferindo pedidos, totais, pagamentos, estoque e benefícios antes de publicar a versão.
3. Preparar a janela de atualização. Interromper novas escritas e processos de fundo quando a mudança exigir indisponibilidade; definir a retomada das notificações externas para o ambiente escolhido.
4. Gerar e verificar o backup antes de aplicar migrations. Manter disponíveis as imagens/configurações correspondentes à versão anterior.
5. Aplicar migrations uma vez, iniciar a API e exigir `/health/ready` aprovado; iniciar o frontend e conferir login, catálogo e um ciclo operacional com dados de teste apropriados ao ambiente.
6. Liberar o atendimento e acompanhar falhas, conciliação e integridade dos dados.

Se a atualização falhar, manter o atendimento suspenso até identificar a causa. Voltar o código só é suficiente se ele continuar compatível com o schema atual. Quando for necessária restauração, recuperar o backup em outro banco, iniciar a versão compatível e conferir os dados antes de trocar a conexão. Preservar a base com falha para analisar escritas posteriores ao backup e reconciliar pagamentos no provedor; restaurar o banco não desfaz cobranças externas.

Esse roteiro não executa deploy nem altera bancos operacionais. O ensaio automatizado fornece a evidência local; domínio, hospedagem, política de backups e responsável pela recuperação ainda precisam ser definidos.
