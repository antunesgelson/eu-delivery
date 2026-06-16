## Linguagem
- Responda sempre em português.

# Guia de implementação de API e validação

## Objetivo
- Padronizar a criação de novos projetos React/Next que consumam APIs autenticadas, garantindo consistência na arquitetura, validação de formulários e UX.
- Fornecer um checklist replicável para montar a stack de API, autenticação e feedback de erros em qualquer domínio.

## Stack principal
- Cliente HTTP centralizado em `src/services/api.ts` com `axios` e leitura de tokens via `nookies`.
- Estado assíncrono coordenado com `@tanstack/react-query` (`QueryClient` em `src/lib/react-query.ts` e provedor em `src/app/layout.tsx`).
- Autenticação JWT em `src/context/Auth.tsx`, responsável por login, refresh e sincronização de cookies.
- Feedback global usando `react-toastify` e componentes UI com suporte a erros (`src/components/ui/input.tsx`, `src/components/ui/button.tsx`).

## Passo a passo para novos projetos
1. **Variáveis de ambiente**: declare `NEXT_PUBLIC_BASE_URL_DEV` (dev), `NEXT_PUBLIC_BASE_URL_PROD` (prod) e, se necessário, chaves específicas de integração. Não exponha segredos em variáveis públicas.
2. **Cliente axios** (`src/services/api.ts`):
  - Configure `baseURL` com a env adequada.
  - Interceptador de requisição deve injetar `Authorization: Bearer <token>` lendo cookies `@app:token` (renomeie o prefixo para o novo projeto).
  - Centralize exports (`export const api`), evitando instanciar axios fora desse módulo.
3. **React Query**:
  - Crie o `QueryClient` em `src/lib/react-query.ts` com comportamentos padrão (retry, cacheTime) ajustados ao projeto.
  - Envolva a aplicação com `QueryClientProvider` e sinalize em comentários se outras libs (p.ex. `HydrationBoundary`) forem necessárias.
4. **Contexto de autenticação** (`src/context/Auth.tsx`):
  - Use `useMutation` para login (`api.post('/auth')`) e guarde `token`/`refresh_token` nos cookies.
  - Decodifique o JWT com `decode` para armazenar claims relevantes (id, email, regras) no estado.
  - Atualize `api.defaults.headers.Authorization` após login ou refresh.
  - Garanta `handleSignOut` removendo cookies e limpando o estado.
5. **Middleware/guard** (`src/middleware.ts`):
  - Bloqueie rotas protegidas quando não houver token válido.
  - Se houver `refresh_token`, faça `api.get('/auth/refresh-token/:refresh_token')`, recalcule `maxAge` (`exp - iat`) e reescreva cookies.
  - Controle redirecionamentos conforme permissões (`regras`), mantendo exceções de rota documentadas.
6. **CRUDs**:
  - Preferir hooks `useQuery` e `useMutation` atrelados a chaves claras (`['categoria']`, `['usuario', id]`).
  - Converta payloads do formulário para o formato da API (casts numéricos, transformação de CEP/CPF) antes do `api.post`/`api.put`.
  - Utilize invalidation (`queryClient.invalidateQueries`) após mutações relevantes.

## Estratégia de validação
- Combine `react-hook-form` com `zodResolver` para garantir tipagem e validação unificadas.
- Declare schemas por página/módulo, exportando `z.infer<typeof schema>` para tipar o formulário.
- Use `transform` e `refine` para regras avançadas (formatação de data, CPF, comparação `password`/`confirmPassword`).
- Emparelhe `watch` + `setValue` com formatadores (`useFormatters`) para manter máscaras (CEP, CPF, telefone) sincronizadas com o schema.
- Reutilize helpers de validação em `src/utils` quando a lógica se repetir entre módulos.

## Tratamento de erros e UX
- Componentes de formulário devem receber `error` textual e renderizar feedback visual (ver `src/components/ui/input.tsx`).
- Nas mutações, trate `error.response.data.message` permitindo arrays de erros (iterar e disparar `toast.error` com atraso incremental).
- Configure o `ToastContainer` no layout global e utilize um padrão de mensagens (prefixos, níveis de severidade) para consistência.
- Em casos de `401`/`403`, prefira centralizar o tratamento no interceptor de resposta ou no contexto de auth para forçar sign-out/refresh.

## Checklist para novos módulos
- [ ] Criar schema `zod` local com regras de negócio explícitas.
- [ ] Inicializar `useForm` com `zodResolver(schema)` e exportar `FormData = z.infer<typeof schema>`.
- [ ] Mapear dados exibidos com `useQuery` usando o cliente `api`.
- [ ] Encapsular operações de escrita em `useMutation`, com sucesso disparando `toast.success` e invalidando queries relacionadas.
- [ ] Garantir máscaras e transforms sincronizados com a validação.
- [ ] Documentar rotas protegidas adicionadas no middleware.

## Referências úteis
- `src/services/api.ts`: instância axios e interceptores.
- `src/context/Auth.tsx`: fluxo completo de login, refresh e sign-out.
- `src/app/(sign)/signup/page.tsx`: exemplo de schema com validação de CPF e campos espelhados.
- `src/app/admin/praticas/cadastrar/page.tsx`: caso completo de CRUD com `react-query`, transforms e tratamento de erros.
- `src/components/ui/input.tsx`: padrão de exibição de erros com animação.

## Resumo operacional
1. Definir variáveis de ambiente antes de `next dev`.
2. Instanciar `api` com interceptador de token e reaproveitá-lo em todo o projeto.
3. Configurar `react-query` + `AuthContext` no layout raiz.
4. Validar formulários com `zod` integrado ao `react-hook-form`.
5. Propagar erros para `toast` e destacar mensagens nos componentes de entrada.