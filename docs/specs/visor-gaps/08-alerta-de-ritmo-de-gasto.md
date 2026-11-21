# Spec: alerta de ritmo de gasto

Status (21/11/2026): implementada (API e push; sem tool de MCP, a spec não pede). Aprovada pelo Victor (20/11).

Decisões do Victor para a implementação: horário silencioso fixo de 22h às 8h (Brasília), sem push dentro dele; alerta de categoria aos 80% e aos 100% do limite mensal, um por categoria, limiar e mês.

Como ficou: `services/pace-alert.ts` (funções puras) e `services/pace-alert-dispatch.ts` (envio). Preferência `paceAlertsEnabled` (desligada por padrão) em `GET/PUT /api/settings/push/pace-alerts`. Estado em `push_subscription.last_pace_alert_date` (um alerta por dia e por aparelho) e na tabela `category_alert_sent` (`user_id`, `month`, `category_key`, `threshold`, único); a migração é a `0030_pace_alert`. Ritmo e categorias devidos no mesmo dia vão num push só. O dia e o limiar são reservados antes do envio (um sync duplicado não duplica) e devolvidos se todo envio falhar de forma temporária. Disparos: fim do sync do webhook e do sync manual, e o cron. O cron das 01:00 UTC cai dentro do silêncio (22h em Brasília), então `wrangler.toml` ganhou um segundo cron às 11:00 UTC (8h) que só avalia alertas. Se uma categoria cruza o limiar num dia em que o alerta do dia já saiu, ele sai no dia seguinte. A URL do push é `/spending-goal`.

Origem: lacuna #10. Formato `/to-spec`, sem entrevista. A home do Visor promete "te avisa quando algo merece atenção" e a FAQ, "te avisa quando você está gastando mais rápido do que deveria — antes de estourar".

## Problem Statement

O Vault já calcula o limite diário do mês (`/spending-goal`) e já manda um resumo diário por push depois das 21h de Brasília. Mas só avisa o que passou. Quem está gastando num ritmo que estoura o teto do mês só descobre quando abre a tela.

## Solution

Um alerta por push, no máximo uma vez por dia, quando o ritmo atual indica que o mês vai passar do teto, ou quando uma categoria cruza 80% e 100% do limite (spec 02). O alerta é avaliado depois de cada sincronização de banco e uma vez por dia no cron.

## User Stories

1. Como usuário, quero ser avisado quando, no ritmo atual, vou passar do meu teto de gasto do mês.
2. Como usuário, quero que o aviso diga quanto vou gastar no mês nesse ritmo e quanto passa do teto.
3. Como usuário, quero ser avisado quando uma categoria chegar a 80% do limite.
4. Como usuário, quero ser avisado de novo quando uma categoria chegar a 100%.
5. Como usuário, quero receber no máximo um alerta de ritmo por dia, para não ser spammado.
6. Como usuário, quero não receber o mesmo alerta de categoria duas vezes no mesmo mês.
7. Como usuário, quero ligar e desligar esses alertas nas configurações, separado do resumo diário.
8. Como usuário, quero que o alerta só exista se eu tiver um teto ou um limite definido.
9. Como usuário, quero que o alerta seja calculado só com o que conta como gasto (sem investimento, transferência para mim e pagamento de fatura).
10. Como usuário, quero que dias de poucos dados no começo do mês não gerem alarme falso.
11. Como usuário, quero que o toque no alerta abra a tela do teto de gasto.
12. Como usuário sem inscrição de push, não quero erro, só que nada seja enviado.

## Implementation Decisions

- Função pura `projectMonthEndSpend({ spent, daysElapsed, daysInMonth })` (ritmo linear: gasto até agora dividido pelos dias passados, vezes os dias do mês) e uma regra `shouldAlertPace({ projected, target, daysElapsed })` que só dispara a partir do 5º dia do mês e quando o projetado passa de 100% do teto. Segue o molde de `calculateMonthlySpendingGoal`.
- Reaproveita a infraestrutura de `push.ts` e `daily-summary.ts`: assinaturas cifradas, `web-push`, tratamento de endpoint expirado.
- Estado de envio: coluna nova `last_pace_alert_date` em `push_subscription` (mesmo padrão de `last_daily_summary_date`) e uma tabela pequena `category_alert_sent` (`user_id`, `month`, `category`, `level` 80 | 100) para não repetir.
- Preferência: `paceAlertsEnabled` em `UserSettings` (jsonb), com um interruptor ao lado do resumo diário em `push-settings.tsx`.
- Gatilhos: depois de `syncTransactionsForItem` terminar com sucesso (em segundo plano, sem atrasar o webhook) e no cron diário, sem a trava das 21h do resumo (o alerta vale a qualquer hora, respeitando um horário silencioso opcional de 22h a 8h de Brasília).
- O cron de refresh diário (PR #20) já puxa dados novos; o alerta é consequência, não depende de novo job.
- O texto é curto e em português; a URL do push é `/spending-goal`.

## Testing Decisions

Funções puras testadas com fixtures; o envio em si, com um `web-push` falso, como `push.test.ts` já faz.

- Ritmo linear: R$ 600 gastos no dia 10 de um mês de 30 dias projetam R$ 1.800.
- Antes do 5º dia, nenhum alerta.
- Projetado abaixo do teto, nenhum alerta.
- Dois disparos no mesmo dia mandam um alerta só.
- Categoria que cruza 80% avisa uma vez; cruza 100% avisa de novo; nenhuma repete no mesmo mês.
- Sem teto nem limite, nada é enviado.
- Usuário com `paceAlertsEnabled` falso não recebe.

## Out of Scope

Alerta de vencimento de fatura ou conta fixa (pode usar a spec 07 depois), e-mail e WhatsApp, dicas por IA, previsão não linear.

## Further Notes

- Existe um aviso diário nos logs: "Daily reminder: no notification created. Check subscribed audience in OneSignal". Parece ser outro mecanismo, sem inscritos; não faz parte desta spec, mas vale investigar para não haver dois sistemas de notificação.
- O ritmo linear erra para quem recebe fatura no fim do mês. Aceitável na primeira versão; a lista de premissas da spec 01 pode refinar depois.
