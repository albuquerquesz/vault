# Pluggy BYOK

Leia este documento antes de alterar:

- rotas `apps/api/src/routers/pluggy.ts` e `apps/api/src/routers/webhooks.ts`
- client `apps/api/src/clients/pluggy/*`
- service `apps/api/src/services/pluggy.ts` e `apps/api/src/services/pluggy-webhooks.ts`
- schema/migrations Pluggy
- UI de settings e hooks `apps/web/src/features/pluggy/*`
- mirror em `packages/api` quando aplicável

## Modelo do módulo

- A integração é **BYOK por usuário**. Cada usuário salva seu próprio `clientId` e `clientSecret` em `pluggy_credentials`.
- Nunca introduza credencial compartilhada de plataforma para substituir esse fluxo.
- O frontend não é fonte de verdade para dados do item. Ele só pode enviar o `pluggyItemId` recebido no callback oficial do Pluggy Connect.
- `provider` e `status` devem ser resolvidos no backend a partir do item canônico da Pluggy.

## Fluxo principal

1. frontend solicita `connectToken` ao backend
2. frontend abre o Pluggy Connect oficial
3. callback de sucesso retorna `item.id`
4. frontend envia `{ pluggyItemId }` para `POST /api/pluggy/items`
5. backend chama `GET /items/{id}`
6. backend faz upsert em `pluggy_items`
7. backend sincroniza contas, **faturas de cartão** (`GET /bills?accountId=` para contas `CREDIT`) e transações do mês atual + 5 meses anteriores
8. faturas gravadas em `pluggy_bills` e materializadas em `monthly_bill` / `monthly_bill_item` (source=`pluggy`)
9. frontend invalida `pluggy-items`, `pluggy-accounts`, `pluggy-transactions` e `monthlyBills`

## Regras da API Pluggy

- Autenticação server-to-server começa em `POST https://api.pluggy.ai/auth`.
- Leitura de produtos usa `X-API-KEY`; não depende do `connectToken`.
- Contas vêm de `GET /accounts?itemId=...`.
- Faturas de cartão vêm de `GET /bills?accountId=...` (somente contas `CREDIT` / `CREDIT_CARD`). Não use `/credit-card-bills`.
- Transações vêm de `GET /v2/transactions?accountId=...&dateFrom=...&dateTo=...`.
- A paginação de transações usa `results` e `next`. Não assuma `data`, `pageSize` ou endpoint por item.
- `next` é uma **query string opaca** (ex.: `?accountId=...&after=...`), não o cursor cru. Seguir como path (`/v2/transactions${next}`); **não** passar o valor inteiro em `after` (causa `Invalid cursor`).

## Webhooks (push sync)

A Pluggy faz auto-sync diário e notifica via HTTPS. Nós **não** fazemos polling contínuo.

### Endpoint público

- `POST /api/webhooks/pluggy` — **sem sessão**
- URL de produção: `https://<HOST_DA_API>/api/webhooks/pluggy`
- Fallback da URL: `PLUGGY_WEBHOOK_URL` ou `${BETTER_AUTH_URL}/api/webhooks/pluggy`
- Secret opcional: `PLUGGY_WEBHOOK_SECRET` (header `X-Vault-Webhook-Secret`)

### Eventos tratados

| Evento | Ação |
|---|---|
| `item/created`, `item/updated` | Atualiza status + `syncTransactionsForItem` (contas, txs, expenses) |
| `transactions/created\|updated\|deleted` | Full item sync (idempotente) |
| `item/error`, `item/waiting_*`, `item/login_succeeded` | Atualiza `pluggy_items.status` |
| `item/deleted` | Remove expenses derivadas, txs e item local |
| demais | `ignored` (200) |

### Resolução BYOK no webhook

1. `itemId` remoto → `pluggy_items.pluggyItemId`
2. se `clientUserId` vier no payload, filtrar por `userId`
3. `resolvePluggyCredentials(userId)` → sync

