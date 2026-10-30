# MCP remoto

URL: `https://vault.albuquerquesz.com/api/mcp` (Streamable HTTP, stateless, aceita clientes legados).
O MCP local (`apps/mcp`, stdio + token `vlt_mcp_…`) continua funcionando, mas o remoto é o caminho principal.

## Autenticação (OAuth 2.1)

- Servidor de autorização: better-auth (`apps/api/src/auth.ts`) com `jwt()` + `mcp()` de `@better-auth/mcp`.
  - Issuer `${BETTER_AUTH_URL}/api/auth`; tokens com audience `${BETTER_AUTH_URL}/api/mcp` (`AUTH_ISSUER` / `MCP_RESOURCE`).
  - Clientes se registram via DCR (`/api/auth/oauth2/register`). CIMD não está ativo: exige um fetch com DNS fixado que o Worker não oferece.
- Descoberta: `/.well-known/*` é tratado pelo handler da auth no Worker e repassado pelo Pages (`apps/web/functions/.well-known/[[path]].ts`).
  - RFC 9728: `/.well-known/oauth-protected-resource/api/mcp`
  - RFC 8414: `/.well-known/oauth-authorization-server/api/auth`
- Fluxo: cliente → `/login` (Google; o `oauthProviderClient` leva o `oauth_query` assinado) → `/oauth/consent` → token.
- `apps/api/src/mcp/route.ts` valida o JWT em processo (`auth.api.getJwks()` + `jose`, issuer + audience). Sem token válido: 401 com `WWW-Authenticate: Bearer resource_metadata=…`.
- Tabelas OAuth em `apps/api/src/db/schema/oauth.ts` (geradas com `bunx auth@<versão> generate`). better-auth checa o schema ao iniciar: ao atualizar, regenere e crie a migration. O `deploy-api.yml` roda migrations antes do deploy.

## API key (somente leitura)

Para clientes que só aceitam header fixo (sem OAuth), `/api/mcp` também aceita `Authorization: Bearer vlt_mcp_…` (tokens criados em `/settings` → MCP). Validado por `resolveMcpAccessToken`; nesse caso só as tools de leitura são registradas (`createVaultMcpServer(..., { readOnly: true })`).

## Tools

Cada tool chama uma rota existente da API **em processo** (`app.fetch`), com o usuário do token em `mcpRequestUser` (`apps/api/src/session.ts`). `requireSession` devolve esse usuário, então validação, erros `{ error, code }` e respostas são os mesmos da web.

| Tool | Rota |
|---|---|
| `get_financial_overview` | GET `/api/finance/overview` |
| `get_spending_insights` | GET `/api/finance/partial-result` |
| `list_transactions` | GET `/api/finance/transactions` |
| `get_monthly_bills` | GET `/api/finance/monthly-bills` |
| `list_goals` | GET `/api/finance/goals` |
| `list_categories` | GET `/api/finance/categories` |
| `create_manual_transaction` | POST `/api/finance/transactions/manual` |
| `recategorize_transactions` | POST `/api/finance/transactions/recategorize` |
| `hide_transactions` | POST `/api/finance/transactions/hide` |
| `create_goal` | POST `/api/finance/goals` |
| `update_goal` | PATCH `/api/finance/goals/:id` |

### Adicionar uma tool

1. Garanta que existe uma rota da API para a operação (com `requireSession`).
2. Registre em `apps/api/src/mcp/server.ts` com schema zod, descrição em português e `annotations` (`readOnlyHint` / `destructiveHint`).
3. Teste local: assine um JWT com `auth.api.signJWT({ body: { payload: { sub, aud: MCP_RESOURCE } } })` e chame `POST /api/mcp` com JSON-RPC (`initialize`, `tools/list`, `tools/call`).

Sampling não é usado: foi depreciado na spec MCP 2026-07-28 (SEP-2577). O agente do cliente raciocina e chama as tools.
