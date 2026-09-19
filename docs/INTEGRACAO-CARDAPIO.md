# Cardápio: administrativo, loja e pedido

O cadastro em `/admin/cardapio` e `/admin/cardapio/novo-item` usa `GET/PUT /admin/catalogo`. A área do cliente consulta `GET /categoria/lista/detalhes` e `GET /produto/:id`; o carrinho e a finalização usam os endpoints de pedidos existentes.

## Comportamento integrado

- Categorias ativas e produtos disponíveis aparecem na loja após a confirmação da API. Categorias em rascunho ficam fora da listagem pública e seus produtos retornam `404` no acesso direto.
- A loja e a página de produto reconsultam a API a cada dez segundos enquanto abertas. No mesmo cliente React Query, salvar o catálogo também invalida as consultas de listagem e detalhe.
- Nome, descrição e preço usam React Hook Form e Zod. O formulário mantém a edição após falhas e conflitos de versão, sem sobrescrevê-la quando o catálogo é reconsultado.
- Uma tentativa de cadastro mantém o ID do produto até a conclusão. Se a API salvar e a resposta se perder, a nova tentativa atualiza esse mesmo item após reconsultar o catálogo.
- Alterações do gestor são serializadas com a versão confirmada pela API. Uma falha interrompe as alterações que ainda estavam na fila e reconsulta o estado persistido. Categoria criada, editada, duplicada ou excluída só recebe a confirmação visual após o retorno da API.
- Ao duplicar categorias, os produtos recebem IDs próprios e as referências entre componentes duplicados são remapeadas.
- A liberação de estoque por dia envia `false` explicitamente, permitindo desfazer o bloqueio persistido. Os próximos dias de atendimento são calculados no fuso de São Paulo.
- Imagens PNG, JPG e WEBP de até 1,4 MB são aceitas, respeitando o limite de dois milhões de caracteres do campo em base64. O envio fica bloqueado durante a leitura da imagem.
- O produto mostra carregamento, falha recuperável e indisponibilidade. A inclusão no carrinho bloqueia envios simultâneos e respeita o limite de quantidade da API. Atualizar o preço mantém a quantidade selecionada e recalcula o total.
- O backend existente calcula o valor do pedido e as reservas. Produtos simples consomem seu estoque; compostos consomem os componentes nas quantidades cadastradas.

As alterações desta etapa estão no frontend. O contrato produtivo do backend, as migrations e as rotas protegidas permanecem os existentes.

## Testes de ponta a ponta

`tests/e2e/cardapio.spec.ts` usa sessões separadas de administrador e cliente, API real e MySQL temporário. O administrador usa o fuso de Tóquio para verificar a independência do fuso do navegador.

1. Recupera falha de criação de categoria, cadastra produto com imagem, observa sua chegada à loja já aberta, adiciona duas unidades, escolhe retirada/horário/pagamento e envia o pedido. Confere valor, reserva por data e presença no administrativo.
2. Provoca um conflito real com uma alteração de outro administrador, preserva o formulário e salva novamente mantendo a alteração externa. Confere o novo preço no produto já aberto e verifica que uma resposta perdida não duplica o cadastro.
3. Duplica categoria com novos IDs, desativa a original e observa a indisponibilidade na sessão do cliente. Bloqueia e libera o estoque de sábado, conferindo persistência após recarregar.
4. Cadastra um composto que consome meio frango, recupera uma falha de consulta do produto e finaliza duas unidades, conferindo a baixa de uma unidade do componente.

```sh
# Backend: build utilizado pelo harness temporário
npm run build

# Frontend
npm run build
npm run test:e2e -- cardapio.spec.ts
```

Pré-requisitos e isolamento: [infraestrutura de integração](INTEGRACAO-PAGAMENTOS.md).