Item desconhecido localmente → `200 unknown_item` (não 404, evita retry infinito).

### Registro

1. **Manual no dashboard Pluggy** (testes): colar a URL HTTPS pública
2. **Auto** ao salvar credenciais BYOK (`ensurePluggyWebhookRegistered`, event `all`) — só se URL for `https://`
3. **Connect token** envia `options.webhookUrl` quando HTTPS

Event names usam `/` (`item/updated`), nunca `item.synced`.

## Regras de persistência

- `pluggy_items` deve permanecer idempotente por `userId + pluggyItemId`.
- `pluggy_accounts` deve permanecer idempotente por `pluggyItemId + pluggyAccountId`.
- `pluggy_transactions` deve permanecer idempotente por `pluggyItemId + pluggyTransactionId`.
- Transações ocultadas pelo usuário devem ser persistidas localmente em `pluggy_transactions` e preservadas em syncs futuros.
- `pluggy_bills` deve permanecer idempotente por `pluggyAccountId + pluggyBillId`.
- O sync inicial deve sincronizar contas antes de faturas/transações, porque ambos dependem do mapeamento `pluggy_account_id`.
- Após upsert de `pluggy_bills`, materializar `monthly_bill` + `monthly_bill_item` (source=`pluggy`) por mês de `dueDate` (YYYY-MM). Não apagar itens manuais (`source=manual`).
- A reconstrução de despesas derivadas da Pluggy deve ignorar transações ocultadas localmente.
- Se a persistência do item funcionar e o sync falhar, o item não deve ser desfeito. A API deve retornar sucesso parcial com `sync.status = "failed"`.

## Regras de UX

- Erros reais do backend/Pluggy devem aparecer na UI; não substitua por mensagens genéricas como `HTTP 403`.
- Após ingestão ou remoção, invalide queries de itens, contas e transações.
- O card Pluggy em `/settings` deve continuar mostrando falha parcial de sync sem travar a página.

## Regras operacionais

- Ao mudar schema Pluggy, atualize schema Drizzle e migration juntos.
- Não use `db:push` como atalho para corrigir drift local.
- Se `db:migrate` falhar porque o schema local está adiantado em relação a `drizzle.__drizzle_migrations`, resete o banco local e reaplique as migrations.
- Valide mudanças com cURL direto:
  - na Pluggy: `/auth`, `/accounts`, `/bills`, `/v2/transactions`
  - na API local: `/api/pluggy/items`, `/api/pluggy/accounts`, `/api/pluggy/transactions`, `/api/pluggy/sync/:id`
  - webhook: `POST /api/webhooks/pluggy` com payload `{ "event":"item/updated", "itemId":"..." }`

## Deploy / CI

- **Migrations:** `.github/workflows/api-migrate.yml` em push para `dev`/`main` quando mudam arquivos de API/DB (secret `NEON_DATABASE_URL`, injetado como `DATABASE_URL` no job).
- **API production:** `.github/workflows/deploy-api.yml` só quando um **PR é mergeado em `main`** (não roda em push na `dev`, nem em todo push).
  - Paths: `apps/api/**` (e relacionados) no PR
  - Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_API`
  - Projeto Vercel: `vault-api` (Root Directory `apps/api`, install `bun install`)
  - Alias estável: `https://vault-api.albuquerquesz.com`
  - `workflow_dispatch` ainda permite deploy manual de produção
- O projeto Vercel também está **conectado ao GitHub** (previews em branches não-production).
- Smoke pós-deploy do workflow valida `POST /api/webhooks/pluggy`.

## Checklist mínimo antes de encerrar uma mudança

- `bun run db:migrate`
- `bunx tsc --noEmit` em `apps/api` / `packages/api`
- `bunx tsc --noEmit` em `apps/web`
- cURL Pluggy com `X-API-KEY`
- cURL da API local confirmando ingestão idempotente e leitura de contas/transações
