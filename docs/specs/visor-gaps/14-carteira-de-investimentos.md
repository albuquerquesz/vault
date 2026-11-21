# Spec: carteira de investimentos

Status (21/11/2026): Aprovada pelo Victor (20/11). Backend implementado na branch `feat/investments` (migração 0032): cliente Pluggy, tabelas, fase de sync tolerante, rotas, tool MCP `list_investments` e métrica `portfolio_allocation`. Falta a UI (trocar o `DEFAULT_DATA` do card) e, principalmente, **habilitar INVESTMENTS na Pluggy**; nada foi validado com dado real.

Origem: lacuna #16. Formato `/to-spec`, sem entrevista. O Visor lista "investimentos" em todos os planos e a página `/mcp` fala em "acompanhe seus investimentos".

## Problem Statement

O Vault tira investimento do gasto do mês (a classificação trata aporte como movimento do próprio dinheiro), mas não mostra a carteira. O componente `investments-card.tsx` existe com dados fixos de exemplo e não achei uso dele em nenhuma tela. Quem tem renda fixa ou ações em uma corretora conectada não vê o patrimônio no Vault.

## Solution

Sincronizar os investimentos que a Pluggy devolve, guardar o posicionamento atual e exibir uma carteira: total investido, valor atual, rentabilidade e divisão por tipo. O card de exemplo passa a ler os dados reais e o assistente ganha uma tool de leitura.

## User Stories

1. Como usuário, quero ver o valor total da minha carteira.
2. Como usuário, quero ver a divisão por tipo (renda fixa, ações, fundos, previdência).
3. Como usuário, quero ver cada investimento com nome, instituição, valor aplicado e valor atual.
4. Como usuário, quero ver a rentabilidade de cada um e a da carteira.
5. Como usuário, quero ver a evolução do patrimônio ao longo dos meses.
6. Como usuário, quero que o card da página inicial mostre dados reais em vez de exemplo.
7. Como usuário, quero que investimento continue fora do gasto do mês, como hoje.
8. Como usuário, quero que o patrimônio apareça na projeção de saldo apenas se eu escolher incluí-lo.
9. Como usuário, quero pedir minha carteira ao assistente (MCP).
10. Como usuário com o bearer `vlt_mcp_`, quero ler a carteira.
11. Como usuário, quero ocultar os valores da carteira com o mesmo botão de ocultar valores que já existe.
12. Como usuário sem investimentos conectados, quero ver um estado vazio explicando como conectar.

## Achados da Pluggy (21/11/2026, só documentação)

Fontes: docs.pluggy.ai `products/investments`, referência `investments-list` (`GET /investments`), `connections/connectors-coverage`, `guides/meu-pluggy-personal-use`, `get-started/contact`, `connections/item`, `open-finance/overview`, página de preços (pluggy.ai/precos) e `list_teams` do MCP da Pluggy.

- **Endpoints:** `GET /investments?itemId=` (paginado: `page`, `pageSize` até 500, `results`, `totalPages`; filtro `type`), `GET /investments/{id}` e `GET /investments/{id}/transactions`.
- **Tipos (`type`):** COE, EQUITY, ETF, FIXED_INCOME, MUTUAL_FUND, SECURITY (previdência) e OTHER. Subtipos: CDB, LCI, LCA, TREASURY, STOCK, REAL_ESTATE_FUND, RETIREMENT/PGBL/VGBL, fundos etc.
- **Campos:** `id`, `name`, `type`, `subtype`, `balance` (valor líquido atual), `amount` (bruto), `amountOriginal` (valor originalmente aplicado), `amountProfit`, `amountWithdrawal`, `currencyCode`, `date`, `status` (ACTIVE, PENDING, TOTAL_WITHDRAWAL), `institution`, `issuer`, `annualRate`, `lastMonthRate`, `lastTwelveMonthsRate`, `rate/rateType/fixedAnnualRate`, `dueDate`, `taxes`, `taxes2`.
- **Open Finance:** `amountProfit`, `annualRate`, `lastMonthRate` e `lastTwelveMonthsRate` vêm `null`. A rentabilidade tem de ser calculada de `balance` e `amountOriginal`, e `amountOriginal` pode faltar. Nubank "Cofrinhos" aparecem como CDB.
- **MeuPluggy:** a tabela de cobertura marca Investimentos e Transações de investimento como disponíveis. O Mercado Pago como conector próprio de Open Finance **não** tem investimentos, mas o Victor usa o MeuPluggy para os dois, então vale o que o MeuPluggy expõe. Os dados espelham o Meu Pluggy (atualização de 24 h, o item não é atualizado por `PATCH`); a autorização do MeuPluggy dura 1 ano e, vencida, as leituras voltam **vazias** (`consentExpiresAt`, erro `USER_AUTHORIZATION_EXPIRED`).
- **Plano e custo:** o time "albuquerque" é FREE, não produção, com ACCOUNTS, CREDIT_CARDS e TRANSACTIONS. A página de preços lista investimentos dentro do produto **Dados** (a partir de R$ 2.500 por mês, 500 conexões) e diz que não há plano comercial gratuito permanente. A documentação diz que o plano gratuito "cobre acesso a dados" e que só Sandbox e MeuPluggy criam itens reais no gratuito. **Não encontrei na documentação** um botão ou passo para ligar o produto INVESTMENTS em um time FREE; os itens coletam "todos os produtos habilitados na assinatura do time". Se não for autosserviço, o canal é sales@pluggy.ai (a Pluggy cita esse canal para ligar recursos opcionais) e, para uso pessoal, meu-suporte@pluggy.ai. Custo para o uso pessoal via MeuPluggy: a doc fala em gratuito, mas a habilitação do produto no time é o ponto aberto.
- **Resposta quando o produto não está habilitado:** não está documentada. O cliente trata 403 (e 400/404 cuja mensagem cite produto/plano) como "produto indisponível" e pula a fase.

