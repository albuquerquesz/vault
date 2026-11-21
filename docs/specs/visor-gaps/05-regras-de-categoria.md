# Spec: regras automáticas de categoria

Status (21/11/2026): implementada (API, MCP), revista contra o código. A migração é a 0031 (`0031_category_rules_tags`, compartilhada com a spec 06).

Origem: lacuna #6. Formato `/to-spec`, sem entrevista. O Visor lista "regras automáticas" em todos os planos e a página `/mcp` fala em "criar regras de categorização automática".

## Problem Statement

Recategorizar no Vault é manual e em lote: o usuário escolhe transações e dá uma categoria nova (`category_override`). Na próxima sincronização, as transações novas da mesma loja chegam com a categoria original da Pluggy, e ele refaz o trabalho todo mês.

## Solution

Regras que o usuário cria uma vez ("descrição contém IFOOD → Delivery") e que o Vault aplica sozinho às transações novas e, a pedido, ao histórico. A categoria manual continua mandando mais que qualquer regra, e a regra manda mais que a categoria da Pluggy.

## User Stories

1. Como usuário, quero criar uma regra "descrição contém X → categoria Y".
2. Como usuário, quero também regras "começa com" e "é igual a", para ser mais preciso quando preciso.
3. Como usuário, quero que transações novas já cheguem na categoria da regra depois da sincronização.
4. Como usuário, quero aplicar uma regra recém-criada ao histórico, para limpar o que já passou.
5. Como usuário, quero ver antes quantas transações uma regra mudaria, sem aplicar.
6. Como usuário, quero que uma recategorização manual minha nunca seja desfeita por uma regra.
7. Como usuário, quero definir a ordem de prioridade entre regras que se sobrepõem.
8. Como usuário, quero desativar uma regra sem apagá-la.
9. Como usuário, quero listar e apagar minhas regras.
10. Como usuário, quero que a regra mude só o nome exibido da categoria, sem mudar se a transação conta como gasto ou receita (mesma garantia de `recategorize_transactions`).
11. Como usuário, quero criar, listar, aplicar e apagar regras pelo assistente (MCP).
12. Como usuário com o bearer `vlt_mcp_`, quero apenas listar regras.
13. Como usuário, quero que apagar uma regra venha marcado como destrutivo no MCP.
14. Como usuário, quero que o casamento de texto ignore maiúsculas, minúsculas e acentos.

## Implementation Decisions

Revisão de 21/11/2026 contra o código (o que mudou em relação ao rascunho está em "Correções da revisão" no fim).

