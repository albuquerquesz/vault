# Spec: assistente de IA dentro do Vault

Status (20/11/2026): **Revista pelo Victor**: sem IA própria; AG-UI com o Claude da VPS. Ver o aviso no topo.

> **Decisão do Victor (20/11): não implementar IA própria.** O Vault é de uso pessoal e roda na VPS dele. Em vez de integrar um modelo e controlar custo por pergunta, o app usa o protocolo **AG-UI** para rodar uma instância do Claude (Claude Code) dentro da VPS, com a **assinatura Claude** que ele já tem. O texto abaixo é a versão original (IA própria) e deve ser **revista** antes de qualquer código; as seções "Solution" e "Implementation Decisions" mudam. Pontos a decidir na revisão: como o Claude na VPS chama as tools (o MCP remoto do próprio Vault ou funções em processo), como o app fala AG-UI (SSE a partir do Worker ou de um processo na VPS), e que o Claude Code CLI na VPS deve estar autenticado com a assinatura (a confirmar se o uso por assinatura em um processo automatizado é permitido pelos termos do plano).

Origem: lacuna #9. Formato `/to-spec`, sem entrevista. O Visor tem "Pergunte ao Visor": chat no app e no WhatsApp, com envio de foto e arquivo e cota de 50 perguntas por mês no plano Basic (página `/precos`).

## Problem Statement

Hoje a única IA do Vault é a de fora: o usuário conecta Claude, ChatGPT ou Cursor ao MCP. Quem não usa um cliente MCP, ou quer perguntar do celular dentro do próprio app, não tem assistente.

## Solution

Um painel de conversa na web que responde perguntas sobre as finanças do usuário, usando as mesmas funções que o MCP expõe. Leitura livre; qualquer escrita pede confirmação na tela antes de executar. O uso é limitado por cota mensal por usuário.

## User Stories

1. Como usuário, quero perguntar em linguagem natural "quanto gastei com alimentação este mês?" e receber o número com a fonte.
2. Como usuário, quero que a resposta use só os meus dados.
3. Como usuário, quero que o assistente possa pedir a projeção de saldo e responder "posso comprar isso?" com base nela (spec 01).
4. Como usuário, quero que o assistente liste as ferramentas que usou, para eu poder conferir de onde veio o número.
5. Como usuário, quero que qualquer ação de escrita (criar meta, recategorizar, apagar) peça minha confirmação antes de acontecer.
6. Como usuário, quero que ações destrutivas peçam uma confirmação mais forte.
7. Como usuário, quero ver quantas perguntas me restam no mês.
8. Como usuário, quero que, ao acabar a cota, o app diga isso claramente e não falhe em silêncio.
9. Como usuário, quero que a conversa seja continuada dentro de uma sessão e possa ser apagada.
10. Como usuário, quero que minhas conversas não sejam usadas para treinar modelos.
11. Como usuário, quero que o assistente diga quando não sabe, em vez de inventar um número.
12. Como operador, quero desligar o assistente por configuração sem afetar o resto do app.
13. Como operador, quero registrar custo e uso por usuário.
14. Como usuário, quero que o assistente funcione dentro do app instalado como PWA.

## Implementation Decisions

- Rota `POST /api/assistant/chat` com resposta em streaming, autenticada pela sessão do app (não pelo token MCP).
- As ferramentas do assistente são as mesmas funções das tools do MCP, chamadas em processo com o usuário da sessão (mesmo caminho que `createVaultMcpServer` usa). Uma camada comum evita duas listas de ferramentas.
- Escrita: o servidor nunca executa uma tool de escrita direto do modelo. Ele devolve ao cliente um pedido de confirmação com os argumentos; a execução acontece em uma segunda chamada, depois do clique. Tools com `destructiveHint` exigem confirmação reforçada.
- Cota: contador mensal por usuário em `UserSettings` ou tabela própria (`assistant_usage`: `user_id`, `month`, `count`), consultado antes de cada pergunta. Limite inicial configurável por variável de ambiente.
- Modelo e provedor: **a decidir** (custo e privacidade); a camada deve ser agnóstica de provedor. Nenhuma chave no repositório.
- Privacidade: o prompt leva só o que a pergunta exige, vindo das tools; sem enviar transações brutas inteiras; contrato com o provedor sem treino com os dados.
- Interface: painel lateral ou página `/assistant`, com a lista de ferramentas usadas em cada resposta.
- Sem WhatsApp, foto ou arquivo na primeira versão.

## Testing Decisions

A conversa em si não é testada contra um modelo real; o contrato com o modelo fica atrás de uma interface com um falso. Seam: a rota de chat.

- Uma pergunta de leitura executa a tool certa com o usuário da sessão e devolve a resposta e as ferramentas usadas.
- Uma ação de escrita pedida pelo modelo vira um pedido de confirmação e **não** altera nada; só a segunda chamada executa.
- Tool destrutiva exige a confirmação reforçada.
- Cota esgotada devolve erro claro e não chama o modelo.
- O assistente de um usuário nunca recebe dados de outro.
- Com o assistente desligado por configuração, a rota devolve 404.

## Out of Scope

WhatsApp, foto e arquivo no chat, voz, memória longa entre sessões, ações autônomas sem confirmação, treino ou ajuste fino de modelo.

## Further Notes

- É a spec mais cara de operar (custo por pergunta). Vale medir primeiro quantas pessoas pedem isso, porque o MCP já atende o usuário técnico, que é o público do Vault (`PRODUCT.md`).
- Se for feita, as specs 09 (escopos) e 11 (busca) melhoram muito o que o assistente consegue fazer.
