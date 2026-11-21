# Spec: limite de gasto por categoria

Status (20/11/2026): **Implementada** na branch `feat/visor-gaps-simple` (API e MCP; a seção na tela do teto de gasto, na web, ainda não).

Origem: lacuna #2. Formato `/to-spec`, sem entrevista. O Visor lista "gastos por categoria, com limite em cada uma" em todos os planos.

## Problem Statement

O Vault tem um teto de gasto para o mês inteiro (`monthly_spending_goal`). Quem quer segurar um tipo de gasto (alimentação, transporte, lazer) não consegue: o teto geral não mostra que 80% dele já foi só com delivery.

## Solution

Um limite opcional por categoria e por mês. O Vault mostra, para cada categoria com limite, quanto já foi, quanto resta e o percentual, e avisa (spec 08) quando o limite estoura. O gasto de cada categoria vem da mesma classificação que alimenta o dashboard, já com a recategorização do usuário.

## User Stories

1. Como usuário, quero definir um limite em reais para uma categoria em um mês `AAAA-MM`.
2. Como usuário, quero que definir de novo o limite da mesma categoria no mesmo mês substitua o valor.
3. Como usuário, quero recusar limite zero ou negativo.
4. Como usuário, quero ver, por categoria com limite, o gasto do mês, o que resta e o percentual usado.
5. Como usuário, quero ver quais categorias já passaram do limite.
6. Como usuário, quero copiar os limites do mês anterior para o mês atual com uma chamada, para não digitar tudo todo mês.
7. Como usuário, quero remover o limite de uma categoria.
8. Como usuário, quero que o gasto da categoria use o nome que eu escolhi ao recategorizar, e não o nome original da Pluggy.
9. Como usuário, quero que investimento, transferência para mim mesmo e pagamento de fatura não contem no gasto de nenhuma categoria.
10. Como usuário, quero ler e gravar os limites pelo assistente (MCP).
11. Como usuário com o bearer `vlt_mcp_`, quero apenas ler os limites; gravar e apagar exigem OAuth.
12. Como usuário, quero que apagar um limite venha marcado como destrutivo no MCP.
13. Como usuário, quero o mesmo erro `{ error, code }` da API para mês inválido.
14. Como usuário, quero que o nome da categoria seja comparado sem diferença de maiúsculas e espaços nas pontas.

## Implementation Decisions

- Tabela nova `monthly_category_limit`: `id`, `user_id`, `month` (`AAAA-MM`), `category`, `target_amount`, timestamps; único em (`user_id`, `month`, `category`). Migração Drizzle simples.
- Rotas em `routers/finance.ts`, no mesmo molde de `/spending-goal`: `GET /category-limits?month=` (com `allowMcpToken`), `POST /category-limits` (upsert), `DELETE /category-limits`, `POST /category-limits/copy` (de mês para mês). Validação com zod e `monthPattern`.
- O gasto por categoria reaproveita a classificação existente (`loadClassifiedPluggyTransactions` mais despesas manuais), agrupando pela categoria efetiva (`category_override` quando houver). Nenhuma lógica de classificação nova.
- Comparação de categoria: `trim` e minúsculas.
- Tela: seção de limites na página `spending-goal`, com barra de progresso por categoria.
- MCP: `get_category_limits` (leitura), `set_category_limit` (escrita), `delete_category_limit` (escrita, `destructiveHint`), `copy_category_limits` (escrita).
- Sem rollover de saldo entre meses.

## Testing Decisions

Função pura de cálculo (restante, percentual, estourou) testada como `calculateMonthlySpendingGoal`. Seam: MCP, no padrão de `server.test.ts`.

- Gravar duas vezes o mesmo mês/categoria deixa um valor só, o segundo.
- Limite zero ou negativo é recusado.
- Categoria recategorizada pelo usuário soma no nome novo.
- Pagamento de fatura, investimento e transferência interna não entram.
- Copiar do mês anterior não sobrescreve limite que já existe no destino.
- Bearer não lista as tools de escrita; `tools/call` de escrita falha.
- Mês inválido devolve o `code` da API.

## Out of Scope

Limite por tag (spec 06), limite compartilhado entre pessoas (spec 15), rollover, sugestão automática de limite, alerta (spec 08).

## Further Notes

- Depende só do que já existe; é a mais barata do pacote.
- Decidir se o teto geral do mês deve ser a soma dos limites quando houver limites. Começar independente: o teto geral continua valendo sozinho.
