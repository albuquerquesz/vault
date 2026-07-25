# Spec: visibilidade de valores monetários

## Objetivo

Permitir ocultar ou exibir valores monetários nas duas páginas autenticadas atuais:

- `/`, Visão Geral
- `/transactions`, Transações

Controle único, persistido no navegador, localizado no cabeçalho da sidebar, à direita da marca Vault, conforme referência visual enviada.

## Comportamento

- Estado inicial: valores visíveis.
- Toggle: botão acessível com `aria-label` e `aria-pressed`.
- Estado persistido em `localStorage` pela chave `vault-monetary-visibility`.
- Estado compartilhado pelo `MonetaryVisibilityProvider` no `AppShell`.
- Estado oculto preserva prefixo monetário e substitui números por três pontos visuais.
- Alternância atualiza valores estáticos, animados, labels SVG e tooltips sem alterar dados, cálculos, filtros ou percentuais.

## Pontos mapeados

### Visão Geral (`/`)

| Área | Valor | Renderização obrigatória |
| --- | --- | --- |
| Distribuição dos gastos | total do donut, inclusive valor sob hover | `PieCenter.valueRenderer` + `MonetaryMask` |
| Cartões | total da fatura | `MaskedMonetaryValue` |
| Cartões | valor pago por cartão | `MaskedMonetaryValue` |
| Cartões | valor total por cartão | `MaskedMonetaryValue` |
| Resultado Parcial | resultado do mês | já coberto por `MaskedMonetaryValue` |
| Resultado Parcial | resultado do mês anterior | já coberto por `MaskedMonetaryText` |
| Resultado Parcial | receita | já coberto por `MaskedMonetaryValue` |
| Resultado Parcial | gasto | já coberto por `MaskedMonetaryValue` |
| Metas | valor-alvo de cada meta | `MaskedMonetaryValue` animado |
| Gastos por dia | pico do período | `MaskedMonetaryValue` |
| Gastos por dia | valor no tooltip por dia | `maskMonetaryText` |

Não mascarar labels de mês, contagens, percentuais, nomes, barras sem texto monetário nem campos editáveis de entrada monetária.

### Transações (`/transactions`)

| Área | Valor | Renderização obrigatória |
| --- | --- | --- |
| Tabela desktop | valor de cada transação | `MaskedMonetaryValue` |
| Tabela mobile | valor de cada transação | já coberto por `MaskedMonetaryValue` |
| Estatísticas do período | total de saídas | já coberto por `MaskedMonetaryValue` |
| Estatísticas do período | total de entradas | já coberto por `MaskedMonetaryValue` |
| Gastos por categoria | total no fim de cada barra | `maskMonetaryText` |
| Gastos por categoria | valor no tooltip | `maskMonetaryText` |

## Arquitetura

- `monetary-visibility.tsx`: contexto, estado, helper e componentes de valor/máscara.
- `monetary-visibility-toggle.tsx`: componente separado, exclusivo para o botão de toggle.
- `app-sidebar.tsx`: única montagem do botão, no canto superior direito do header da sidebar.
- Nenhuma página deve criar um provider secundário. Isso garante que sidebar e conteúdo compartilhem o mesmo estado.

## Critérios de aceite

1. Clique no botão da sidebar oculta todos os valores listados nas duas páginas.
2. Segundo clique restaura os valores sem recarregar a página.
3. Navegar entre Visão Geral e Transações mantém o estado.
4. Recarregar mantém o estado salvo.
5. Nenhum número monetário dos pontos mapeados permanece exposto em tabela, cartão, label de gráfico ou tooltip quando oculto.
6. Botão funciona por teclado, mantém foco visível e comunica estado a leitor de tela.
