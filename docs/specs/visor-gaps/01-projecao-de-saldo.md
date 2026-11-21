# Spec: projeção de saldo (3, 6 e 12 meses)

Status (20/11/2026): Aprovada no conceito pelo Victor (20/11), a rever junto das mais complexas.

Origem: lacuna #1 de `docs/analysis/visor-gaps.md`. Formato `/to-spec` (Matt Pocock), sem entrevista. O Visor anuncia "saldo nos próximos 12 meses" no plano Pro (página `/precos`); não vi a tela deles.

## Problem Statement

O Vault mostra o mês corrente: renda orçada, gasto, teto e ritmo diário. Quem quer saber "vou fechar dezembro no azul?" ou "dá para fazer essa viagem em março?" não tem resposta. Os dados para estimar existem (saldo das contas, assinaturas detectadas, faturas com vencimento futuro, renda orçada, média de gasto), mas nada os junta.

## Solution

Uma projeção mensal determinística e explicável. Para cada mês futuro (de 1 a 12), o Vault soma ao saldo do mês anterior a renda esperada e subtrai as saídas esperadas: assinaturas, faturas de cartão já fechadas, parcelas (spec 03), contas fixas cadastradas (spec 07) e a média de gasto variável dos últimos meses. A resposta lista as premissas usadas, para a pessoa poder discordar. Não é previsão estatística nem IA.

## User Stories

1. Como usuário, quero ver o saldo previsto ao fim de cada um dos próximos 1 a 12 meses, para planejar.
2. Como usuário, quero escolher o horizonte (3, 6 ou 12 meses), para não ver mais do que preciso.
3. Como usuário, quero que o ponto de partida seja o saldo atual das minhas contas bancárias, sem somar o saldo dos cartões.
4. Como usuário, quero que a renda esperada use a renda orçada do mês quando ela existir, e a média das receitas dos últimos 3 meses quando não existir.
5. Como usuário, quero que assinaturas detectadas entrem como saída fixa nos meses futuros, para o número refletir o que já está comprometido.
6. Como usuário, quero que faturas de cartão com vencimento futuro entrem no mês do vencimento, com o valor que o Vault já mostra na tela de faturas.
7. Como usuário, quero que o gasto variável futuro use a média dos 3 últimos meses fechados, sem contar assinaturas, parcelas e faturas de novo.
8. Como usuário, quero ver as premissas (renda usada, média de gasto variável, itens fixos) junto do resultado, para entender de onde veio o número.
9. Como usuário, quero um aviso claro quando o saldo previsto fica negativo e em que mês isso acontece.
10. Como usuário, quero pedir a projeção pelo MCP, para perguntar à minha IA "como fica meu fim de ano".
11. Como usuário com o bearer `vlt_mcp_`, quero ler a projeção (é só leitura).
12. Como usuário, quero que um mês inválido ou um horizonte fora de 1 a 12 devolva o mesmo erro `{ error, code }` da API.
13. Como usuário sem conta bancária conectada, quero receber uma resposta vazia explicando que falta conectar, em vez de um saldo zerado enganoso.

## Implementation Decisions

- Uma função pura de cálculo, sem acesso a banco, que recebe o saldo inicial, a renda esperada, a lista de saídas fixas por mês e a média variável, e devolve a série mensal. Uma camada fina carrega esses insumos e chama a função. Segue o padrão de `calculateMonthlySpendingGoal` em `services/monthly-spending-goal.ts`.
- Rota `GET /api/finance/projection?months=N` (N de 1 a 12, padrão 6), com `allowMcpToken`. Resposta: `{ startBalance, months: [{ month, income, fixed, variable, endBalance }], assumptions: [...], firstNegativeMonth }`.
- Saldo inicial: soma de `pluggy_accounts.balance` onde `type = 'BANK'`. Cartões (`CREDIT`) não entram; a fatura entra como saída no mês do vencimento.
- Insumos reaproveitados: `listCurrentSubscriptions` (assinaturas e próxima cobrança), `pluggy_bills` (vencimento e total), `monthly_budget` (renda), classificação de `pluggy-classification.ts` (gasto que conta).
- Média variável: gasto classificado dos 3 últimos meses fechados, menos assinaturas, parcelas e fatura de cartão já contadas à parte. Sem 3 meses de histórico, usa o que houver e avisa na lista de premissas.
- Uma tool MCP de leitura `get_balance_projection` (mês inicial implícito, `months` opcional), registrada para OAuth e bearer.
- Valores em reais, duas casas; arredondamento só na saída.
- Depende dos dados estarem atualizados: precisa do refresh diário dos itens da Pluggy (PR #20) funcionando.

## Testing Decisions

Dois níveis. A função pura é testada com fixtures, no estilo de `monthly-spending-goal.test.ts`. O seam externo é o MCP, com o mesmo padrão de `apps/api/src/mcp/server.test.ts` (dispatch falso).

- Renda do orçamento ganha da média; sem orçamento usa a média; sem histórico devolve renda zero e a premissa.
- Assinatura e fatura entram no mês certo e uma vez só.
- Saldo negativo preenche `firstNegativeMonth`.
- Cartão não entra no saldo inicial; fatura entra como saída.
- Horizonte 0 e 13 devolvem erro de validação com o `code` da API.
- Sem conta bancária: resposta com `startBalance: null` e a premissa de falta de conexão.
- `tools/list` inclui a tool para OAuth e para o bearer.

## Out of Scope

Rendimento de investimentos, inflação, cenários ("e se eu comprar X", como as perguntas de exemplo do Visor), previsão por IA, projeção por categoria, projeção de mais de 12 meses.

## Further Notes

- Premissa explícita do Visor: "mostra para onde ele está indo" (FAQ). Esta spec entrega o equivalente determinístico.
- Ganha muito com as specs 03 (parcelas) e 07 (contas fixas). Sem elas, a projeção usa só assinaturas, faturas e média, e fica mais otimista que a realidade; a lista de premissas deve dizer isso.
- Pergunta aberta: usar os últimos 3 ou 6 meses na média? Começar com 3 e medir contra o realizado.
