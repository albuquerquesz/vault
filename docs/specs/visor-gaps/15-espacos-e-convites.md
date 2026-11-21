# Spec: espaços (pessoal, casal, empresa) e convite de uma pessoa

Status (20/11/2026): A rever.

Origem: lacuna #17. Formato `/to-spec`, sem entrevista. O plano Premium do Visor oferece "um espaço separado para a casa ou a empresa" e "convide 1 pessoa para esse espaço"; a página `/mcp` fala em "qualquer espaço (pessoal, casal, empresa)".

## Problem Statement

O Vault é de um usuário só: todas as tabelas de dados (`expense`, `goal`, `monthly_budget`, `monthly_spending_goal`, `savings_target`, `monthly_bill`) são filtradas por `user_id`. Casal que divide contas, ou quem mistura a conta pessoal com a do MEI, não consegue separar nem compartilhar.

## Solution

Um conceito de **espaço**: um conjunto de dados financeiros com dono e, opcionalmente, um segundo membro. Todo usuário tem um espaço pessoal criado automaticamente. Pode criar um espaço de casal ou de empresa e convidar uma pessoa. Cada consulta passa a ser feita em um espaço ativo. As conexões bancárias pertencem a um espaço.

## User Stories

1. Como usuário, quero que todos os meus dados atuais fiquem no meu espaço pessoal, sem eu fazer nada.
2. Como usuário, quero criar um espaço de casal ou de empresa com um nome.
3. Como dono de um espaço, quero convidar uma pessoa por link ou e-mail.
4. Como convidado, quero aceitar o convite e passar a ver os dados daquele espaço.
5. Como membro, quero trocar entre meus espaços na barra lateral.
6. Como membro, quero conectar um banco a um espaço específico.
7. Como membro, quero que o dashboard, o teto de gasto, as metas e as faturas mostrem só os dados do espaço ativo.
8. Como dono, quero remover o outro membro.
9. Como membro, quero sair de um espaço compartilhado sem apagar os dados dele.
10. Como dono, quero que apagar um espaço apague seus dados, com confirmação explícita.
11. Como usuário, quero que um espaço aceite no máximo dois membros nesta primeira versão.
12. Como usuário, quero que um usuário de fora nunca veja dados de um espaço de que não faz parte.
13. Como usuário, quero escolher o espaço nas chamadas do MCP, com o pessoal como padrão.
14. Como usuário com o bearer `vlt_mcp_`, quero que o token valha para o espaço pessoal apenas, a menos que eu o crie para outro espaço.
15. Como membro, quero ver quem fez cada lançamento manual no espaço compartilhado.

## Implementation Decisions

- Tabelas novas: `space` (`id`, `name`, `kind` `personal` | `couple` | `business`, `owner_id`), `space_member` (`space_id`, `user_id`, `role` `owner` | `member`), `space_invite` (`id`, `space_id`, `email`, `token_hash`, `expires_at`, `accepted_at`).
- Coluna `space_id` (obrigatória depois do backfill) em `expense`, `goal`, `monthly_budget`, `monthly_spending_goal`, `savings_target`, `monthly_bill`, `pluggy_items` e nas tabelas das specs 02, 04, 05, 06, 07, 12. `user_id` continua, como autor.
- Migração em três passos: criar espaço pessoal para cada usuário; preencher `space_id` com o espaço pessoal do `user_id`; só então tornar a coluna obrigatória. Aditiva e reversível até o último passo.
- Toda rota de finanças recebe o espaço ativo (cabeçalho `x-vault-space`, padrão o pessoal) e valida a pertença do usuário via `space_member`. Esse ponto passa a ser o único lugar que decide acesso a dados: um helper `requireSpace(req)` ao lado de `requireSession`.
- As funções que hoje recebem `userId` passam a receber `spaceId` (e `userId` apenas para auditoria). Mudança grande e mecânica; fazer por rota, com testes de isolamento entre dois usuários antes de migrar cada uma.
- Tokens MCP (`mcp_access_token`) ganham `space_id`; OAuth usa o espaço pessoal, e uma tool `list_spaces` mais um parâmetro opcional `space` nas demais escolhem o espaço (validado contra a pertença).
- Convite: link de uso único, expira em 7 dias, aceito por usuário logado.
- Dois membros por espaço, validado no banco.

## Testing Decisions

O risco é vazamento entre espaços; os testes de isolamento são o centro. Seam: as rotas e o MCP.

- Usuário A não lê, grava nem apaga nada de um espaço de B (404, não 403, para não confirmar a existência).
- Convidado vê os dados do espaço depois de aceitar, e não vê os do espaço pessoal do dono.
- Remover o membro corta o acesso na hora.
- A migração coloca todos os dados antigos no espaço pessoal do dono e nenhum fica sem espaço.
- Um terceiro convite no mesmo espaço é recusado.
- Token MCP de um espaço não lê outro.
- O MCP sem parâmetro `space` usa o espaço pessoal.

## Out of Scope

Papéis granulares (somente leitura, contador), mais de dois membros, contas PJ como produto Pluggy próprio, divisão de despesas entre membros, cobrança por espaço.

## Further Notes

- Spec grande (L). Entregar em fatias: (1) tabelas, backfill e `requireSpace` sem mudar o comportamento; (2) rotas migradas uma a uma; (3) convite e troca de espaço na interface.
- Muda a base de quase todas as outras specs. Se for feita, decidir cedo, porque as tabelas novas das outras specs já devem nascer com `space_id`.
