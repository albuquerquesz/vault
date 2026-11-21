# Spec: conectar banco sem criar conta própria na Pluggy

Status (20/11/2026): A rever (depende do custo da Pluggy).

Origem: lacuna #3. Formato `/to-spec`, sem entrevista. A home do Visor diz "Conecte sua conta em 2 minutos". **Esta spec depende de uma decisão de negócio** (custo e contrato da Pluggy em produção), descrita em Further Notes.

## Problem Statement

Hoje cada usuário do Vault precisa criar um aplicativo na Pluggy e colar o `clientId` e o `clientSecret` nas configurações (`pluggy_credentials`, cifrado em AES-256-GCM). Isso funciona para quem é desenvolvedor e quer o controle dos próprios dados, mas é o maior freio de adoção: antes da primeira transação aparecer, a pessoa passa por um cadastro em outro produto.

## Solution

Um modo em que o Vault usa uma credencial Pluggy **do servidor**, definida em variável de ambiente, quando o usuário não cadastrou a dele. O fluxo vira: entrar, clicar em conectar banco, autorizar no widget da Pluggy. A credencial própria continua existindo como alternativa para quem quer ser dono da conexão.

## User Stories

1. Como novo usuário, quero conectar meu banco sem criar conta na Pluggy.
2. Como usuário, quero que o botão de conectar abra o widget da Pluggy direto na primeira vez.
3. Como usuário avançado, quero continuar podendo usar minhas próprias credenciais da Pluggy.
4. Como usuário, quero saber, nas configurações, se estou usando a conexão do Vault ou a minha.
5. Como usuário, quero trocar de uma para a outra sem perder minhas transações.
6. Como usuário, quero que os meus dados fiquem separados dos de outros usuários, mesmo na mesma credencial do servidor.
7. Como usuário, quero que os webhooks e o refresh diário funcionem igual nos dois modos.
8. Como operador, quero que o Vault avise claramente quando falta a credencial do servidor e o usuário não tem a própria.
9. Como operador, quero registrar o webhook da Pluggy uma vez só para a credencial do servidor, e não um por usuário.
10. Como usuário, quero poder apagar minha conexão e meus dados e que isso também remova o item na Pluggy.
11. Como usuário, quero que a mensagem de "credenciais ausentes" deixe de aparecer para quem usa o modo do servidor.

## Implementation Decisions

- Variáveis de ambiente opcionais `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` em `db/env.ts`. Sem elas, o comportamento é o de hoje.
- `resolvePluggyCredentials(userId)` (`services/connectors/credentials.ts`) passa a: usar a credencial do usuário, se houver; senão a do servidor, se configurada; senão `MissingPluggyCredentialsError`. Marca a origem (`user` ou `server`) no retorno.
- Os itens já são particionados por `clientUserId` (o `refresh-token` envia `clientUserId: session.user.id` ao criar o token de conexão); manter. O webhook já resolve o item por `itemId` e `clientUserId`.
- Webhook: no modo do servidor há um registro só (hoje `ensurePluggyWebhookRegistered` roda por usuário e cria um por credencial). Ajustar para registrar uma vez por `clientId` distinto.
- O refresh diário (PR #20, `services/pluggy-refresh.ts`) já agrupa credenciais por usuário; com a do servidor, reaproveita a mesma instância.
- Tela: `/pluggy` e configurações mostram "Conexão do Vault" ou "Sua conexão Pluggy", com o atalho para trocar.
- Trocar de modo mantém os dados locais; os itens antigos, criados na outra credencial, deixam de ser alcançáveis (o `itemId` pertence a outro aplicativo da Pluggy). Tratar como item "órfão" já existente (`markPluggyItemAsOrphaned`) e pedir reconexão.
- LGPD: o texto de consentimento e a política passam a dizer que os dados bancários trafegam por uma credencial operada pelo Vault.

## Testing Decisions

Seam: o serviço de credenciais e as rotas de conexão, com `fetch` falso para a Pluggy.

- Usuário com credencial própria usa a própria, mesmo com a do servidor configurada.
- Usuário sem a própria usa a do servidor; sem nenhuma, recebe o erro de credencial ausente.
- Webhook registrado uma vez para dois usuários no modo do servidor.
- Item criado no modo do servidor leva o `clientUserId` do usuário correto.
- Trocar de modo marca os itens antigos como órfãos e não apaga transações.
- O texto do erro de credencial ausente não aparece no modo do servidor.

## Out of Scope

Cobrar o usuário, cotas por plano, múltiplos aplicativos Pluggy por região, conectores que não sejam da Pluggy.

## Further Notes

- **Decisão de negócio pendente.** O aplicativo "Vault" na Pluggy está em ambiente DEVELOPMENT, plano FREE, com `updateFrequencyInHours` zero e os produtos ACCOUNTS, CREDIT_CARDS e TRANSACTIONS. Atender outros usuários exige ambiente de produção e, muito provavelmente, plano pago da Pluggy; **não verifiquei preço nem requisitos**. O custo por item conectado define se o Vault é gratuito ou cobrado.
- É a spec de maior efeito em adoção e a única do pacote que depende de dinheiro.
