# Spec: gráficos pelo MCP

Status (20/11/2026): Aprovada pelo Victor (20/11). Ainda não implementada.

Origem: lacuna #12. Formato `/to-spec`, sem entrevista. A página `/mcp` do Visor diz "peça gráficos de barras, linhas ou rosca com seus dados" e dá o exemplo "Mostre meus gastos por categoria num gráfico".

## Problem Statement

O assistente que usa o MCP do Vault recebe só números em JSON. Para mostrar um gráfico, ele precisa montar o gráfico sozinho, a partir de tools que devolvem listas, e muitas vezes erra a agregação. A web já tem gráficos (`bar-chart`, `area-chart`, `category-rank-chart`), mas o MCP não os usa.

## Solution

Uma tool de leitura que devolve, para um conjunto fixo de métricas, os dados já agregados e uma especificação Vega-Lite pronta. O cliente que sabe renderizar (Claude, ChatGPT, Cursor com extensão) desenha o gráfico; o que não sabe mostra a tabela de dados que vem junto. O servidor não gera imagem.

## User Stories

1. Como usuário, quero pedir "gastos por categoria deste mês" e receber os dados agregados e um gráfico de rosca.
2. Como usuário, quero pedir o resultado mensal (receita menos gasto) dos últimos 6 ou 12 meses em barras.
3. Como usuário, quero pedir o gasto diário do mês em linha.
4. Como usuário, quero pedir a projeção de saldo (spec 01) em linha.
5. Como usuário, quero escolher o tipo (barras, linhas, rosca) quando a métrica permitir mais de um.
6. Como usuário, quero que os números do gráfico sejam os mesmos do dashboard.
7. Como usuário, quero que investimento, transferência para mim e pagamento de fatura fiquem fora do gasto do gráfico.
8. Como usuário, quero que o resultado traga uma tabela de dados, para clientes que não desenham gráfico.
9. Como usuário, quero rótulos e título em português, com valores em reais.
10. Como usuário com o bearer `vlt_mcp_`, quero poder pedir gráficos (é só leitura).
11. Como usuário, quero um erro claro quando a métrica não existe ou o período é inválido.
12. Como usuário, quero que o gráfico de categorias agrupe as menores em "Outras" quando houver muitas.

## Implementation Decisions

- Uma tool `get_chart` de leitura: `{ metric, month?, months?, type? }`. Métricas iniciais: `spending_by_category`, `monthly_result`, `spending_by_day`, `balance_projection` (linha com o saldo projetado dia a dia do mês, sobre a projeção da spec 01; implementada em 21/11).
- A agregação reaproveita as funções que alimentam `/partial-result` e o ranking de categorias da web; nenhuma conta nova de classificação.
- Resposta: `{ title, type, data: [{ label, value }...], vegaLite: {...} }`, com `data` também embutida no `vegaLite.data.values`. Vega-Lite 5, esquema público e estável.
- Tipos aceitos por métrica: `spending_by_category` em rosca ou barras; `monthly_result` em barras; `spending_by_day` e `balance_projection` em linha. Combinação inválida devolve erro de validação.
- Mais de 8 categorias: as menores viram "Outras" (a regra fica numa função pura).
- Texto de eixo e título em português; valores formatados por quem renderiza, a partir do campo numérico.
- Sem imagem, sem dependência de renderizador no Worker (limite de CPU e memória).

## Testing Decisions

Seam: o MCP, no padrão de `server.test.ts`. A função de agrupamento em "Outras" e a montagem do Vega-Lite são puras.

- `spending_by_category` soma o mesmo total do `get_spending_insights` do mês.
- Combinação métrica-tipo inválida devolve erro.
- Mais de 8 categorias gera "Outras" com a soma das menores.
- O `vegaLite` devolvido é JSON válido e referencia os mesmos pontos de `data`.
- Bearer lê a tool; `tools/list` a inclui.
- Mês inválido devolve o `code` da API.

## Out of Scope

Imagem PNG ou SVG gerada no servidor, gráfico na web (já existe), gráficos personalizáveis por campo, exportação.

## Further Notes

- **Decisão do Victor (20/11): gostou da ideia; o visual deve aparecer nas respostas do OpenBot.** O OpenBot mostra blocos `html` estáticos (CSS e SVG inline, sem scripts), então a ponte é: o agente chama `get_chart`, recebe `data` e `vegaLite`, e desenha o gráfico como SVG inline na resposta. Isso não exige renderizador no servidor do Vault; a tabela de `data` também serve para esse desenho. A confirmar: se vale entregar também um SVG pronto no resultado da tool, para o agente só colar.

- Nem todo cliente MCP desenha Vega-Lite. A tabela embutida cobre esse caso. Confirmar com Claude, ChatGPT e Cursor qual deles renderiza o quê antes de prometer.
- Fica muito melhor depois das specs 01 e 02 (projeção e limites).
