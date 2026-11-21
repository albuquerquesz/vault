# Spec: regras automáticas de categoria

Status (20/11/2026): A rever.

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

- Tabela nova `category_rule`: `id`, `user_id`, `match_type` (`contains` | `starts_with` | `equals`), `pattern`, `category`, `priority` (inteiro, menor vence), `enabled`, timestamps.
- Precedência da categoria exibida: `category_override` manual, depois a primeira regra ativa que casar (por `priority`), depois a categoria da Pluggy. A regra não grava em `category_override` (para continuar distinguível do que é manual); é resolvida na leitura e materializada em coluna própria `rule_category` na transação para ficar barato de consultar e agrupar.
- Aplicação: ao fim do sync de um item, uma função pura casa as regras com as transações sem `category_override` e atualiza `rule_category`. Um endpoint `POST /api/finance/category-rules/apply` reaplica ao histórico.
- A classificação (gasto, receita, ignorado) em `pluggy-classification.ts` continua usando a categoria **original**, como já faz com o override; regra só altera o nome exibido.
- Pré-visualização: `POST /api/finance/category-rules/preview` com a regra candidata, devolve a contagem e até 20 exemplos.
- Rotas CRUD em `routers/finance.ts`. MCP: `list_category_rules` (leitura), `create_category_rule`, `apply_category_rules` (escrita), `delete_category_rule` (escrita, `destructiveHint`).
- Normalização para casar: minúsculas, sem acento, `trim`.
- Despesas manuais (`expense`, origem `cash`) também recebem regra, pelo campo `category`.

## Testing Decisions

Função pura de casamento e precedência, testada como `pluggy-classification.test.ts`. Seam: o MCP.

- `contains`, `starts_with` e `equals` casam como esperado, com e sem acento.
- Duas regras que casam: vence a de menor `priority`.
- `category_override` manual vence a regra.
- Regra desativada não casa.
- A regra não muda se a transação conta como gasto ou receita.
- Pré-visualização devolve a contagem sem gravar.
- Bearer lista regras, mas não vê as tools de escrita.

## Out of Scope

Regras por valor ou por conta, aprendizado automático por IA, regras compartilhadas entre pessoas (spec 15), tags por regra (spec 06).

## Further Notes

- Reaproveita `recategorize_transactions`: a regra é a versão automática dele.
- Pergunta aberta: expor as regras no mesmo nome de coluna `category_override`? Decidi que não, para não confundir "o usuário escolheu" com "uma regra escolheu".
