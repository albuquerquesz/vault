# PWA e Web Push

O Vault usa `vite-plugin-pwa` com `injectManifest` e o service worker em `apps/web/src/sw.ts`. O manifest existente em `apps/web/public/manifest.webmanifest` é a única fonte do manifest. O worker armazena somente arquivos estáticos; navegações sem rede mostram `offline.html`. Respostas de `/api` e dados financeiros não são armazenados pelo worker. A atualização do worker depende do clique no aviso mostrado no app.

Configure `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` na API para habilitar notificações. Gere um par estável com `bunx web-push generate-vapid-keys --json`; mantenha a chave privada somente no servidor. A tabela `push_subscription` exige a migração Drizzle `0017_salty_captain_flint.sql`. Sem VAPID, a API continua funcionando e a interface mostra o recurso indisponível.

O teste envia uma notificação apenas para a subscription do dispositivo autenticado, com limite de um envio por minuto. Respostas permanentes 404/410 removem a subscription; falhas temporárias a preservam. O endpoint é guardado por hash e o conteúdo da subscription é criptografado pelo mecanismo de segredos do projeto.

O `kubojs.jsonrc` registra a stack real e fixa o CLI em `@kubojs/cli@0.2.2`. Antes de adicionar outro addon, rode `bunx kubojs add-json --input '{"projectDir":".","addons":["nome"],"dryRun":true}'` e revise os arquivos propostos e o diff antes de aplicar. O addon PWA genérico foi apenas inspecionado via dry run; a implementação própria evita sobrescrever o manifest e o fluxo de atualização do Vault.

Valide no preview HTTPS: `/sw.js` deve ser JavaScript, `/manifest.webmanifest` deve retornar o manifest, e `/api/*` deve chegar à API. Confira a instalação, a atualização com aviso, o modo offline e a entrega de push com o app fechado em Chrome/Android e em um iPhone instalado na Tela de Início. O navegador local não comprova entrega com o app fechado.
