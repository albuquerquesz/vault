# Spec: projeção de saldo (até 12 meses)

Status (21/11/2026): implementada (API, MCP, métrica `balance_projection` do `get_chart`), revista contra o código que existe hoje. Sem migração. Falta o Victor validar com dados reais (ver "Decisões em aberto").

Origem: lacuna #1 de `docs/analysis/visor-gaps.md`. Formato `/to-spec` (Matt Pocock), sem entrevista. O Visor anuncia "saldo nos próximos 12 meses" no plano Pro (página `/precos`); não vi a tela deles.

## Revisão crítica do desenho original (21/11)

O desenho de 20/11 foi escrito antes das specs 03, 07 e 08 existirem. Problemas achados e como ficaram:

1. **Dupla contagem do cartão.** A média de gasto "classificado" inclui compras no cartão (pela data da compra) e a spec somava também a fatura no vencimento: o mesmo gasto entrava duas vezes. Agora o gasto variável é separado em dois: o que sai da conta (débito, Pix, dinheiro) vira média diária; o que vai no cartão só entra pela fatura (fechada, em aberto) ou, nos meses sem fatura conhecida, pela média de compras no cartão.
2. **Assinaturas como saída própria também duplicam.** Assinatura detectada quase sempre está no cartão (já na fatura) e já está na média. Foram retiradas como item separado: ficam dentro das médias. Quem quer a assinatura explícita cadastra como conta fixa (spec 07).
3. **Renda esperada.** O desenho usava renda orçada do mês ou a média das receitas dos 3 últimos meses. Para quem tem renda de empresa própria (MEI/CNPJ), isso é irregular e mistura retirada, transferência e estorno. Decisão do Victor: a renda esperada vem **só das receitas recorrentes** (spec 07). Sem nenhuma cadastrada, a projeção não conta com entrada e avisa.
4. **Mês corrente.** O desenho tratava o primeiro mês como inteiro. Mas o saldo é o de agora: só entra o que ainda vai acontecer. No mês atual contam só os itens recorrentes pendentes (`expected`; os `realized` e `paid_manual` já estão no saldo, o que a spec 07 já previa), a fatura fechada com vencimento de hoje em diante e o gasto variável dos dias que faltam. Item atrasado e ainda pendente cai em "amanhã".
5. **Fatura em aberto não existia no desenho.** A Pluggy não envia a fatura que ainda não fechou. O `GET /credit-cards` (spec 03/limite) estima (`openBill`, `isEstimate`). Ela entra como estimativa, pelo maior valor entre o que já foi lançado e um mês típico de cartão (média + parcelas), porque a fatura ainda cresce até fechar.
6. **Parcelas (spec 03)** entram só nos meses sem fatura conhecida e na fatura em aberto (pelo maior valor); nos meses de fatura fechada elas já estão no total do banco. As parcelas e as contas fixas casadas são retiradas das médias de gasto para não contar duas vezes.
7. **Fatura já vencida e não paga nos dados** não entra: o saldo que o banco informa já a considera paga ou o dado está velho. Pagamento manual (spec 04) abate a fatura fechada.
8. **Sem consulta por dia no desenho.** A tool de gráfico (spec 10) precisa do saldo dia a dia, então o motor é por dia e o resumo mensal sai da soma dos dias. Um motor só.
9. **Saldo inicial.** `type = BANK` inclui poupança e contas PJ conectadas; o saldo vem de todas as contas bancárias do usuário com saldo informado (o MEI conectado entra). Se nenhuma informa saldo, `startBalance` é nulo.
10. **Limite por categoria (spec 02)** foi avaliado e **não** entra: é um teto, não uma previsão; somar tetos superestimaria. O ritmo de gasto (spec 08, `projectMonthEndSpend`) entra no mês corrente: o gasto variável que falta é o maior entre a média proporcional e o ritmo, a partir do 5o dia.
11. **Premissas de curto prazo.** Sem histórico, sem receita ou sem conta fixa a projeção sai otimista ou pessimista; as premissas dizem qual.
12. **Fora do desenho original e mantido de fora:** financiamento (decisão de 20/11), cenários ("e se eu comprar"), rendimento e inflação.

## Problem Statement

O Vault mostra o mês corrente: renda orçada, gasto, teto e ritmo diário. Quem quer saber "vou fechar dezembro no azul?" ou "dá para fazer essa viagem em março?" não tem resposta. Os dados para estimar existem (saldo das contas, contas fixas e receitas cadastradas, faturas, parcelas, histórico de gasto), mas nada os junta.

## Solution

Uma projeção determinística e explicável do saldo das contas bancárias, dia a dia e somada por mês, para 1 a 12 meses (o primeiro é o mês corrente). Cada item diz de onde vem:

| Certeza | O que é | Itens |
| --- | --- | --- |
| `fact` | informado pelo banco | saldo inicial, faturas fechadas ainda não pagas |
| `registered` | cadastrado pelo usuário | contas fixas e receitas recorrentes (spec 07) |
| `estimate` | inferido pelo Vault | fatura em aberto, parcelas, compras no cartão (média), gasto variável (média ou ritmo) |

Receita só vem de `registered`. A resposta traz as premissas para a pessoa poder discordar. Não é previsão estatística nem IA.

## User Stories

