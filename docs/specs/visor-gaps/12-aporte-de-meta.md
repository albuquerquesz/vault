# Spec: aportes de meta e plano de poupança

Status (20/11/2026): **Implementada** na branch `feat/visor-gaps-simple` (API e MCP; sem tela de aportes na web).

Origem: lacuna #14. Formato `/to-spec`, sem entrevista. A página `/mcp` do Visor fala em "calcule quanto guardar por mês" e "registre contribuições".

## Problem Statement

Uma meta no Vault tem valor alvo e valor atual, e o atual é um número que a pessoa edita à mão (`update_goal`). Não existe histórico de quanto foi guardado e quando, nem prazo, e portanto não dá para responder "quanto preciso guardar por mês para chegar lá".

## Solution

Aportes registrados em uma tabela própria, com data e valor, que atualizam o valor atual da meta. Um prazo opcional na meta. Um cálculo, devolvido na API e no MCP, do que falta guardar por mês até o prazo.

## User Stories

1. Como usuário, quero registrar um aporte em uma meta com valor, data e nota.
2. Como usuário, quero que o valor atual da meta aumente com o aporte.
3. Como usuário, quero registrar uma retirada, para o valor atual diminuir.
4. Como usuário, quero ver o histórico de aportes de uma meta.
5. Como usuário, quero apagar um aporte lançado por engano e ver o valor atual voltar.
6. Como usuário, quero definir um prazo (mês e ano) na meta.
7. Como usuário, quero ver quanto guardar por mês para chegar à meta no prazo.
8. Como usuário, quero que a meta marque como concluída quando o valor atual alcançar o alvo.
9. Como usuário, quero que o plano diga se já passei do prazo.
10. Como usuário, quero que metas antigas, sem prazo e sem aportes, continuem funcionando como hoje.
11. Como usuário, quero registrar aportes e pedir o plano pelo assistente (MCP).
12. Como usuário com o bearer `vlt_mcp_`, quero ler aportes e plano, mas não registrar.
13. Como usuário, quero que apagar um aporte venha marcado como destrutivo no MCP.
14. Como usuário, quero que aporte em meta de outro usuário falhe sem alterar nada.
15. Como usuário, quero que valor zero ou negativo de aporte seja recusado.

## Implementation Decisions

- Coluna nova e opcional `target_date` (data) em `goal`. Migração aditiva.
- Tabela `goal_contribution`: `id`, `goal_id`, `user_id`, `amount`, `kind` (`deposit` | `withdrawal`), `date`, `note`, `created_at`.
- O valor atual (`goal.current_amount`) continua guardado e é atualizado na mesma transação do banco que grava o aporte (soma ou subtrai); apagar um aporte desfaz. Metas antigas mantêm o valor que têm, e os aportes novos somam a partir dele.
- `update_goal` com `currentAmount` direto continua existindo, como correção manual. Não gera aporte.
- Plano: função pura `planGoal({ target, current, targetDate, today })` devolve `monthsLeft`, `perMonth` (valor que falta dividido pelos meses restantes, incluindo o mês atual), `isPastDue` e `isComplete`. Sem juros.
- Rotas: `POST /goals/:id/contributions`, `GET /goals/:id/contributions`, `DELETE /goals/:id/contributions/:contributionId`, `GET /goals/:id/plan`.
- MCP: `list_goal_contributions` e `get_goal_plan` (leitura), `add_goal_contribution` (escrita), `delete_goal_contribution` (escrita, `destructiveHint`).
- Aporte não cria transação nem sai do gasto do mês.

## Testing Decisions

Função de plano testada com fixtures. Seam: o MCP.

- Aporte soma ao valor atual; retirada subtrai; apagar desfaz exatamente.
- Meta que alcança o alvo vira concluída.
- Plano: R$ 1.200 faltando e 6 meses restantes dão R$ 200 por mês.
- Prazo no passado marca `isPastDue` e `perMonth` igual ao que falta.
- Meta sem prazo devolve plano sem `perMonth`.
- Aporte zero ou negativo é recusado.
- Aporte em meta alheia devolve 404.
- Bearer não vê as tools de escrita.

## Out of Scope

Juros e rendimento, aporte automático recorrente (spec 07 pode virar uma recorrência de aporte), vincular o aporte a uma transação do banco, metas compartilhadas (spec 15).

## Further Notes

- Mantém a regra de que investimento fica fora do gasto do mês: o aporte é um registro da meta, não uma saída.
