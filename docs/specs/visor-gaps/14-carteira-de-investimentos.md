# Spec: carteira de investimentos

Status (20/11/2026): Aprovada pelo Victor (20/11), depende de habilitar INVESTMENTS no app Pluggy. Ainda não implementada.

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
- Sem a habilitação do produto na Pluggy, a spec é só leitura de uma tabela vazia.
