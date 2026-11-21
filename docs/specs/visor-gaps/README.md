# Specs: o que o Visor tem e o Vault não

Origem: `docs/analysis/visor-gaps.md` (20/11/2026). Cada spec segue o formato `/to-spec` do Matt Pocock (Problem Statement, Solution, User Stories, Implementation Decisions, Testing Decisions, Out of Scope, Further Notes), sem entrevista e com os fatos do código da `main`. O que o Visor faz vem das páginas públicas dele; as tools do MCP deles não foram lidas.

Estimativa de esforço (minha, não medida): **S** um PR pequeno; **M** vários PRs com migração; **L** projeto de semanas ou decisão de negócio.

| Spec | Funcionalidade | Esforço | Depende de | Status |
| --- | --- | --- | --- | --- |
| [01](01-projecao-de-saldo.md) | Projeção de saldo (3, 6, 12 meses) | M | refresh diário da Pluggy (PR #20); melhora com 03 e 07 | a rever |
| [02](02-limite-por-categoria.md) | Limite por categoria | S-M | nada | implementada (API, MCP) |
| [03](03-parcelas.md) | Parcelas de cartão | M | confirmar campos de parcela da Pluggy | implementada (API, MCP) |
| [04](04-fatura-paga-manual.md) | Marcar fatura como paga | S | nada | implementada (API, MCP) |
| [05](05-regras-de-categoria.md) | Regras automáticas de categoria | M | nada | a rever |
| [06](06-categorias-e-tags-proprias.md) | Categorias e tags próprias | S (categorias) / M (tags) | toca 02 e 05 ao renomear | a rever |
| [07](07-contas-fixas-e-recorrentes.md) | Contas fixas, receitas recorrentes, financiamentos | M | usado pela 01 | implementada (API, MCP), sem financiamento |
| [08](08-alerta-de-ritmo-de-gasto.md) | Alerta de ritmo de gasto | S-M | melhor com 02 | aprovada |
| [09](09-escopos-oauth-do-mcp.md) | Escopos OAuth por domínio no MCP | S-M | nenhuma; fazer antes das tools de escrita novas | implementada |
| [10](10-graficos-no-mcp.md) | Gráficos pelo MCP | M | melhor com 01 e 02 | aprovada |
| [11](11-busca-de-transacoes.md) | Busca e edição de transação manual | S | decidir `unaccent` | implementada (API, MCP) |
| [12](12-aporte-de-meta.md) | Aportes de meta e plano de poupança | S-M | nada | implementada (API, MCP) |
| [13](13-onboarding-pluggy-do-servidor.md) | Conectar banco sem conta própria na Pluggy | L | **decisão de custo da Pluggy em produção** | a rever |
| [14](14-carteira-de-investimentos.md) | Carteira de investimentos | L | habilitar INVESTMENTS no app Pluggy | aprovada (depende da Pluggy) |
| [15](15-espacos-e-convites.md) | Espaços e convite de uma pessoa | L | decidir cedo: muda todas as tabelas | a rever |
| [16](16-assistente-de-ia-no-app.md) | Assistente de IA dentro do app | L | escolha de modelo e custo | revista: AG-UI com o Claude da VPS |
| [17](17-api-pessoal.md) | API pessoal de leitura | M | decidir limite de uso | a rever |

## Ordem sugerida

1. **Rápidas e independentes:** 02, 04, 12, 11, 09 (esta antes de qualquer tool de escrita nova).
2. **Valor alto, dados já existem:** 03 e 07, depois 01 (projeção), depois 08 e 10.
3. **Organização:** 05 e 06.
4. **Decisões de negócio antes de código:** 13 (custo da Pluggy), 15 (multiusuário), 16 (custo de IA), 14 (plano Pluggy), 17 (limite de uso).

## O que não virou spec

- **Cartão adicional:** não sei se a Pluggy o expõe como conta separada; a confirmar antes de especificar.
- **Apps nativos iOS e Android, desktop, canal de WhatsApp, indicação, comparativos e calculadoras:** produto e aquisição, não funcionalidade do núcleo. A PWA cobre o celular.
- **Pagamentos, memórias e rotinas no escopo do MCP do Visor:** só vi os nomes dos escopos, não o que as tools fazem.
- **Pix:** o Vault não move dinheiro, como decidido na spec de 17/11.

## Decisões do Victor (20/11)

- Começar pelas mais simples (02, 04, 09, 11, 12); as complexas voltam para revisão depois.
- Sem IA própria: usar AG-UI para rodar o Claude na VPS com a assinatura dele (spec 16 revista).
- Gráficos pelo MCP: gostou; o visual deve aparecer nas respostas do OpenBot (spec 10).
- Contas fixas e receitas recorrentes: sim, **sem financiamento** (spec 07).
- Alerta de ritmo, busca e edição de transações (também no MCP) e carteira de investimentos: aprovados.

## Publicação

As specs estão em `docs/specs/visor-gaps/`. Para abrir issues com `ready-for-agent` (padrão do `/to-spec`), o repositório ainda não tem `docs/agents/issue-tracker.md`: rodar `/setup-matt-pocock-skills` primeiro.
