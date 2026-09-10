import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
	getFinancialOverview,
	getMonthlyBills,
	getSpendingInsights,
	listGoals,
	listTransactions,
} from "./api-client.js";

const monthInputSchema = {
	month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato YYYY-MM"),
};

const readOnlyAnnotations = {
	readOnlyHint: true,
	destructiveHint: false,
	openWorldHint: false,
};

function result(data: unknown) {
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(data, null, 2),
			},
		],
		structuredContent: { data },
	};
}

function errorResult(error: unknown) {
	const message =
		error instanceof Error ? error.message : "Unknown Vault API error";
	return {
		content: [{ type: "text" as const, text: message }],
		isError: true,
	};
}

async function safeCall<T>(callback: () => Promise<T>) {
	try {
		return result(await callback());
	} catch (error) {
		return errorResult(error);
	}
}

const server = new McpServer({
	name: "vault",
	version: "0.1.0",
});

server.registerTool(
	"get_financial_overview",
	{
		title: "Resumo financeiro",
		description: "Retorna orçamento, renda, gastos e saldo do mês informado.",
		inputSchema: monthInputSchema,
		annotations: readOnlyAnnotations,
	},
	({ month }) => safeCall(() => getFinancialOverview({ month })),
);

server.registerTool(
	"list_transactions",
	{
		title: "Listar transações",
		description:
			"Lista as transações manuais e bancárias visíveis do mês informado.",
		inputSchema: monthInputSchema,
		annotations: readOnlyAnnotations,
	},
	({ month }) => safeCall(() => listTransactions({ month })),
);

server.registerTool(
	"get_monthly_bills",
	{
		title: "Contas mensais",
		description: "Retorna as contas e itens de cobrança do mês informado.",
		inputSchema: monthInputSchema,
		annotations: readOnlyAnnotations,
	},
	({ month }) => safeCall(() => getMonthlyBills({ month })),
);

server.registerTool(
	"list_goals",
	{
		title: "Listar metas",
		description: "Lista as metas financeiras do usuário autenticado.",
		annotations: readOnlyAnnotations,
	},
	() => safeCall(listGoals),
);

server.registerTool(
	"get_spending_insights",
	{
		title: "Insights de gastos",
		description:
			"Retorna gastos, renda, resultado e comparação com o mês anterior.",
		inputSchema: monthInputSchema,
		annotations: readOnlyAnnotations,
	},
	({ month }) => safeCall(() => getSpendingInsights({ month })),
);

const transport = new StdioServerTransport();

try {
	await server.connect(transport);
} catch (error) {
	console.error(
		"Failed to start Vault MCP server:",
		error instanceof Error ? error.message : error,
	);
	process.exitCode = 1;
}