1. Como usuário, quero ver o saldo previsto ao fim de cada mês de 1 a 12, para planejar.
2. Como usuário, quero escolher o horizonte, para não ver mais do que preciso.
3. Como usuário, quero que o ponto de partida seja a soma dos saldos das contas bancárias, sem os cartões.
4. Como usuário, quero que a renda esperada seja só a das receitas recorrentes que cadastrei, para a renda da minha empresa não ser chutada.
5. Como usuário, quero que contas fixas cadastradas entrem no dia do vencimento, e as já pagas no mês fiquem de fora.
6. Como usuário, quero que faturas fechadas entrem no vencimento pelo valor ainda não pago, e a fatura aberta como estimativa.
7. Como usuário, quero que parcelas que faltam entrem, sem repetir o que a fatura já traz.
8. Como usuário, quero que o gasto variável futuro use a média dos 3 últimos meses fechados, sem contar contas fixas e parcelas de novo.
9. Como usuário, quero ver, item a item, o que é fato, o que cadastrei e o que é estimativa.
10. Como usuário, quero um aviso claro quando o saldo fica negativo, com o mês e o dia.
11. Como usuário, quero pedir a projeção e o gráfico diário pelo MCP (leitura; vale para OAuth e para o bearer `vlt_mcp_`).
12. Como usuário, quero o mesmo erro `{ error, code }` da API para horizonte ou mês inválido.
13. Como usuário sem conta bancária com saldo, quero uma resposta vazia explicando que falta conectar, em vez de saldo zerado.

## Implementation Decisions

- `services/balance-projection.ts`: funções puras (`projectBalance`, `buildEvents`, `averageVariable`, `currentMonthVariableRemaining`, `buildAssumptions`). Sem banco, no padrão de `monthly-spending-goal.ts`. O carregamento fica em `loadBalanceProjection` (`routers/finance.ts`), que reaproveita `listFinanceTransactions`, `buildOccurrences` (spec 07), `loadActiveInstallmentPlans` e `projectUpcoming` (spec 03), `loadCreditCards` (extraído do `GET /credit-cards`, sem mudar a resposta), `effectivePaidAmount` (spec 04) e `paceClock` / `projectMonthEndSpend` (spec 08).
- Modelo por eventos datados. Contas fixas e receitas: dia do mês ajustado ao fim do mês curto. Fatura fechada: no vencimento. Fatura em aberto: no vencimento estimado (sem data, um mês à frente). Mês de cartão sem fatura conhecida: no dia de vencimento das faturas existentes (padrão 10). O mês corrente não ganha compra de cartão nova (vai para fatura futura). Gasto variável da conta: um pouco por dia, a partir de amanhã.
- Gasto "variável" = despesas do mês na visão do dashboard (`listFinanceTransactions`), sem as que casam com conta fixa cadastrada e sem as parcelas; separado em conta (qualquer coisa que não seja `CREDIT`, inclusive dinheiro manual) e cartão (`CREDIT`). Média dos meses fechados que têm dados (até 3).
- `GET /api/finance/projection?months=N` (1 a 12, padrão 6), `allowMcpToken`. Resposta: `{ isEstimate, today, startBalance, months: [{ month, income, fixedBills, closedCardBills, openCardBill, installments, cardSpending, variable, outflow, net, endBalance, lowestBalance }], lowest, firstNegativeMonth, firstNegativeDate, events: [{ date, kind, label, amount, certainty }], assumptions: [{ code, kind, text }] }`. Os eventos diários de gasto variável não são listados (estão somados em `variable`). Sem conta com saldo: `startBalance: null`, `months: []` e a premissa `NO_BANK_ACCOUNT`.
- Tool MCP `get_balance_projection({ months? })`, 1:1 com a rota, leitura.
- `get_chart` ganha a métrica `balance_projection`: linha com o saldo dia a dia de `month` (padrão o atual; do mês atual a 11 meses à frente; passado ou além disso dá `VALIDATION_ERROR`). No mês atual começa em hoje. `total` é nulo (saldo não se soma) e a resposta traz `projection` (`startBalance`, `endBalance`, `lowest`, `firstNegativeDate`, `assumptions`). O gráfico de linha passou a aceitar valores negativos (linha do zero).
- Valores em reais, duas casas; arredondamento só na saída.
- Depende do refresh diário dos itens da Pluggy (PR #20) para o saldo e as faturas não ficarem velhos.

## Testing Decisions

- Unitário (`balance-projection.test.ts`): sem conta, horizonte e meses, conta fixa e receita, mês atual só com pendentes, fatura fechada como fato, fatura aberta (maior entre estimativa e mês típico), meses sem fatura, gasto variável que fecha com o total, saldo negativo, dia 31 em fevereiro, último dia do mês, médias e ritmo, premissas.
- Integração (`test-integration/balance-projection.integration.test.ts`, PGlite): saldo só dos bancos, receita, conta fixa e fatura fechada com `certainty`, média variável e aviso de negativo, horizonte 0/13/texto, sem conta, e a métrica do `get_chart` (tipo, hoje como primeiro ponto, mês futuro, mês fora da faixa).
- MCP (`server.test.ts`): `tools/list` para OAuth e bearer, rotas chamadas (`/projection`, `/projection?months=12`, `chart?metric=balance_projection`), validação de `months` 0 e 13.

## Out of Scope

Rendimento de investimentos, inflação, cenários ("e se eu comprar X"), previsão por IA, projeção por categoria, mais de 12 meses, financiamentos.

## Further Notes

- Limitações conhecidas (estão nas premissas): a fatura aberta é um piso até fechar; parcelas contam no mês em que lançam, sem o atraso até o vencimento; com vários cartões de ciclos diferentes o mês de cartão é aproximado; conta fixa paga no cartão aparece como saída da conta; renda não cadastrada não entra.
- Pergunta aberta mantida: média de 3 ou 6 meses para o gasto variável. Começou com 3.
