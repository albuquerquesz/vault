import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

/** Sends a request to the Vault API in-process, as the current MCP user. */
export type ApiDispatch = (
	method: "GET" | "POST" | "PATCH",
	path: string,
	body?: unknown,
) => Promise<Response>;

const month = z
	.string()
	.regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato AAAA-MM")
	.describe("Mês no formato AAAA-MM, por exemplo 2026-10");

const ids = z
	.array(z.string().uuid())
	.min(1)
	.max(100)
	.describe("IDs das transações, como retornados por list_transactions");

const readOnly = {
	readOnlyHint: true,
	destructiveHint: false,
	openWorldHint: false,
};
const write = {
	readOnlyHint: false,
	destructiveHint: false,
	openWorldHint: false,
};

async function toToolResult(response: Response) {
	const text = await response.text();
	if (!response.ok) {
		// Coded API errors ({ error, code }) are already user-facing text.
		let message = text;
		try {
			const body = JSON.parse(text) as { error?: string; code?: string };
			message = body.code
				? `${body.error} (${body.code})`
				: (body.error ?? text);
		} catch {}
		return {
			content: [{ type: "text" as const, text: message }],
			isError: true,
		};
	}
	return { content: [{ type: "text" as const, text: text || "ok" }] };
}

/** One MCP server per request (stateless); tools map 1:1 to API routes. */
export function createVaultMcpServer(dispatch: ApiDispatch) {
	const server = new McpServer({ name: "vault", version: "1.0.0" });
	const call = async (...args: Parameters<ApiDispatch>) =>
		toToolResult(await dispatch(...args));
	const q = (value: string) => encodeURIComponent(value);

	server.registerTool(
		"get_financial_overview",
		{
			title: "Resumo financeiro",
			description: "Orçamento, renda, gastos e saldo do mês informado.",
			inputSchema: z.object({ month }),
			annotations: readOnly,
		},
		({ month }) => call("GET", `/api/finance/overview?month=${q(month)}`),
	);

	server.registerTool(
		"get_spending_insights",
		{
			title: "Receita, gasto e saldo do mês",
			description:
				"Receita, gasto e resultado do mês (mesmos números do dashboard). Transferências entre contas próprias, investimentos e pagamento de fatura não contam.",
			inputSchema: z.object({ month }),
			annotations: readOnly,
		},
		({ month }) => call("GET", `/api/finance/partial-result?month=${q(month)}`),
	);

	server.registerTool(
		"list_transactions",
		{
			title: "Listar transações",
			description:
				"Transações bancárias e manuais do mês, com id, data, valor (negativo = gasto), categoria e conta.",
			inputSchema: z.object({ month }),
			annotations: readOnly,
		},
		({ month }) => call("GET", `/api/finance/transactions?month=${q(month)}`),
	);

	server.registerTool(
		"get_monthly_bills",
		{
			title: "Faturas do mês",
			description: "Faturas de cartão e contas do mês informado.",
			inputSchema: z.object({ month }),
			annotations: readOnly,
		},
		({ month }) => call("GET", `/api/finance/monthly-bills?month=${q(month)}`),
	);

	server.registerTool(
		"list_goals",
		{
			title: "Listar metas",
			description: "Metas financeiras do usuário, com valor alvo e atual.",
			annotations: readOnly,
		},
		() => call("GET", "/api/finance/goals"),
	);

	server.registerTool(
		"list_categories",
		{
			title: "Listar categorias",
			description:
				"Categorias já usadas, com contagem. Use antes de recategorizar ou criar transações para reaproveitar nomes existentes.",
			annotations: readOnly,
		},
		() => call("GET", "/api/finance/categories"),
	);

	server.registerTool(
		"create_manual_transaction",
		{
			title: "Registrar transação manual",
			description: "Registra um gasto ou uma receita em dinheiro/manual.",
			inputSchema: z.object({
				kind: z
					.enum(["expense", "income"])
					.describe("expense = gasto, income = receita"),
				date: z.iso.date().describe("Data AAAA-MM-DD"),
				amount: z.number().positive().describe("Valor positivo em reais"),
				category: z.string().trim().min(1).max(64),
				note: z.string().trim().max(280).optional(),
			}),
			annotations: write,
		},
		(input) => call("POST", "/api/finance/transactions/manual", input),
	);

	server.registerTool(
		"recategorize_transactions",
		{
			title: "Recategorizar transações",
			description:
				"Muda a categoria exibida de transações. Não altera se elas contam como gasto ou receita.",
			inputSchema: z.object({
				ids,
				category: z.string().trim().min(1).max(64),
			}),
			annotations: write,
		},
		(input) => call("POST", "/api/finance/transactions/recategorize", input),
	);

	server.registerTool(
		"hide_transactions",
		{
			title: "Ocultar transações",
			description:
				"Oculta gastos bancários do dashboard (por exemplo duplicados). Só gastos podem ser ocultados.",
			inputSchema: z.object({ ids }),
			annotations: { ...write, destructiveHint: true },
		},
		(input) => call("POST", "/api/finance/transactions/hide", input),
	);

	server.registerTool(
		"create_goal",
		{
			title: "Criar meta",
			description: "Cria uma meta financeira.",
			inputSchema: z.object({
				name: z.string().trim().min(1).max(128),
				targetAmount: z.number().positive(),
				currentAmount: z.number().min(0).optional(),
			}),
			annotations: write,
		},
		(input) => call("POST", "/api/finance/goals", input),
	);

	server.registerTool(
		"update_goal",
		{
			title: "Atualizar meta",
			description: "Atualiza nome, valores ou conclusão de uma meta.",
			inputSchema: z.object({
				id: z.string().describe("ID da meta, como retornado por list_goals"),
				name: z.string().trim().min(1).max(128).optional(),
				targetAmount: z.number().positive().optional(),
				currentAmount: z.number().min(0).optional(),
				isCompleted: z.boolean().optional(),
			}),
			annotations: write,
		},
		({ id, ...patch }) => call("PATCH", `/api/finance/goals/${q(id)}`, patch),
	);

	return server;
}