## Correções à versão aprovada

- Tipos da Pluggy não são "renda fixa, ações, fundos, previdência": são sete (acima). A divisão usa os rótulos: Renda fixa, Ações e FIIs, ETFs, Fundos, Previdência, COE, Outros.
- `amount_invested` pode ser nulo (Open Finance). A rentabilidade só existe para posições com valor aplicado e é `null` sem ele; a da carteira usa apenas as posições com base. `amountProfit` é guardado, mas não usado no cálculo (vem nulo no Open Finance).
- A tabela precisa de `user_id` (as rotas filtram por usuário) e `amount_profit`; `status` e `currency` entram. Posições `TOTAL_WITHDRAWAL` e em moeda diferente de BRL ficam fora dos totais (contadas à parte).
- Item removido apaga as posições em cascata. Posição que a Pluggy deixa de devolver é apagada, mas **resposta vazia não apaga nada** (consentimento vencido do MeuPluggy também lê vazio; resgate total vem como `TOTAL_WITHDRAWAL`).
- O instantâneo mensal só é gravado quando existe ao menos uma posição, para não criar histórico de zeros.
- A fase de investimentos é informativa: não altera o `status` do sync e produto desabilitado é "skipped", não falha.
- A US 8 (patrimônio na projeção de saldo, opcional) e as US 5 e 6 na UI **não foram feitas**.

## Implementation Decisions

- **Bloqueio de plataforma.** O aplicativo "Vault" na Pluggy tem só os produtos ACCOUNTS, CREDIT_CARDS e TRANSACTIONS. O conector MeuPluggy anuncia INVESTMENTS e INVESTMENTS_TRANSACTIONS, mas o aplicativo precisa habilitá-los (e pode depender do plano; a confirmar). A spec só começa depois disso.
- Tabela nova `pluggy_investment`: `id`, `item_id`, `pluggy_investment_id`, `name`, `type`, `subtype`, `institution`, `amount_invested`, `balance`, `currency`, `date`, `last_updated_at`. Upsert por (`item_id`, `pluggy_investment_id`).
- Uma fase nova no sync (`syncInvestmentsForItem`), depois das transações, com o mesmo isolamento de falha das outras fases (uma fase falhar não derruba as demais).
- Histórico mensal do patrimônio: um instantâneo por mês em `investment_snapshot` (`user_id`, `month`, `total_balance`), gravado ao fim do sync. Sem retroativo; começa quando a sincronização começa.
- Rota `GET /api/finance/investments` (`allowMcpToken`) com total, divisão por tipo, lista e rentabilidade; `GET /investments/history` com os instantâneos.
- Tool MCP de leitura `list_investments`.
- Reaproveitar `investments-card.tsx`, trocando `DEFAULT_DATA` por dados da rota, e o `MaskedMonetaryValue` já usado.
- Nenhuma mudança em `pluggy-classification.ts`: aporte continua sendo movimento do próprio dinheiro.

## Testing Decisions

Mapeamento de resposta da Pluggy para linhas e cálculo de rentabilidade como funções puras, com fixtures; seam: o MCP.

- Dois investimentos do mesmo tipo somam na divisão por tipo.
- Rentabilidade = (valor atual − aplicado) / aplicado; aplicado zero não divide por zero.
- Sync repetido não duplica linhas.
- Uma falha só na fase de investimentos não derruba contas, faturas e transações.
- Instantâneo mensal é regravado, não duplicado, no mesmo mês.
- Gasto do mês continua sem contar investimento.
- Bearer lê `list_investments`.

## Out of Scope

Recomendação de investimento, cotação em tempo real, importação de nota de corretagem, imposto de renda, comparar com benchmark.

## Further Notes

- O rodapé do Visor diz que eles não dão recomendação de investimento; seguir a mesma linha.
- Sem a habilitação do produto na Pluggy, a spec é só leitura de uma tabela vazia. A migração é a 0032.
