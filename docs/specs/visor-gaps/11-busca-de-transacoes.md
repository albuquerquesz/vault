# Spec: busca e edição de transações

Status (20/11/2026): **Implementada** na branch `feat/visor-gaps-simple` (API e MCP; sem busca na web). Desvio: `includeHidden` ficou de fora, porque lançamentos ocultos já saem do ledger e não há como listá-los hoje.

Origem: lacuna #13. Formato `/to-spec`, sem entrevista. A página `/mcp` do Visor descreve "busque, edite, categorize e marque transações em lote".

## Problem Statement

`list_transactions` devolve o mês inteiro. Para achar "tudo que gastei no Mercado Livre este ano" o assistente precisa baixar mês a mês e filtrar sozinho. Uma transação manual com valor ou data errados só pode ser apagada e criada de novo, porque não há edição.

## Solution

Uma busca por texto, valor, categoria e período, com paginação, na API e no MCP. E uma edição de transação **manual** (valor, data, categoria, nota). Lançamentos vindos do banco continuam imutáveis em valor e data, porque a fonte de verdade é o banco.

## User Stories

1. Como usuário, quero buscar transações por parte da descrição, ignorando maiúsculas e acentos.
2. Como usuário, quero filtrar por intervalo de datas.
3. Como usuário, quero filtrar por faixa de valor (mínimo e máximo).
4. Como usuário, quero filtrar por categoria e por tipo (gasto ou receita).
5. Como usuário, quero combinar os filtros.
6. Como usuário, quero resultados paginados, com o total e a próxima página.
7. Como usuário, quero resultados ordenados do mais recente para o mais antigo.
8. Como usuário, quero que a busca cubra transações bancárias e manuais.
9. Como usuário, quero que lançamentos ocultos não apareçam, a menos que eu peça.
10. Como usuário, quero editar valor, data, categoria e nota de uma transação manual minha.
11. Como usuário, quero que tentar editar valor ou data de um lançamento do banco seja recusado com mensagem clara.
12. Como usuário, quero que editar a categoria de um lançamento do banco continue possível (já é, via recategorizar).
13. Como usuário, quero que editar uma transação de outro usuário falhe sem alterar nada.
14. Como usuário com o bearer `vlt_mcp_`, quero poder buscar (leitura), mas não editar.
15. Como usuário, quero que uma busca sem período use os últimos 3 meses, para não varrer tudo por engano.

## Implementation Decisions

- Rota `GET /api/finance/transactions/search` com `q`, `from`, `to`, `minAmount`, `maxAmount`, `category`, `kind`, `includeHidden`, `limit` (padrão 50, máximo 200) e `cursor`. `allowMcpToken`.
- A resposta tem a mesma forma de `list_transactions` (id, data, valor com sinal, categoria, conta), mais `nextCursor` e `total`.
- Texto: `ILIKE` com `%` e `_` escapados. Se a extensão `unaccent` estiver disponível no Postgres (Neon), usar; senão, comparar com a descrição normalizada em coluna própria preenchida no sync. **A confirmar** qual das duas vale.
- Período obrigatório internamente: sem `from`/`to`, os últimos 3 meses. Máximo de 24 meses por busca.
- Valores de despesas bancárias seguem a mesma convenção de sinal do `list_transactions` (negativo é gasto).
- Edição de transação manual: `PATCH /api/finance/transactions/manual/:id` com os campos opcionais; zod igual ao de criação (valor positivo, data `AAAA-MM-DD`, categoria até 64 caracteres, nota até 280).
- MCP: `search_transactions` (leitura) e `update_manual_transaction` (escrita; não é destrutiva).
- Índice composto em (`user_id`, data) para a busca; índice de trigramas só se a medição pedir.

## Testing Decisions

Seam: o MCP. A busca em SQL precisa de Postgres de verdade nos testes (o Vault ainda não tem esse ambiente; ver a spec 06); a montagem dos filtros é testada como função pura.

- Busca por texto ignora maiúsculas e acento (a depender da decisão acima).
- Filtros de valor e data se combinam com o texto.
- Paginação devolve todas as linhas sem repetir nem pular.
- Sem período, só os últimos 3 meses.
- Lançamento oculto some, a menos que `includeHidden`.
- Editar manual atualiza os campos; editar lançamento do banco devolve erro de validação.
- Editar transação de outro usuário devolve 404.
- Bearer lê `search_transactions` e não vê `update_manual_transaction`.

## Out of Scope

Editar valor ou data de lançamento do banco, busca por conta, busca em notas de outras pessoas (spec 15), regras (spec 05), apagar transação (já existe `delete_manual_transactions`).

## Further Notes

- A recusa de editar lançamento bancário é decisão de produto, não limitação: manter o Open Finance como fonte única.
