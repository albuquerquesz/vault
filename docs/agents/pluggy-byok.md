# Pluggy BYOK

Leia este documento antes de alterar:

- rotas `packages/api/src/routers/pluggy.ts`
- client `packages/api/src/clients/pluggy/*`
- service `packages/api/src/services/pluggy.ts`
- schema/migrations Pluggy
- UI de settings e hooks `apps/web/src/features/pluggy/*`

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
7. backend sincroniza contas e transações dos últimos 90 dias
8. frontend invalida `pluggy-items`, `pluggy-accounts` e `pluggy-transactions`

## Regras da API Pluggy

- Autenticação server-to-server começa em `POST https://api.pluggy.ai/auth`.
- Leitura de produtos usa `X-API-KEY`; não depende do `connectToken`.
- Contas vêm de `GET /accounts?itemId=...`.
- Transações vêm de `GET /v2/transactions?accountId=...&dateFrom=...&dateTo=...`.
- A paginação de transações usa `results` e `next`. Não assuma `data`, `pageSize` ou endpoint por item.

## Regras de persistência

- `pluggy_items` deve permanecer idempotente por `userId + pluggyItemId`.
- `pluggy_accounts` deve permanecer idempotente por `pluggyItemId + pluggyAccountId`.
- `pluggy_transactions` deve permanecer idempotente por `pluggyItemId + pluggyTransactionId`.
- O sync inicial deve sincronizar contas antes de transações, porque transações dependem do mapeamento `pluggy_account_id`.
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
  - na Pluggy: `/auth`, `/accounts`, `/v2/transactions`
  - na API local: `/api/pluggy/items`, `/api/pluggy/accounts`, `/api/pluggy/transactions`, `/api/pluggy/sync/:id`

## Checklist mínimo antes de encerrar uma mudança

- `bun run db:migrate`
- `bunx tsc --noEmit` em `packages/api`
- `bunx tsc --noEmit` em `apps/web`
- cURL Pluggy com `X-API-KEY`
- cURL da API local confirmando ingestão idempotente e leitura de contas/transações
