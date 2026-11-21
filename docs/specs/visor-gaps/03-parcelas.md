# Spec: parcelas de cartão como lista própria

Status (21/11/2026): **Implementada** na branch `feat/credit-cards` (API e MCP; sem tela web). Desvios, depois de ver o que o MeuPluggy realmente manda (log `[pluggy-shape]`): (1) os campos `installmentNumber` e `totalInstallments` da Pluggy EXISTEM e viram colunas em `pluggy_transactions`; o "n/m" no texto é só a reserva (no gold os dois coincidem, 18 de 77; no Mercado Pago só o campo estruturado existe, 3 de 57); (2) a Pluggy não manda parcela futura (nenhuma transação com data futura), então as próximas são projetadas: mesma data um mês depois da última e o valor da última; (3) compras parceladas do mesmo comerciante e total são separadas por sequência e valor (Steam 1/3, 2/3, 3/3 e depois outro 1/3, 2/3); (4) plano parado há mais de 62 dias fica de fora.

Origem: lacuna #4. Formato `/to-spec`, sem entrevista. O Visor mostra "controle de parcelas" (1/6, 5/10…) e a página `/mcp` fala em "parcelas pagas e restantes".

## Problem Statement

Uma compra parcelada no cartão aparece no Vault como uma transação por fatura, sem ligação entre elas. Não dá para saber quantas parcelas faltam nem quanto ainda está comprometido nos próximos meses. A detecção de assinatura descarta parcela de propósito (`subscription-detection.ts` tem um filtro `INSTALLMENT`), então a informação não vai para lugar nenhum.

## Solution

Guardar o número da parcela e o total que a Pluggy devolve, agrupar as parcelas de uma mesma compra e listar os planos ativos com: parcelas pagas, restantes, valor de cada uma e total restante. O resultado alimenta a projeção (spec 01) e o MCP.

## User Stories

1. Como usuário, quero ver uma lista das minhas compras parceladas ainda em andamento.
2. Como usuário, quero ver de cada uma a parcela atual e o total (por exemplo 5 de 10).
3. Como usuário, quero ver quanto falta pagar de cada compra.
4. Como usuário, quero ver o total comprometido com parcelas em cada mês futuro.
5. Como usuário, quero que uma compra parcelada termine na lista quando a última parcela passar.
6. Como usuário, quero ver de qual cartão e de qual loja é cada compra.
7. Como usuário, quero que parcela não vire "assinatura" na lista de assinaturas, como já é hoje.
8. Como usuário, quero pedir a lista de parcelas pelo MCP.
9. Como usuário com o bearer `vlt_mcp_`, quero ler a lista (só leitura).
10. Como usuário, quero que o histórico que já foi sincronizado ganhe o número da parcela na próxima sincronização, sem eu reconectar o banco.
11. Como usuário, quero que o gasto do mês continue contando só o valor da parcela do mês, como hoje.

## Implementation Decisions

- Colunas novas e opcionais em `pluggy_transactions`: `installment_number` e `total_installments` (inteiros). O upsert do sync já atualiza linhas existentes, então o histórico se preenche sozinho.
- Os campos de parcela vêm de `creditCardMetadata` da Pluggy. Os tipos atuais do Vault só declaram `billId` ali; a sonda da spec de 17/11 viu parcela na resposta crua, mas o nome exato dos campos **precisa ser confirmado** contra uma resposta real antes de codificar (a confirmar).
- Agrupamento de uma compra: mesma conta, mesma descrição normalizada (sem o sufixo "1/6"), mesmo total de parcelas e mesmo valor por parcela. Uma função pura recebe as linhas e devolve os planos.
- Plano ativo: a maior parcela vista é menor que o total. Parcelas futuras são derivadas (número seguinte até o total), no mês da próxima fatura, aproximado pelo vencimento da última.
- Rota `GET /api/finance/installments` (`allowMcpToken`) e tool MCP de leitura `list_installments`.
- Não muda a classificação de gasto, nem a regra de assinatura.
- Migração aditiva, sem apagar nada.

## Testing Decisions

Função de agrupamento testada com fixtures, no estilo de `subscription-detection.test.ts`. Seam: o MCP.

- Três parcelas da mesma compra viram um plano com pagas, restantes e total restante corretos.
- Compras com mesma loja e valores diferentes não se misturam.
- Compra com a última parcela paga não aparece como ativa.
- Linha sem metadado de parcela não vira plano.
- Parcela continua fora da lista de assinaturas.
- Bearer lê a tool; `tools/list` a inclui.

## Out of Scope

Parcelas cadastradas à mão (spec 07), juros e CET, antecipação de parcelas, parcelamento de fatura.

## Further Notes

- Risco: a Pluggy pode não devolver parcela para todos os bancos. Conferir com os itens reais do Victor antes de prometer cobertura.
- É a base que faz a spec 01 deixar de ser otimista.
