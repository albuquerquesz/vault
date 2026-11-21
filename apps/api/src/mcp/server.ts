import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

/** Sends a request to the Vault API in-process, as the current MCP user. */
export type ApiDispatch = (
	method: "GET" | "POST" | "PATCH" | "DELETE",
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
export function createVaultMcpServer(
	dispatch: ApiDispatch,
	options: { readOnly: boolean },
) {
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
		"list_subscriptions",
		{
			title: "Assinaturas atuais",
			description:
				"Assinaturas e cobranças mensais recorrentes ainda ativas, com valor, última cobrança e próxima data esperada. Não há cadastro de assinaturas: são detectadas no histórico de gastos (mesmo estabelecimento, cobrança a cada ~30 dias, valor estável, última cobrança nos últimos 45 dias). Parcelas ficam de fora.",
			annotations: readOnly,
		},
		() => call("GET", "/api/finance/subscriptions"),
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
		"get_spending_goal",
		{
			title: "Teto de gasto do mês",
			description:
				"Teto de gasto do mês, quanto já foi e o ritmo diário (mesma conta do dashboard). Dia opcional para o ritmo.",
			inputSchema: z.object({
				month,
				today: z.iso
					.date()
					.optional()
					.describe("Dia AAAA-MM-DD usado no ritmo diário"),
			}),
			annotations: readOnly,
		},
		({ month, today }) =>
			call(
				"GET",
				`/api/finance/spending-goal?month=${q(month)}${today ? `&today=${q(today)}` : ""}`,
			),
	);

	server.registerTool(
		"get_savings_target",
		{
			title: "Percentual de poupança do mês",
			description:
				"Percentual de poupança do mês. savingsPercentage nulo = não definido (não é zero).",
			inputSchema: z.object({ month }),
			annotations: readOnly,
		},
		({ month }) => call("GET", `/api/finance/savings-target?month=${q(month)}`),
	);

	server.registerTool(
		"search_transactions",
		{
			title: "Buscar transações",
			description:
				"Busca transações bancárias e manuais por texto (descrição ou categoria, sem diferenciar maiúsculas nem acentos), valor, categoria, tipo e período. Sem período, olha os últimos 3 meses; o máximo é 24 meses. Valores mínimo e máximo são em reais, sem sinal. Paginado: use nextCursor para a próxima página.",
			inputSchema: z.object({
				q: z.string().trim().min(1).max(100).optional(),
				from: z.iso.date().optional().describe("Data inicial AAAA-MM-DD"),
				to: z.iso.date().optional().describe("Data final AAAA-MM-DD"),
				minAmount: z.number().min(0).optional(),
				maxAmount: z.number().min(0).optional(),
				category: z.string().trim().min(1).max(64).optional(),
				kind: z.enum(["income", "expense"]).optional(),
				limit: z.number().int().min(1).max(200).optional(),
				cursor: z.string().max(12).optional(),
			}),
			annotations: readOnly,
		},
		(input) => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(input))
				if (value !== undefined) params.set(key, String(value));
			return call("GET", `/api/finance/transactions/search?${params.toString()}`);
		},
	);

	server.registerTool(
		"get_category_limits",
		{
			title: "Limites por categoria",
			description:
				"Limites de gasto por categoria no mês, com quanto já foi, quanto resta, o percentual usado e se passou do limite. Só despesas contam; investimento, transferência para si e pagamento de fatura ficam de fora.",
			inputSchema: z.object({ month }),
			annotations: readOnly,
		},
		({ month }) => call("GET", `/api/finance/category-limits?month=${q(month)}`),
	);

	server.registerTool(
		"get_goal_plan",
		{
			title: "Plano de uma meta",
			description:
				"Quanto falta para a meta e, se ela tem prazo, quanto guardar por mês até lá (sem juros). Informa se o prazo já passou.",
			inputSchema: z.object({
				id: z.string().uuid().describe("ID da meta, como retornado por list_goals"),
			}),
			annotations: readOnly,
		},
		({ id }) => call("GET", `/api/finance/goals/${q(id)}/plan`),
	);

	server.registerTool(
		"list_goal_contributions",
		{
			title: "Aportes de uma meta",
			description: "Histórico de aportes e retiradas de uma meta, do mais recente para o mais antigo.",
			inputSchema: z.object({
				id: z.string().uuid().describe("ID da meta, como retornado por list_goals"),
			}),
			annotations: readOnly,
		},
		({ id }) => call("GET", `/api/finance/goals/${q(id)}/contributions`),
	);

	// API keys (vlt_mcp_…) are read-only; writes need an OAuth login.
	if (options.readOnly) return server;

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
		"update_manual_transaction",
		{
			title: "Editar transação manual",
			description:
				"Edita valor, data, categoria ou nota de uma transação criada à mão. Lançamentos vindos do banco não podem ter valor nem data editados (o banco é a fonte); para eles use recategorize_transactions.",
			inputSchema: z
				.object({
					id: z.string().uuid().describe("ID da transação, como retornado por list_transactions"),
					date: z.iso.date().optional().describe("Data AAAA-MM-DD"),
					amount: z.number().positive().optional().describe("Valor positivo em reais"),
					category: z.string().trim().min(1).max(64).optional(),
					note: z.string().trim().max(280).nullable().optional(),
				})
				.refine(
					({ id: _id, ...rest }) => Object.values(rest).some((v) => v !== undefined),
					{ message: "Informe ao menos um campo para editar." },
				),
			annotations: write,
		},
		({ id, ...patch }) =>
			call("PATCH", `/api/finance/transactions/manual/${q(id)}`, patch),
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
				"Oculta gastos bancários do dashboard (por exemplo duplicados). Só gastos podem ser ocultados. Destrutivo: confirme com a pessoa antes de chamar.",
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
				targetDate: z.iso.date().nullable().optional().describe("Prazo AAAA-MM-DD"),
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
				targetDate: z.iso.date().nullable().optional().describe("Prazo AAAA-MM-DD; null remove o prazo"),
			}),
			annotations: write,
		},
		({ id, ...patch }) => call("PATCH", `/api/finance/goals/${q(id)}`, patch),
	);

	server.registerTool(
		"set_budget_income",
		{
			title: "Gravar renda orçada",
			description:
				"Grava a renda orçada do mês. Se o mês já tem renda, substitui o valor.",
			inputSchema: z.object({
				month,
				income: z.number().positive().describe("Valor positivo em reais"),
			}),
			annotations: write,
		},
		(input) => call("POST", "/api/finance/budget", input),
	);

	server.registerTool(
		"set_spending_goal",
		{
			title: "Gravar teto de gasto",
			description:
				"Grava o teto de gasto do mês. Se o mês já tem teto, substitui o valor.",
			inputSchema: z.object({
				month,
				targetAmount: z.number().positive().describe("Valor positivo em reais"),
			}),
			annotations: write,
		},
		(input) => call("POST", "/api/finance/spending-goal", input),
	);

	server.registerTool(
		"set_savings_target",
		{
			title: "Gravar percentual de poupança",
			description:
				"Grava o percentual de poupança do mês (0 a 100). Se o mês já tem, substitui.",
			inputSchema: z.object({
				month,
				savingsPercentage: z.number().min(0).max(100),
			}),
			annotations: write,
		},
		(input) => call("POST", "/api/finance/savings-target", input),
	);

	server.registerTool(
		"delete_goal",
		{
			title: "Apagar meta",
			description:
				"Apaga uma meta financeira. Destrutivo: confirme com a pessoa antes de chamar.",
			inputSchema: z.object({
				id: z.string().describe("ID da meta, como retornado por list_goals"),
			}),
			annotations: { ...write, destructiveHint: true },
		},
		({ id }) => call("DELETE", `/api/finance/goals/${q(id)}`),
	);

	server.registerTool(
		"delete_manual_transactions",
		{
			title: "Apagar transações manuais",
			description:
				"Apaga transações criadas à mão (até 100). Lançamentos do banco são ignorados; a resposta traz a contagem apagada. Destrutivo: confirme com a pessoa antes de chamar.",
			inputSchema: z.object({ ids }),
			annotations: { ...write, destructiveHint: true },
		},
		(input) => call("DELETE", "/api/finance/expenses", input),
	);

	server.registerTool(
		"set_category_limit",
		{
			title: "Gravar limite por categoria",
			description:
				"Define o limite de gasto de uma categoria no mês. Se a categoria já tem limite nesse mês (maiúsculas e acentos não importam), substitui o valor.",
			inputSchema: z.object({
				month,
				category: z.string().trim().min(1).max(64),
				targetAmount: z.number().positive().describe("Valor positivo em reais"),
			}),
			annotations: write,
		},
		(input) => call("POST", "/api/finance/category-limits", input),
	);

	server.registerTool(
		"delete_category_limit",
		{
			title: "Apagar limite por categoria",
			description:
				"Remove o limite de uma categoria no mês. Destrutivo: confirme com a pessoa antes de chamar.",
			inputSchema: z.object({
				month,
				category: z.string().trim().min(1).max(64),
			}),
			annotations: { ...write, destructiveHint: true },
		},
		(input) => call("DELETE", "/api/finance/category-limits", input),
	);

	server.registerTool(
		"copy_category_limits",
		{
			title: "Copiar limites para outro mês",
			description:
				"Copia os limites por categoria de um mês para outro. Limites que já existem no mês de destino são mantidos.",
			inputSchema: z.object({
				fromMonth: month.describe("Mês de origem AAAA-MM"),
				toMonth: month.describe("Mês de destino AAAA-MM"),
			}),
			annotations: write,
		},
		(input) => call("POST", "/api/finance/category-limits/copy", input),
	);

	server.registerTool(
		"add_goal_contribution",
		{
			title: "Registrar aporte em uma meta",
			description:
				"Registra um aporte (ou uma retirada) em uma meta e atualiza o valor atual dela. A data padrão é hoje. Não vira transação nem entra no gasto do mês. Uma retirada maior que o valor atual é recusada.",
			inputSchema: z.object({
				id: z.string().uuid().describe("ID da meta, como retornado por list_goals"),
				amount: z.number().positive().describe("Valor positivo em reais"),
				kind: z.enum(["deposit", "withdrawal"]).optional().describe("deposit = aporte (padrão), withdrawal = retirada"),
				date: z.iso.date().optional().describe("Data AAAA-MM-DD"),
				note: z.string().trim().max(280).optional(),
			}),
			annotations: write,
		},
		({ id, ...body }) => call("POST", `/api/finance/goals/${q(id)}/contributions`, body),
	);

	server.registerTool(
		"delete_goal_contribution",
		{
			title: "Apagar aporte de uma meta",
			description:
				"Apaga um aporte ou retirada e desfaz o efeito no valor atual da meta. Use o id que list_goal_contributions devolveu. Destrutivo: confirme com a pessoa antes de chamar.",
			inputSchema: z.object({
				id: z.string().uuid().describe("ID da meta"),
				contributionId: z.string().uuid().describe("ID do aporte, como retornado por list_goal_contributions"),
			}),
			annotations: { ...write, destructiveHint: true },
		},
		({ id, contributionId }) =>
			call("DELETE", `/api/finance/goals/${q(id)}/contributions/${q(contributionId)}`),
	);

	server.registerTool(
		"mark_bill_paid",
		{
			title: "Marcar fatura como paga",
			description:
				"Registra que uma fatura de cartão foi paga, para a tela e a projeção pararem de contá-la como pendente. Sem valor, marca a fatura inteira. Use o pluggyBillId que get_monthly_bills devolve. Quando o banco informar o pagamento, o valor do banco passa a valer.",
			inputSchema: z.object({
				pluggyBillId: z
					.string()
					.min(1)
					.describe("pluggyBillId da fatura, como retornado por get_monthly_bills"),
				paidAmount: z
					.number()
					.positive()
					.optional()
					.describe("Valor pago em reais; omita para marcar a fatura toda"),
			}),
			annotations: write,
		},
		({ pluggyBillId, paidAmount }) =>
			call(
				"POST",
				`/api/finance/bills/${q(pluggyBillId)}/paid`,
				paidAmount === undefined ? {} : { paidAmount },
			),
	);

	server.registerTool(
		"unmark_bill_paid",
		{
			title: "Desfazer fatura paga",
			description:
				"Remove a marcação manual de pagamento de uma fatura. O valor pago volta a ser o que o banco informou. Destrutivo: confirme com a pessoa antes de chamar.",
			inputSchema: z.object({
				pluggyBillId: z
					.string()
					.min(1)
					.describe("pluggyBillId da fatura, como retornado por get_monthly_bills"),
			}),
			annotations: { ...write, destructiveHint: true },
		},
		({ pluggyBillId }) =>
			call("DELETE", `/api/finance/bills/${q(pluggyBillId)}/paid`),
	);

	return server;
}
