# Spec: escopos OAuth por domínio no MCP

Status (20/11/2026): **Implementada** na branch `feat/visor-gaps-simple` (escopos, filtro de tools e tela de consentimento).

Origem: lacuna #11. Formato `/to-spec`, sem entrevista. O servidor OAuth do Visor publica 13 escopos (`mcp:read`, `mcp:transactions:write`, `mcp:goals:write`, `mcp:budgets:write`…); verificado em `mcp.visorfinance.app/.well-known/oauth-protected-resource`. O Vault já tem OAuth no MCP, mas com um único nível de escrita.

## Problem Statement

Quem conecta um assistente ao Vault por OAuth entrega tudo de uma vez: ler e também gravar renda, teto, metas, categorias, apagar meta e apagar transação. Os escopos que o servidor declara (`openid`, `profile`, `email`, `offline_access`) só descrevem identidade, e a tela de consentimento (`/oauth/consent`) não tem o que mostrar sobre dinheiro. Não dá para dar a um agente só a permissão de mexer em metas.

## Solution

Escopos de domínio no OAuth do MCP, no padrão do Visor. A tela de consentimento lista, em português, o que cada escopo permite, e o token carrega os escopos concedidos. O servidor MCP só registra as tools cujo escopo foi concedido. O bearer `vlt_mcp_` continua só leitura. Tokens emitidos antes da mudança seguem funcionando como hoje, por um prazo.

## User Stories

1. Como usuário, quero ver na tela de consentimento exatamente o que o aplicativo pede para fazer, em português.
2. Como usuário, quero conceder só leitura a um assistente que só precisa consultar.
3. Como usuário, quero conceder escrita só de metas, sem poder alterar transações.
4. Como usuário, quero conceder escrita de orçamento (renda, teto de gasto, percentual de poupança) separada das outras.
5. Como usuário, quero conceder escrita de transações (criar, recategorizar, ocultar, apagar manuais) separada.
6. Como usuário, quero conceder escrita de categorias e regras separada.
7. Como usuário, quero conceder escrita de faturas e contas fixas separada.
8. Como usuário, quero desmarcar escopos na tela de consentimento e conceder só o resto.
9. Como usuário, quero que o assistente não veja nem tente chamar uma tool que o meu token não permite.
10. Como usuário, quero que uma chamada a uma tool fora do escopo falhe com uma mensagem clara, e não com erro genérico.
11. Como usuário, quero que o bearer `vlt_mcp_` continue só de leitura, sem escopos.
12. Como usuário que já conectei um assistente antes, quero que ele continue funcionando até eu reconectar ou até o prazo de transição.
13. Como usuário, quero revogar o acesso e ver os escopos que cada aplicativo tem, na tela de configurações.
14. Como cliente MCP, quero descobrir os escopos disponíveis pelos metadados públicos (`scopes_supported`).
15. Como usuário, quero que pedir um escopo que não existe seja recusado na autorização.

## Implementation Decisions

- Lista inicial de escopos (nomes no padrão `mcp:<domínio>:<ação>`): `mcp:read` (todas as tools de leitura), `mcp:transactions:write`, `mcp:budgets:write` (renda, teto, poupança), `mcp:goals:write`, `mcp:categories:write` (recategorizar, regras, categorias, tags), `mcp:bills:write` (fatura paga, contas fixas). Novos domínios entram junto com as specs que criam as tools.
- Declarar os escopos em `mcp({ scopes })` de `apps/api/src/auth.ts`, mantendo `openid`, `profile`, `email`, `offline_access`.
- `oauth.consent.tsx`: acrescentar rótulos em `SCOPE_LABELS` para cada escopo novo, com a gravidade visível (escrita em destaque). Se a biblioteca permitir conceder um subconjunto, mostrar caixas de seleção por escrita; se não permitir, mostrar tudo-ou-nada e anotar a limitação (a confirmar contra `@better-auth/oauth-provider`).
- `mcp/route.ts`: ler o escopo do JWT de acesso (claim padrão `scope`, a confirmar no teste) e passar um conjunto de escopos para `createVaultMcpServer(dispatch, { scopes })`. Substitui `readOnly` por esse conjunto; o bearer entra com `mcp:read` apenas.
- `mcp/server.ts`: cada `registerTool` declara o escopo exigido; a tool só é registrada se o escopo estiver no conjunto. Assim `tools/list` já mostra só o permitido e `tools/call` de uma tool fora do escopo falha como "tool não existe".
- Transição: token sem nenhum escopo `mcp:*` é tratado como hoje (leitura e escrita completas) e gera um log `legacy_token`, até uma data fixada na hora da entrega. Depois disso, passa a valer só o que foi concedido.
- A resposta de erro para escopo ausente segue `{ error, code }`, com `code` `INSUFFICIENT_SCOPE`.
- Sem mudança nas rotas da API: elas continuam sendo chamadas em processo pelo usuário do token.

## Testing Decisions

Seam único: o MCP remoto por JSON-RPC (`initialize`, `tools/list`, `tools/call`), com o padrão de `apps/api/src/mcp/server.test.ts`.

- Token só com `mcp:read` lista só leitura; `tools/call` de escrita falha.
- Token com `mcp:goals:write` lista `create_goal`, `update_goal` e `delete_goal`, mas não `set_budget_income`.
- Token com vários escopos lista a união.
- Bearer `vlt_mcp_` lista só leitura, como hoje.
- Token legado, sem escopos `mcp:*`, lista tudo e registra o log.
- Escopo inexistente na autorização é recusado.
- Verificar, contra uma resposta real, o nome do claim de escopo no JWT.

## Out of Scope

Escopos de pagamento (o Vault não move dinheiro), permissões por recurso (por meta, por conta), escopos para as tools de `memories`, `routines` e `preferences` do Visor (não há equivalente), expiração curta de token.

## Further Notes

- O MCP do Vault **já usa OAuth** (provider do better-auth, registro dinâmico de cliente, consentimento em `/oauth/consent`). Esta spec acrescenta granularidade, não um OAuth novo.
- Risco: clientes MCP que pedem só os escopos de identidade (`openid`…) passariam a receber só leitura. Por isso o período de transição e o log. Confirmar com Claude, ChatGPT e Cursor quais escopos pedem hoje.
- Entregar antes das specs 04, 05, 06 e 07 evita criar tools de escrita sem escopo.
