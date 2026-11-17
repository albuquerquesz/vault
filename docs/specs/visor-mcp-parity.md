# Spec: paridade MCP com o que o Visor anuncia e o Vault já tem

Origem: conversa de 17/11/2026. Formato `/to-spec` (Matt Pocock). Sem entrevista.

O de/para usa a página pública do Visor (https://visorfinance.app/mcp), não uma chamada ao servidor MCP deles. Nomes de tool do Visor não foram lidos. Onde a célula é "—", o produto não faz isso hoje, ou a página deles não afirma.

| Capacidade | Vault API/tela | Vault MCP | Visor (página) |
| --- | --- | --- | --- |
| Resumo do mês | ✓ | ✓ | ✓ |
| Transações do mês | ✓ | ✓ | ✓ |
| Busca de transação por texto | — | — | ✓ |
| Criar transação manual | ✓ | ✓ | ✓ |
| Editar valor ou data vinda do banco | — | — | ✓ |
| Recategorizar em lote | ✓ | ✓ | ✓ |
| Ocultar lançamento bancário | ✓ | ✓ | — |
| Listar categorias já usadas | ✓ | ✓ | ✓ |
| Regra automática de categoria | — | — | ✓ |
| Limite por categoria | — | — | ✓ |
| Ler fatura de cartão | ✓ | ✓ | ✓ |
| Marcar fatura como paga | — | — | ✓ |
| Cartão extra | — | — | ✓ |
| Parcelas como lista própria | — | — | ✓ |
| Assinaturas detectadas no histórico | ✓ | ✓ | ✓ |
| Conta fixa cadastrada à mão | — | — | ✓ |
| Receita recorrente e empréstimo na projeção | — | — | ✓ |
| Gravar renda orçada do mês | ✓ | — | ✓ |
| Ler e gravar teto de gasto do mês | ✓ | — | ✓ |
| Ler e gravar percentual de poupança | ✓ | — | ✓ |
| Metas (ler, criar, atualizar valor) | ✓ | ✓ | ✓ |
| Apagar meta | ✓ | — | — |
| Aporte de meta como lançamento | — | — | ✓ |
| Tirar investimento e pagamento de fatura do gasto | ✓ | ✓ | ✓ |
| Carteira de investimentos | — | — | ✓ |
| Espaço pessoal, casal ou empresa | — | — | ✓ |
| Gráfico na tela | ✓ | — | ✓ |
| MCP HTTP com OAuth | ✓ | ✓ | ✓ |
| Bearer estático só de leitura no MCP | ✓ | ✓ | — |
| Trava de confirmação antes da escrita | — | — | ✓ |
| Pix pelo MCP | — | — | — |
| Conectar banco (Pluggy) | ✓ | — | ✓ |
| Revogar acesso do assistente | ✓ | — | ✓ |

Pix: o rodapé do Visor diz que eles não movem dinheiro. A API pessoal deles documenta início de Pix confirmado no banco. Isso não entra no MCP desta spec.

## Problem Statement

O assistente do Victor já entra no Vault por MCP HTTP com OAuth, em `vault.albuquerquesz.com`, e por um bearer `vlt_mcp_` só de leitura. Esse servidor sabe o resumo, as transações, as faturas, as metas, as assinaturas detectadas e as categorias. Com OAuth ele cria transação manual, recategoriza, oculta gasto bancário e cria ou atualiza meta.

A página do Visor promete um assistente que também mexe em orçamento, teto, poupança, cartão, parcela, conta fixa, investimento, espaço e gráfico, e pede confirmação antes de destruir. No Vault, renda orçada, teto de gasto, percentual de poupança e exclusão de meta ou de transação manual já existem na API e na tela, e o MCP não os oferece. O resto do anúncio do Visor não tem modelo no Vault.

## Solution

O assistente passa a ler e gravar no MCP remoto, hospedado na nuvem, só o que a API do Vault já faz e esse MCP ainda não expõe: renda orçada do mês, teto de gasto, percentual de poupança, apagar meta e apagar transação manual. O cliente chama a URL. Não roda servidor na máquina.

O bearer estático continua sem escrita. Tool destrutiva anuncia isso e a descrição manda o cliente confirmar com a pessoa antes de chamar. O servidor não cria um segundo passo de confirmação: o protocolo não tem esse retorno.

Não se copia tela, espaço, carteira, parcela, regra de categoria, Pix nem "marcar fatura paga".

## User Stories

1. Como usuário do Vault, quero pedir o teto de gasto de um mês `AAAA-MM`, para saber o alvo, o quanto já foi e se passei, sem abrir a tela.
2. Como usuário do Vault, quero que esse teto use a mesma conta do dashboard, para o número da conversa e o da tela não divergirem.
3. Como usuário do Vault, quero informar um dia `AAAA-MM-DD` ao ler o teto, para o ritmo diário bater com o dia que eu disser.
4. Como usuário do Vault, quero gravar o teto de gasto de um mês pelo assistente, para ajustar o mês na conversa.
5. Como usuário do Vault, quero que gravar o teto de um mês que já tem teto substitua o valor, para não existirem dois tetos no mesmo mês.
6. Como usuário do Vault, quero recusar teto zero ou negativo, para a meta continuar sendo um valor positivo em reais.
7. Como usuário do Vault, quero ver a renda orçada do mês no resumo que o MCP já devolve, para não ganhar uma segunda tool de leitura.
8. Como usuário do Vault, quero gravar a renda orçada de um mês pelo assistente, para o resumo passar a usar esse número.
9. Como usuário do Vault, quero que gravar a renda de um mês que já tem renda substitua o valor.
10. Como usuário do Vault, quero recusar renda zero ou negativa.
11. Como usuário do Vault, quero ler o percentual de poupança de um mês, para saber a meta de sobra daquele mês.
12. Como usuário do Vault, quero receber percentual vazio quando o mês não tem meta de poupança, para distinguir "não definido" de zero.
13. Como usuário do Vault, quero gravar o percentual de poupança de um mês pelo assistente.
14. Como usuário do Vault, quero que gravar o percentual de um mês que já tem percentual substitua o valor.
15. Como usuário do Vault, quero apagar uma meta pelo id que `list_goals` devolveu, para tirar uma meta encerrada sem abrir a tela.
16. Como usuário do Vault, quero que apagar uma meta que não é minha, ou que não existe, falhe sem apagar outra.
17. Como usuário do Vault, quero apagar várias transações manuais de uma vez, até cem ids, para limpar lançamentos que eu mesmo criei.
18. Como usuário do Vault, quero que essa exclusão ignore lançamento vindo do banco, para o Open Finance continuar sendo a fonte.
19. Como usuário do Vault, quero a contagem do que foi apagado, para saber se algum id foi ignorado.
20. Como usuário com bearer `vlt_mcp_`, quero que renda, teto, poupança, apagar meta e apagar transação manual não existam na lista de tools, para o token seguir só de leitura.
21. Como usuário com bearer `vlt_mcp_`, quero continuar lendo teto, poupança e o resumo que já inclui a renda orçada.
22. Como usuário conectado por OAuth, quero ver as tools de escrita novas na lista.
23. Como usuário do Vault, quero mês inválido no formato que a API já usa (`error` e `code`), para o assistente não inventar outro erro.
24. Como usuário do Vault, quero que apagar meta, apagar transação manual e ocultar lançamento bancário venham marcados como destrutivos.
25. Como usuário do Vault, quero que a descrição dessas tools diga para confirmar comigo antes da chamada, para a confirmação ficar no cliente, como o Visor pede na página.
26. Como usuário do Vault, quero que criar transação, recategorizar e atualizar meta continuem sem essa marca destrutiva, para uma correção comum não parecer apagamento.
27. Como usuário do Vault, quero que investimento, transferência entre contas próprias e pagamento de fatura continuem fora do gasto do mês.
28. Como usuário do Vault, quero que assinatura detectada continue de fora de parcela, para parcela não virar conta fixa.
29. Como usuário do Vault, quero revogar o bearer na tela de configurações que já existe, para cortar o acesso de leitura sem uma tool nova.
30. Como usuário do Vault, quero o mesmo MCP HTTP de hoje, na nuvem, para Claude, Cursor e os outros clientes que já apontam para essa URL não ganharem um segundo servidor.
31. Como usuário do Vault, quero configurar o cliente só com a URL do MCP na nuvem, para não instalar nem rodar um processo MCP na minha máquina.

## Implementation Decisions

- MCP único: o remoto na nuvem, HTTP sem estado, em `vault.albuquerquesz.com`. O cliente chama essa URL. Não há processo MCP na máquina.
- Cada tool nova chama a rota de finanças que já existe, no mesmo serviço da nuvem, com o usuário do token. A chamada não sai para um binário local.
- O pacote stdio local deixa de ser caminho de produto. Esta entrega não adiciona tool nele. A doc que manda rodar o MCP com `bun` na máquina sai do caminho principal. Apagar o pacote pode ir no mesmo PR e não é pré-requisito das tools novas. Decisão do Victor em 17/11/2026.
- Bearer `vlt_mcp_` registra só leitura. OAuth registra leitura e escrita. Isso já vale para as tools atuais e vale para as novas.
- Leituras novas precisam aceitar o mesmo usuário de MCP que o resumo e o teto já aceitam na rota de leitura do teto. Escritas continuam exigindo sessão de OAuth.
- Renda orçada: uma tool de escrita no mês. A leitura permanece no resumo financeiro. Sem tool duplicada.
- Teto de gasto: uma tool de leitura (mês obrigatório, dia opcional) e uma de escrita (mês e valor positivo). Regravar o mês substitui.
- Percentual de poupança: uma tool de leitura e uma de escrita, no mês. Mês sem registro devolve percentual vazio, não zero.
- Apagar meta: uma tool, id da meta, marca destrutiva. Não apaga meta de outro usuário.
- Apagar transação manual: uma tool, de um a cem ids, marca destrutiva. Só some lançamento manual. Lançamento do banco no meio do lote é ignorado. A resposta diz quantos saíram.
- Tool destrutiva: `destructiveHint` verdadeiro e descrição em português mandando o cliente confirmar com a pessoa antes de chamar. O servidor executa na hora. Não há segundo round-trip.
- Mês segue `AAAA-MM`. Erro de validação segue o corpo que a API já devolve.
- Não se cria tabela, espaço, carteira, parcela, regra de categoria, limite por categoria, conta fixa manual, aporte de meta, nem status de fatura paga. Fatura de cartão continua leitura. `paidAmount` que vem da Pluggy não vira botão.
- Gráfico continua na web. O MCP devolve os números que a tela já usa.
- Conectar banco continua na tela da Pluggy. Sem tool de conexão.
- Pix não se inicia. O Vault não move dinheiro.

## Testing Decisions

Um seam só: chamada HTTP ao MCP remoto, pelo JSON-RPC que o doc do MCP remoto já descreve (`initialize`, `tools/list`, `tools/call`). É o ponto que o cliente na nuvem usa. Não existe teste automático nesse seam hoje. Teste de token (`hash`, bearer) e teste do cliente stdio ficam de fora: o stdio local não é mais o produto.

O que um bom teste olha, de fora:

- Com JWT de OAuth, `tools/list` inclui as tools novas e não inclui tool de Pix, espaço, carteira ou fatura paga.
- Com bearer `vlt_mcp_`, `tools/list` não inclui escrita, e `tools/call` de escrita falha.
- Ler teto e percentual devolve o que a rota já devolve para o mesmo usuário e mês.
- Gravar renda, teto e percentual duas vezes deixa um valor só, o segundo.
- Apagar meta e apagar transação manual anunciam destrutivo. Ocultar lançamento bancário continua anunciando.
- Apagar transação manual não remove lançamento cuja origem é o banco, e a contagem bate.
- Mês inválido devolve o mesmo `code` da API.
- O resultado do mês continua sem contar investimento, transferência interna e pagamento de fatura. Isso já tem teste de classificação; não se reescreve esse teste no MCP, só se garante que a tool de insight segue essa rota.

Prior art: o procedimento manual de JWT mais JSON-RPC descrito no doc do MCP remoto, e os testes de serviço que já fixam classificação, assinatura (parcela fora) e cálculo do teto.

Victor confirmou em 17/11/2026: o seam é o MCP remoto na nuvem, por chamada HTTP. Sem stdio local. Sem teste de página.

## Out of Scope

- Copiar a tela logada do Visor. Essa sessão não foi aberta. Fluxo de telas fica para outra spec.
- Busca de transação por texto, editar valor ou data vinda do banco, regra automática de categoria, limite por categoria.
- Marcar fatura paga, cartão extra, lista de parcelas. O tipo guardado da Pluggy no Vault só segura o id da fatura no metadado de cartão. O script de sonda viu parcela na resposta crua; isso não está no modelo.
- Cadastro manual de conta fixa, receita recorrente e empréstimo. Assinatura segue detectada, não cadastrada.
- Aporte de meta como lançamento. Progresso continua um valor atual na meta.
- Carteira de investimentos e espaços (pessoal, casal, empresa).
- Gráfico, imagem ou spec de chart no MCP.
- Pix e qualquer início de pagamento.
- Plano Pro/Premium, CLI e API pessoal com escopo de Pix do Visor.
- Manter ou estender o servidor MCP local por stdio. Ele sai do caminho de produto. O cliente usa a URL na nuvem.
- Tool nova para revogar token ou conectar banco.

## Further Notes

- Glossário do repo: não há `GLOSSARY.md`, ADR nem `docs/agents/issue-tracker.md`. Vocabulário usado é o das tools e das rotas atuais: mês `AAAA-MM`, meta, teto de gasto, renda orçada, percentual de poupança, transação manual, lançamento bancário, assinatura detectada, fatura.
- Tracker: não publicado. Sem vocabulário de label, o `/to-spec` manda rodar `/setup-matt-pocock-skills` antes de abrir issue com `ready-for-agent`.
- Decisão de 17/11/2026: sem MCP local. O Vault está na nuvem. O assistente chama o MCP remoto.
- O de/para do Visor é afirmação de página de marketing, não de `tools/list` ao vivo.
- Empresa na página do Visor: VISOR TECNOLOGIA DA INFORMACAO LTDA, CNPJ 64.084.199/0001-66. Open Finance deles via Pluggy. O Vault também usa Pluggy.
