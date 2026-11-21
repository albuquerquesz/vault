# Spec: API pessoal com token de leitura

Status (20/11/2026): A rever.

Origem: lacuna #19. Formato `/to-spec`, sem entrevista. O plano Pro do Visor inclui "usar a API pessoal do Visor" (página `/precos`). Não li a documentação dessa API.

## Problem Statement

Quem quer ler os próprios dados do Vault em um script, uma planilha ou uma automação só tem o MCP. As rotas `/api/finance/*` existem e várias aceitam o token de leitura do MCP, mas elas não são um contrato público: não têm versão, documentação nem limite de uso, e o token vem de uma tela chamada "MCP".

## Solution

Uma API pessoal de leitura, versionada em `/api/v1`, com tokens próprios e documentação. Reaproveita as rotas e a validação que já existem; muda o contrato, a emissão do token e a proteção.

## User Stories

1. Como usuário, quero criar um token de API nas configurações, com um nome.
2. Como usuário, quero ver o valor do token só uma vez, ao criar.
3. Como usuário, quero listar meus tokens com data de criação e último uso.
4. Como usuário, quero revogar um token.
5. Como usuário, quero ler resumo, transações do mês, categorias, metas, assinaturas, faturas, teto de gasto e poupança por `/api/v1`.
6. Como usuário, quero que essas rotas devolvam exatamente os mesmos números da tela.
7. Como usuário, quero que o token de API seja só de leitura.
8. Como usuário, quero que o token de API não funcione nas rotas de escrita, nem no MCP.
9. Como usuário, quero que o token do MCP não funcione na API pessoal, para separar os acessos.
10. Como usuário, quero uma documentação das rotas, dos parâmetros e dos erros.
11. Como usuário, quero que um erro de validação use o mesmo formato `{ error, code }` do resto do produto.
12. Como operador, quero um limite de requisições por token, com resposta 429 clara.
13. Como usuário, quero que as rotas `/api/v1` não mudem de forma sem aviso.

## Implementation Decisions

- Reaproveitar a tabela e o serviço de tokens do MCP (`mcp_access_token`, `services/mcp-tokens.ts`, hash do valor): coluna nova `kind` (`mcp` | `api`) e prefixo `vlt_api_` para o valor. O MCP continua aceitando só `kind = mcp`; a API pessoal só `kind = api`.
- `requireSession` já aceita bearer em rotas marcadas com `allowMcpToken`. Introduzir um caminho paralelo `allowApiToken` e registrar as rotas de leitura sob `/api/v1`, como aliases das atuais (mesmos handlers).
- Rotas iniciais: `GET /api/v1/overview`, `/transactions`, `/categories`, `/goals`, `/subscriptions`, `/monthly-bills`, `/spending-goal`, `/savings-target`, `/partial-result`. Nenhuma de escrita.
- Documentação em `docs/api.md` (rotas, parâmetros, exemplos, erros) mantida junto do código. Um OpenAPI gerado dos schemas zod fica como melhoria, não como requisito.
- Limite de requisições por token: **a decidir** entre uma regra de rate limit da Cloudflare e um contador no Worker (a confirmar o que o plano atual permite). Resposta 429 com `Retry-After`.
- Tela: lista de tokens na seção de configurações que já gerencia os tokens do MCP, com abas ou rótulo separando os dois tipos.
- Compatibilidade: as rotas internas `/api/finance/*` seguem como estão, usadas pela web; só `/api/v1` é contrato.

## Testing Decisions

Seam: chamadas HTTP à API com tokens.

- Token `api` lê as rotas de `/api/v1`; as respostas são iguais às de `/api/finance` para o mesmo usuário e mês.
- Token `api` é recusado no `/api/mcp` e nas rotas de escrita.
- Token `mcp` é recusado em `/api/v1`.
- Token revogado e token inexistente devolvem 401.
- O valor do token só aparece na criação; a listagem não o devolve.
- Passar do limite devolve 429 com `Retry-After`.
- Mês inválido devolve o mesmo `code` da API.

## Out of Scope

Escrita pela API, webhooks de saída, OAuth para integrações de terceiros (já existe no MCP), SDK em outras linguagens, escopos por domínio na API (a spec 09 trata disso só no MCP).

## Further Notes

- Para o público do Vault (desenvolvedores) é barata e útil; deixa de ser prioridade se ninguém pedir.
- O lançamento exige decidir o limite de uso antes de abrir a API, para não repetir a lacuna de rate limit da análise de 19/11.
