## Agent skills

### Comunicação

Use skill `caveman` em toda resposta: saída curta, direta, sem floreio. Manter precisão técnica. Só sair desse modo se usuário pedir explicitamente `stop caveman` ou `normal mode`.

### Pluggy BYOK

Antes de alterar o módulo Pluggy, leia `docs/agents/pluggy-byok.md`. Esse documento é a fonte de verdade para o fluxo de ingestão, sync inicial, autenticação BYOK e validações obrigatórias do módulo.

### Testes

- `bun test src` (em `apps/api`): testes unitários e do seam do MCP, com funções puras e `dispatch` falso. Precisam das variáveis de ambiente do Vault.
- `bun run test:integration` (em `apps/api`): sobe um Postgres descartável (PGlite) com as migrações reais e chama as rotas reais do app. Não precisa de Docker nem de variáveis de ambiente e nunca toca um banco de verdade. Rota nova que grava no banco deve ganhar um caso em `apps/api/test-integration/`.
