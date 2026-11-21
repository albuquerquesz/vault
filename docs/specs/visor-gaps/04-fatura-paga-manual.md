# Spec: marcar fatura como paga

Status (20/11/2026): **Implementada** na branch `feat/visor-gaps-simple` (API e MCP; botão na tela de faturas ainda não).

Origem: lacuna #5. Formato `/to-spec`, sem entrevista. A página `/mcp` do Visor dá o exemplo "Marque a fatura do Nubank como paga".

## Problem Statement

A fatura de cartão no Vault é só leitura: o valor pago (`paidAmount`) vem da Pluggy, calculado dos pagamentos que o banco informou. Quando a pessoa paga e o banco demora a mostrar, ou paga por fora, a tela segue dizendo "em aberto" e a projeção conta uma saída que já saiu.

## Solution

Um ajuste manual por fatura: a pessoa marca a fatura como paga (total ou um valor). O ajuste fica em tabela própria e nunca é sobrescrito pelo sync. Quando a Pluggy passar a informar o pagamento, o dado do banco volta a valer e o ajuste vira redundante.

## User Stories

1. Como usuário, quero marcar uma fatura como paga, para a tela e a projeção pararem de contá-la como pendente.
2. Como usuário, quero informar um valor pago menor que o total, para registrar pagamento parcial.
3. Como usuário, quero desfazer a marcação, caso eu tenha errado.
4. Como usuário, quero que a próxima sincronização não apague a minha marcação.
5. Como usuário, quero que, se a Pluggy informar um pagamento igual ou maior que o total, a fatura apareça como paga pelo dado do banco.
6. Como usuário, quero ver na fatura se o "pago" veio do banco ou de uma marcação minha.
7. Como usuário, quero marcar e desmarcar pelo assistente (MCP), usando o id da fatura que `get_monthly_bills` devolve.
8. Como usuário com o bearer `vlt_mcp_`, quero continuar só lendo faturas.
9. Como usuário, quero que marcar uma fatura de outro usuário falhe sem alterar nada.
10. Como usuário, quero o mesmo erro `{ error, code }` da API quando o id não existe.
11. Como usuário, quero que desmarcar venha marcado como destrutivo no MCP, para o assistente pedir confirmação.

## Implementation Decisions

- Tabela nova `bill_payment_override`: `id`, `user_id`, `pluggy_bill_id`, `paid_amount`, `note`, `created_at`; único em (`user_id`, `pluggy_bill_id`). Não toca `pluggy_bills`, que o sync reescreve.
- Valor efetivo de pago: o maior entre o `paid_amount` da Pluggy e o do ajuste. Assim, quando o banco alcança o ajuste, nada muda; quando o banco informa mais, vale o banco.
- A reconstrução de `monthly_bill_item` (`materializeMonthlyBillsFromPluggy`) passa a ler o valor efetivo. Como a reconstrução já roda uma vez por sync, o custo não muda.
- Rotas: `POST /api/finance/bills/:pluggyBillId/paid` (corpo opcional `{ paidAmount }`, padrão o total) e `DELETE` no mesmo caminho. Dono verificado pelo usuário da sessão.
- MCP: `mark_bill_paid` (escrita) e `unmark_bill_paid` (escrita, `destructiveHint`). A leitura continua em `get_monthly_bills`, que passa a devolver `paidSource: "bank" | "manual"` por item.
- Não inicia pagamento nem fala com o banco.

## Testing Decisions

Seam: o MCP, com o padrão de `server.test.ts`; cálculo do valor efetivo como função pura.

- Marcar sem valor grava o total; com valor grava o valor.
- Marcar duas vezes substitui, não duplica.
- O sync (reconstrução) preserva o ajuste.
- Banco informando pagamento maior que o ajuste faz `paidSource` virar `bank`.
- Fatura de outro usuário devolve 404 sem alterar.
- Bearer não lista `mark_bill_paid` nem `unmark_bill_paid`.

## Out of Scope

Pagar a fatura, iniciar Pix, conciliar com transação de pagamento, marcar contas fixas como pagas (spec 07).

## Further Notes

- Mantém a regra do produto: o Vault não move dinheiro.
- Pergunta aberta: o ajuste deve expirar? Começar sem expirar; o "maior entre os dois" já neutraliza o caso comum.