- Tabela nova `category_rule`: `id`, `user_id`, `match_type` (`contains` | `starts_with` | `equals`), `pattern`, `category`, `priority` (inteiro, menor vence; empate vai para a regra mais antiga), `enabled`, timestamps.
- A regra casa com a **descrição** da transação **bancária** (`pluggy_transactions.description`), sem caixa, acento nem espaços repetidos (`normalizeLabel`, em `services/category-rules.ts`).
- Precedência da categoria exibida (`resolveDisplayCategory`): `category_override` manual, depois a primeira regra ativa que casar, depois a categoria da Pluggy, depois "Outros". A regra não grava em `category_override`.
- **Sem coluna `rule_category`.** O rascunho previa materializar a regra numa coluna nova. Não precisa: a categoria exibida já é resolvida em três pontos (o ledger em `pluggy-ledger.ts`, a reconstrução das linhas `expense` em `pluggy.ts` e a detecção de assinaturas) e o ledger alimenta lista, busca, gráficos, limites por categoria e alerta de ritmo. Todos passam a usar o mesmo `displayCategory`. Uma coluna a mais seria um segundo estado para ficar fora de sincronia quando a regra muda.
- **A regra vale na hora, inclusive no histórico.** Como não há coluna, criar, editar, ativar/desativar ou apagar uma regra muda o que se vê em tudo e reconstrói as linhas `expense` derivadas do banco (`rebuildExpensesFromStoredTransactions`, o mesmo caminho do sync). Apagar ou desativar devolve a categoria da Pluggy. Consequência: não existe "aplicar só às novas". A escolha antes de gravar é a pré-visualização. `POST /api/finance/category-rules/apply` continua existindo como reparo (reconstrói e informa quantas transações vêm de regra).
- A classificação (gasto, receita, ignorado) em `pluggy-classification.ts` **não foi alterada** e continua usando só a categoria original da Pluggy. Uma transferência própria ("Same person transfer"), investimento ou pagamento de fatura que case com uma regra continua fora dos gastos e fora das listas.
- **Lançamentos manuais ficam de fora.** O rascunho dizia que despesas manuais também recebiam regra pelo campo `category`. Isso está errado: a categoria de um lançamento manual é uma escolha explícita do usuário (equivale ao override) e não existe a categoria "original" para voltar se a regra for apagada. Regras valem só para transações bancárias.
- Pré-visualização: `POST /api/finance/category-rules/preview` com `matchType`, `pattern` e, opcional, `category`. Devolve `matched` (casam, excluindo ignoradas e as com categoria manual), `wouldChange` (as que mudariam de nome) e até 20 exemplos. Não grava nada.
- Rotas em `routers/finance-organization.ts`: `GET/POST /category-rules`, `PATCH/DELETE /category-rules/:id`, `POST /category-rules/preview`, `POST /category-rules/apply`. Leitura e preview aceitam o bearer `vlt_mcp_`.
- MCP (escopo `mcp:categories:write` para escrita): `list_category_rules` e `preview_category_rule` (leitura, o bearer enxerga), `create_category_rule`, `update_category_rule` (muda prioridade e `enabled`; faltava no rascunho, mas as histórias 7 e 8 pedem), `apply_category_rules` e `delete_category_rule` (`destructiveHint`).

## Testing Decisions

Função pura de casamento e precedência, testada como `pluggy-classification.test.ts`. Seam: o MCP.

- `contains`, `starts_with` e `equals` casam como esperado, com e sem acento.
- Duas regras que casam: vence a de menor `priority`.
- `category_override` manual vence a regra.
- Regra desativada não casa.
- A regra não muda se a transação conta como gasto ou receita.
- Pré-visualização devolve a contagem sem gravar e ignora o que não conta como gasto/receita e o que tem categoria manual.
- Bearer lista regras, mas não vê as tools de escrita.
- Integração (PGlite): criar a regra muda lista, gráfico por categoria, limites e a linha `expense` derivada; o resultado do mês (`partial-result`) não muda; lançamento manual com texto parecido não muda; desativar, trocar prioridade e apagar revertem.

## Out of Scope

Regras por valor ou por conta, regras sobre lançamentos manuais, aplicar só às transações novas, aprendizado automático por IA, regras compartilhadas entre pessoas (spec 15), tags por regra (spec 06).

## Further Notes

- Reaproveita a ideia de `recategorize_transactions`: a regra é a versão automática dele, e o override manual continua mandando.
- Renomear ou juntar categorias (spec 06) atualiza também `category_rule.category`.
- Decidido: não expor a regra na coluna `category_override`, para não confundir "o usuário escolheu" com "uma regra escolheu".

## Correções da revisão

1. Coluna `rule_category` removida (segundo estado sem necessidade; ver acima).
2. Lançamentos manuais não recebem regra (o rascunho dizia que sim).
3. "Ao fim do sync" e "aplicar ao histórico" viraram o mesmo caminho: a regra vale sempre, o sync já reconstrói as linhas derivadas.
4. Faltava a tool de edição (prioridade e desativar) no MCP.
5. A classificação mantém o contrato: nada em `pluggy-classification.ts` foi tocado, e há teste de que a regra não muda gasto, receita nem o que é ignorado.
