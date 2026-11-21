# Spec: contas fixas e receitas recorrentes cadastradas à mão

Status (20/11/2026): Aprovada pelo Victor (20/11), **sem financiamento**. Ainda não implementada.

Origem: lacuna #8. Formato `/to-spec`, sem entrevista. A página `/mcp` do Visor cita "parcelas pagas e restantes, contas fixas, receitas recorrentes e financiamentos, todos nas suas projeções". **Decisão do Victor (20/11): financiamento fica de fora.**

## Problem Statement

O Vault só enxerga o que o banco informa ou o que a detecção de assinatura infere. Aluguel pago por boleto, salário que cai em conta não conectada, mesada: nada disso existe para o Vault antes de acontecer, então o mês e a projeção ignoram esses compromissos.

## Solution

Itens recorrentes cadastrados pelo usuário: uma conta fixa (saída) ou uma receita recorrente (entrada). Cada item tem valor, dia do mês e período. Eles entram no mês como "esperado" e na projeção (spec 01). Quando chega uma transação real que casa com o item, o item passa a "realizado" e não conta duas vezes.

## User Stories

1. Como usuário, quero cadastrar uma conta fixa com nome, valor e dia do mês.
2. Como usuário, quero cadastrar uma receita recorrente (salário, aluguel recebido) com valor e dia.
3. Como usuário, quero definir a partir de que mês e até qual mês o item vale.
4. Como usuário, quero editar o valor de um item daqui para a frente, sem mudar o passado.
5. Como usuário, quero encerrar um item sem apagar o histórico.
6. Como usuário, quero ver os itens esperados do mês ao lado do que realmente aconteceu.
7. Como usuário, quero que um item vire "realizado" quando chegar uma transação parecida, para o mês não contar em dobro.
8. Como usuário, quero marcar um item como pago à mão quando o banco não informar.
9. Como usuário, quero que os itens entrem na projeção de saldo.
10. Como usuário, quero cadastrar, listar, editar e apagar itens pelo assistente (MCP).
11. Como usuário com o bearer `vlt_mcp_`, quero apenas listar.
12. Como usuário, quero que apagar um item venha marcado como destrutivo no MCP.
13. Como usuário, quero que dia 31 em mês curto caia no último dia do mês.

## Implementation Decisions

- Tabela `recurring_item`: `id`, `user_id`, `kind` (`bill` | `income`), `name`, `amount`, `day_of_month`, `start_month`, `end_month` (nulo = sem fim), `category`, `ended_at`, timestamps.
- Mudança de valor "daqui para a frente" cria nova linha com `start_month` novo e encerra a anterior em `end_month` do mês anterior: histórico preservado sem tabela de versões.
- Tabela `recurring_occurrence` (`item_id`, `month`, `status` esperado | realizado | pago_manual, `matched_transaction_ref`): permite marcar e consultar sem recalcular tudo.
- Casamento com transação real: mesmo mês, valor dentro de uma tolerância (padrão 5%), descrição contendo o nome do item ou palavra-chave opcional `match_text`. Função pura. Primeira versão sem IA; se não casar, o item segue "esperado" e o usuário marca à mão.
- Rotas CRUD em `routers/finance.ts` e `GET /recurring?month=` que devolve itens com `status` e valor esperado.
- MCP: `list_recurring_items` (leitura), `create_recurring_item`, `update_recurring_item`, `mark_recurring_paid` (escrita), `delete_recurring_item` (escrita, `destructiveHint`).
- A projeção (spec 01) e a visão do mês leem `recurring_item`; o gasto classificado do dashboard continua só com transações reais, para o número da tela não mudar.

## Testing Decisions

Função de ocorrência e de casamento testada com fixtures. Seam: o MCP.

- Dia 31 em fevereiro cai no dia 28 ou 29.
- Item que casa com uma transação real vira "realizado" e não soma duas vezes na projeção.
- Mudança de valor preserva o mês anterior com o valor antigo.
- Receita recorrente entra com sinal contrário ao da conta fixa.
- Bearer lista, mas não vê escrita; apagar anuncia destrutivo.

## Out of Scope

Financiamento (decisão do Victor), cálculo de juros e CET, importar de planilha, lembrete de vencimento (usar a spec 08 depois), pagamento de conta.

## Further Notes

- Depende da spec 01 só no uso; o cadastro vale sozinho na tela do mês.
- Parcelas de cartão **não** vão aqui: vêm da Pluggy (spec 03).
