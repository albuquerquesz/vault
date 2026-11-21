# Spec: categorias e tags próprias

Status (21/11/2026): implementada (API, MCP), revista contra o código. Migração 0031 (`0031_category_rules_tags`, compartilhada com a spec 05).

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

- Tabela `category` (`id`, `user_id`, `name`, `name_key`, `archived`, `created_at`), única em (`user_id`, `name_key`). **Sem migração de preenchimento.** O rascunho previa copiar para ela as categorias já usadas; isso não funciona em SQL puro (sem `unaccent` não há como fazer a chave sem acento) e encheria o catálogo com os nomes em inglês da Pluggy. O catálogo que o usuário vê é a união de `category` (criadas, renomeadas, arquivadas à mão) com os nomes em uso, calculada na leitura (`GET /categories`). A categoria só ganha linha na tabela quando alguém a cria, arquiva, renomeia ou junta.
- **Chave de nome** (`name_key`): minúsculas, **sem acento**, espaços colapsados (`normalizeLabel`). O rascunho dizia só `trim` e minúsculas, o que não junta "Alimentacao" e "Alimentação", o exemplo do próprio Problem Statement, e destoa dos limites por categoria e da busca, que já ignoram acento. O nome exibido guarda a grafia do usuário, com espaços colapsados.
- As operações são por **nome**, não por id (categorias que só existem porque transações as usam não têm linha nem id). `list_categories` devolve `id` (nulo nesse caso) e `archived`.
- Renomear e juntar (`moveCategory`, `services/category-catalog.ts`) rodam numa transação de banco e atualizam: `expense.category` dos lançamentos manuais, `pluggy_transactions.category_override`, `category_rule.category`, `monthly_category_limit` e **`recurring_item.category`** (faltava no rascunho; a spec 07 já existe). Linhas bancárias que mostram o nome da própria Pluggy (sem override) ganham um override com o nome novo; sem isso renomear "Shopping" não faria nada. Linhas cujo nome vem de uma regra são cobertas pela atualização da regra. Limites: se o destino já tem limite no mesmo mês, **vale o do destino** e o da origem é descartado; os alertas já enviados da categoria antiga são limpos. As linhas `expense` derivadas do banco são reconstruídas logo depois, fora da transação, porque podem ser recalculadas a qualquer momento.
- Apagar categoria em uso exige `moveTo` (equivale a juntar); sem uso, só sai do catálogo (404 se não existe). "Em uso" inclui o nome que a Pluggy mostra, não só overrides.
- Renomear para um nome que já está no catálogo devolve 409 (`CONFLICT`) e indica `merge_categories`.
- Tabela `tag` (`id`, `user_id`, `name`, `name_key`) e `transaction_tag` com **duas chaves estrangeiras reais**, `pluggy_transaction_id` e `expense_id`, exatamente uma preenchida (`CHECK`), ambas `ON DELETE CASCADE`. O rascunho propunha `transaction_kind` + `transaction_ref` sem chave estrangeira: apagar uma transação manual ou um item da Pluggy deixaria ligações órfãs. Só se marcam transações bancárias (`pluggy_transactions.id`, o mesmo id que `list_transactions` mostra) e manuais (`expense.id`, origem diferente de `pluggy`); as linhas `expense` derivadas do banco são recriadas a cada sync e nunca recebem tag.
- Rotas em `routers/finance-organization.ts`: `GET/POST /categories`, `POST /categories/rename|merge|archive`, `DELETE /categories`, `GET/POST /tags`, `DELETE /tags/:id`, `POST /transactions/tag` e `/untag` (até 100 ids), `GET /tags/:id/total?from=&to=` (período de até 24 meses). `GET /transactions?month=&tag=<id>` filtra, e cada transação da lista passa a trazer `tags`.
- **Total de uma tag**: soma as despesas da tag, sem abater estornos, a mesma regra do gráfico por categoria. O rascunho dizia "mesmo critério do dashboard", mas o dashboard abate estornos e a lista já devolve estorno como entrada, então a soma por tag não consegue distinguir; fica documentado.
- MCP, todas as de escrita no escopo `mcp:categories:write` (a de tags também, por serem organização): `create_category`, `rename_category`, `merge_categories`, `delete_category` (todas `destructiveHint`), `archive_category` (nova), `create_tag`, `tag_transactions`, `untag_transactions`, `delete_tag` (nova, destrutiva). Leitura: `list_categories` (com `archived`), `list_tags`, `get_tag_total` e o parâmetro `tag` em `list_transactions`.

## Testing Decisions

Seam: o MCP (nomes, rotas, escopos, `destructiveHint` em `server.test.ts`) e testes de integração com Postgres de verdade (PGlite, `apps/api/test-integration/organization.integration.test.ts`). O ambiente de teste que o rascunho pedia para criar já existe.

- Renomear atualiza despesas manuais, override de transações bancárias, nome da Pluggy sem override, regras, limites e contas fixas.
- Renomear para nome existente e apagar em uso sem `moveTo` falham (409) e não alteram nada.
- Juntar deixa uma só e remove a antiga do catálogo; o limite do destino é mantido.
- Uma transação aceita várias tags e uma categoria; repetir a marcação não duplica.
- Filtrar por tag devolve só as marcadas, dos dois tipos de origem.
- Apagar a transação manual ou a tag remove as ligações.
- Dois nomes que diferem só em caixa, acento e espaço colidem (409).
- Bearer não vê as tools de escrita.

## Out of Scope

Categorias aninhadas, cor e ícone por categoria, limite por tag, regras por tag, compartilhar categorias entre pessoas (spec 15).

## Further Notes

- As specs 02, 05 e 07 já existem, então renomear e juntar mexem em todas elas.
- A atomicidade vale para as tabelas de origem; os testes cobrem recusa antes de qualquer escrita, mas não forçam uma falha no meio da transação.
- Tags (M) e categorias (S) saíram juntas, na mesma migração.
