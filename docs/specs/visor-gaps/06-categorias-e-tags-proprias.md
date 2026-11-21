# Spec: categorias e tags próprias

Status (20/11/2026): A rever.

Origem: lacuna #7. Formato `/to-spec`, sem entrevista. O Visor oferece "criar suas próprias categorias e tags" no plano Pro.

## Problem Statement

No Vault a categoria é texto livre: existe quando alguém a usa, `list_categories` só conta o que já apareceu, e um erro de digitação ("Alimentacao" e "Alimentação") cria uma categoria nova. Não há como renomear, juntar duas ou criar uma antes de usar. Tags não existem: uma compra de viagem espalhada em Transporte, Alimentação e Hospedagem não tem um jeito de ser agrupada.

## Solution

Duas partes. Um catálogo de categorias por usuário, com criar, renomear (que atualiza tudo que usava o nome antigo), juntar e arquivar. E tags livres que se aplicam a várias transações e filtram listas e relatórios, sem mexer na categoria.

## User Stories

1. Como usuário, quero criar uma categoria antes de usá-la.
2. Como usuário, quero renomear uma categoria e ver todas as transações antigas passarem para o nome novo.
3. Como usuário, quero juntar duas categorias em uma, para limpar duplicadas.
4. Como usuário, quero arquivar uma categoria sem uso, para ela sair das sugestões.
5. Como usuário, quero que apagar uma categoria em uso exija indicar para qual outra mover as transações.
6. Como usuário, quero que as categorias que já usei apareçam no catálogo automaticamente.
7. Como usuário, quero criar uma tag e aplicá-la a várias transações de uma vez.
8. Como usuário, quero remover uma tag de uma transação sem apagar a tag.
9. Como usuário, quero filtrar as transações do mês por tag.
10. Como usuário, quero ver o total gasto de uma tag no período.
11. Como usuário, quero que uma transação possa ter várias tags e uma só categoria.
12. Como usuário, quero gerenciar categorias e tags pelo assistente (MCP).
13. Como usuário com o bearer `vlt_mcp_`, quero apenas ler categorias e tags.
14. Como usuário, quero que renomear, juntar e apagar venham marcados como destrutivos no MCP.
15. Como usuário, quero que dois nomes iguais, com maiúsculas e espaços diferentes, sejam tratados como a mesma categoria.

## Implementation Decisions

- Tabela `category`: `id`, `user_id`, `name`, `archived`, `created_at`; único em (`user_id`, nome normalizado). Preenchida por migração com as categorias já usadas em `expense.category`, `pluggy_transactions.category_override` e `category_override` das regras.
- Renomear e juntar atualizam `expense.category`, `pluggy_transactions.category_override`, `category_rule.category` (spec 05) e `monthly_category_limit.category` (spec 02), numa transação de banco. É a parte mais delicada: precisa ser atômica.
- Apagar categoria em uso exige `moveTo`; sem uso, apaga direto.
- Tabela `tag` (`id`, `user_id`, `name`) e uma tabela de ligação `transaction_tag` com `transaction_kind` (`bank` | `manual`), `transaction_ref` (id da linha) e `tag_id`. Duas origens de transação justificam a coluna de tipo.
- Rotas CRUD de categoria e tag; `POST /transactions/tag` e `/untag` em lote (até 100 ids, como `hide`).
- `GET /transactions?month=&tag=` filtra; `GET /tags/:id/total?from=&to=` soma pelo mesmo critério do dashboard.
- MCP: `list_categories` ganha `archived` e id; novas `create_category`, `rename_category`, `merge_categories`, `delete_category`, `create_tag`, `tag_transactions`, `untag_transactions`, `list_tags`. As que renomeiam, juntam ou apagam levam `destructiveHint`.
- Normalização de nome: `trim` e minúsculas para unicidade, mantendo o nome como o usuário escreveu para exibir.

## Testing Decisions

Seam: o MCP. Renomear e juntar precisam de testes com Postgres de verdade, porque a atomicidade é o ponto. O Vault ainda não tem esse tipo de teste (os atuais usam dispatch falso e funções puras); criar um ambiente de teste com Postgres descartável faz parte desta spec.

- Renomear atualiza despesas manuais, override de transações bancárias, regras e limites, ou nada (atômico).
- Juntar duas categorias deixa uma só e remove a antiga do catálogo.
- Apagar em uso sem `moveTo` falha e não altera nada.
- Uma transação aceita várias tags e uma categoria.
- Filtrar por tag devolve só as marcadas, dos dois tipos de origem.
- Dois nomes que diferem só em caixa e espaço colidem e devolvem erro.
- Bearer não vê as tools de escrita.

## Out of Scope

Categorias aninhadas, cor e ícone por categoria, limite por tag, regras por tag, compartilhar categorias entre pessoas (spec 15).

## Further Notes

- Depende das specs 02 e 05 apenas na hora de renomear; pode ser entregue antes delas, ignorando essas tabelas até existirem.
- Tags (M) e categorias (S) podem sair em PRs separados.
