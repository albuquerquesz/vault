# MCP local do Vault

O Vault pode ser consultado por agentes compatíveis com o Model Context Protocol
(MCP) através de um servidor local em `apps/mcp`. O servidor usa `stdio` e faz
as chamadas autenticadas para a API do Vault; nenhum endpoint MCP público é
exposto.

## Criar um token

1. Abra o Vault e entre em **Configurações → MCP**.
2. Dê um nome ao token e clique em **Criar token**.
3. Copie o valor exibido. Por segurança, o valor completo só aparece uma vez.

O token concede apenas acesso de leitura aos dados financeiros do usuário. Para
interromper o acesso, revogue-o na mesma tela.

## Configurar um cliente MCP

Em um cliente como Claude Desktop ou Cursor, adicione um servidor MCP com o
comando abaixo. Use o caminho absoluto para este repositório e a URL pública do
Vault (a mesma usada no navegador):

```json
{
  "mcpServers": {
    "vault": {
      "command": "bun",
      "args": ["run", "/caminho/absoluto/para/vault/apps/mcp/src/index.ts"],
      "env": {
        "VAULT_API_URL": "https://seu-vault.example.com",
        "VAULT_MCP_TOKEN": "vlt_mcp_..."
      }
    }
  }
}
```

O token deve ficar somente na configuração local do cliente e não deve ser
commitado no repositório.

## Executar manualmente

```bash
VAULT_API_URL=https://seu-vault.example.com \
VAULT_MCP_TOKEN=vlt_mcp_... \
bun run apps/mcp/src/index.ts
```

## Ferramentas disponíveis

- `get_financial_overview({ month })`: orçamento, renda, gastos e saldo.
- `list_transactions({ month })`: transações do mês.
- `get_monthly_bills({ month })`: contas e cobranças do mês.
- `list_goals()`: metas financeiras.
- `get_spending_insights({ month })`: gastos, renda, resultado e comparação com o mês anterior.

As ferramentas de mês usam o formato `YYYY-MM`. Todas são somente leitura;
operações de criação, edição ou exclusão continuam disponíveis apenas na
interface do Vault.
