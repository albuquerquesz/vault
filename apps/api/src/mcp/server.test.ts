import { describe, expect, test } from "bun:test";
import { createMcpHandler } from "@modelcontextprotocol/server";
import {
	ALL_MCP_SCOPES,
	type McpScope,
	READ_ONLY_SCOPES,
} from "./scopes.js";
import { createVaultMcpServer } from "./server.js";

type Call = { method: string; path: string; body?: unknown };

function setup(readOnlyOrScopes: boolean | ReadonlySet<McpScope>) {
	const scopes =
		readOnlyOrScopes === true
			? READ_ONLY_SCOPES
			: readOnlyOrScopes === false
				? ALL_MCP_SCOPES
				: readOnlyOrScopes;
	const calls: Call[] = [];
	const handler = createMcpHandler(
		() =>
			createVaultMcpServer(
				async (method, path, body) => {
					calls.push({ method, path, body });
					return new Response(JSON.stringify({ ok: true }), { status: 200 });
				},
				{ scopes },
			),
		{ legacy: "stateless" },
	);
	const rpc = async (method: string, params: unknown = {}) => {
		const res = await handler.fetch(
			new Request("http://localhost/api/mcp", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					accept: "application/json, text/event-stream",
				},
				body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
			}),
		);
		const text = await res.text();
		const data = text.split("\n").find((l) => l.startsWith("data:"));
		return JSON.parse(data ? data.slice(5) : text);
	};
	return { calls, rpc };
}

const newWrites = [
	"set_budget_income",
	"set_spending_goal",
	"set_savings_target",
	"delete_goal",
	"delete_manual_transactions",
	"mark_bill_paid",
	"unmark_bill_paid",
	"update_manual_transaction",
	"set_category_limit",
	"delete_category_limit",
	"copy_category_limits",
	"add_goal_contribution",
	"delete_goal_contribution",
	"create_recurring_item",
	"update_recurring_item",
	"delete_recurring_item",
	"mark_recurring_paid",
	"unmark_recurring_paid",
];

describe("MCP remoto: paridade", () => {
	test("OAuth lista leituras e escritas novas, sem Pix/espaço/carteira", async () => {
		const { rpc } = setup(false);
		const { result } = await rpc("tools/list");
		const names = result.tools.map((t: { name: string }) => t.name);
		for (const n of [
			...newWrites,
			"get_spending_goal",
			"get_savings_target",
			"search_transactions",
			"get_category_limits",
			"get_goal_plan",
			"list_goal_contributions",
			"list_recurring_items",
			"list_credit_cards",
			"list_installments",
			"get_chart",
		])
			expect(names).toContain(n);
		expect(names.join(" ")).not.toMatch(/pix|space|wallet/i);
	});

	test("bearer só lê: sem escrita nova, com leituras novas", async () => {
		const { rpc } = setup(true);
		const { result } = await rpc("tools/list");
		const names = result.tools.map((t: { name: string }) => t.name);
		for (const n of newWrites) expect(names).not.toContain(n);
		expect(names).toContain("get_spending_goal");
		expect(names).toContain("get_savings_target");
		expect(names).toContain("search_transactions");
		expect(names).toContain("get_category_limits");
		expect(names).toContain("get_goal_plan");
		expect(names).toContain("list_goal_contributions");
		expect(names).toContain("list_recurring_items");
		expect(names).toContain("list_credit_cards");
		expect(names).toContain("list_installments");
		expect(names).toContain("get_chart");
		const call = await rpc("tools/call", {
			name: "delete_goal",
			arguments: { id: "x" },
		});
		expect(call.error ?? call.result?.isError).toBeTruthy();
	});

	test("destrutivas anunciam destructiveHint", async () => {
		const { rpc } = setup(false);
		const { result } = await rpc("tools/list");
		const by = Object.fromEntries(
			result.tools.map((t: { name: string; annotations: { destructiveHint: boolean } }) => [t.name, t.annotations.destructiveHint]),
		);
		for (const n of [
			"delete_goal",
			"delete_manual_transactions",
			"hide_transactions",
			"unmark_bill_paid",
			"delete_category_limit",
			"delete_goal_contribution",
			"delete_recurring_item",
			"unmark_recurring_paid",
		])
			expect(by[n]).toBe(true);
		for (const n of [
			"create_goal",
			"update_goal",
			"set_budget_income",
			"recategorize_transactions",
			"mark_bill_paid",
			"update_manual_transaction",
			"set_category_limit",
			"copy_category_limits",
			"add_goal_contribution",
			"create_recurring_item",
			"update_recurring_item",
			"mark_recurring_paid",
		])
			expect(by[n]).toBe(false);
	});

	test("tools chamam as rotas certas", async () => {
		const { rpc, calls } = setup(false);
		const id = "11111111-1111-4111-8111-111111111111";
		await rpc("tools/call", { name: "get_spending_goal", arguments: { month: "2026-10", today: "2026-10-15" } });
		await rpc("tools/call", { name: "get_savings_target", arguments: { month: "2026-10" } });
		await rpc("tools/call", { name: "set_budget_income", arguments: { month: "2026-10", income: 5000 } });
		await rpc("tools/call", { name: "set_spending_goal", arguments: { month: "2026-10", targetAmount: 3000 } });
		await rpc("tools/call", { name: "set_savings_target", arguments: { month: "2026-10", savingsPercentage: 20 } });
		await rpc("tools/call", { name: "delete_goal", arguments: { id: "g1" } });
		await rpc("tools/call", { name: "delete_manual_transactions", arguments: { ids: [id] } });
		await rpc("tools/call", { name: "mark_bill_paid", arguments: { pluggyBillId: "bill-1" } });
		await rpc("tools/call", { name: "mark_bill_paid", arguments: { pluggyBillId: "bill-2", paidAmount: 120.5 } });
		await rpc("tools/call", { name: "unmark_bill_paid", arguments: { pluggyBillId: "bill-1" } });
		await rpc("tools/call", { name: "search_transactions", arguments: { q: "padaria", minAmount: 10 } });
		await rpc("tools/call", { name: "update_manual_transaction", arguments: { id, amount: 99.9, note: null } });
		await rpc("tools/call", { name: "get_category_limits", arguments: { month: "2026-10" } });
		await rpc("tools/call", { name: "set_category_limit", arguments: { month: "2026-10", category: "Alimentação", targetAmount: 800 } });
		await rpc("tools/call", { name: "delete_category_limit", arguments: { month: "2026-10", category: "Lazer" } });
		await rpc("tools/call", { name: "copy_category_limits", arguments: { fromMonth: "2026-09", toMonth: "2026-10" } });
		await rpc("tools/call", { name: "get_goal_plan", arguments: { id } });
		await rpc("tools/call", { name: "list_goal_contributions", arguments: { id } });
		await rpc("tools/call", { name: "add_goal_contribution", arguments: { id, amount: 150, date: "2026-11-20", note: "13o" } });
		await rpc("tools/call", { name: "delete_goal_contribution", arguments: { id, contributionId: id } });
		await rpc("tools/call", { name: "create_goal", arguments: { name: "Viagem", targetAmount: 5000, targetDate: "2027-06-30" } });
		await rpc("tools/call", { name: "list_recurring_items", arguments: {} });
		await rpc("tools/call", { name: "list_recurring_items", arguments: { month: "2026-12", all: true } });
		await rpc("tools/call", { name: "create_recurring_item", arguments: { kind: "bill", name: "Aluguel", amount: 1500, dayOfMonth: 5, category: "Moradia" } });
		await rpc("tools/call", { name: "update_recurring_item", arguments: { id, amount: 1600, effectiveFrom: "2027-01" } });
		await rpc("tools/call", { name: "mark_recurring_paid", arguments: { id, month: "2026-12" } });
		await rpc("tools/call", { name: "unmark_recurring_paid", arguments: { id, month: "2026-12" } });
		await rpc("tools/call", { name: "delete_recurring_item", arguments: { id } });
		await rpc("tools/call", { name: "list_credit_cards", arguments: {} });
		await rpc("tools/call", { name: "list_installments", arguments: {} });
		await rpc("tools/call", { name: "list_installments", arguments: { months: 12 } });
		await rpc("tools/call", { name: "get_chart", arguments: { metric: "spending_by_category", month: "2026-11", type: "bar" } });
		await rpc("tools/call", { name: "get_chart", arguments: { metric: "monthly_result" } });
		expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
			"GET /api/finance/spending-goal?month=2026-10&today=2026-10-15",
			"GET /api/finance/savings-target?month=2026-10",
			"POST /api/finance/budget",
			"POST /api/finance/spending-goal",
			"POST /api/finance/savings-target",
			"DELETE /api/finance/goals/g1",
			"DELETE /api/finance/expenses",
			"POST /api/finance/bills/bill-1/paid",
			"POST /api/finance/bills/bill-2/paid",
			"DELETE /api/finance/bills/bill-1/paid",
			"GET /api/finance/transactions/search?q=padaria&minAmount=10",
			`PATCH /api/finance/transactions/manual/${id}`,
			"GET /api/finance/category-limits?month=2026-10",
			"POST /api/finance/category-limits",
			"DELETE /api/finance/category-limits",
			"POST /api/finance/category-limits/copy",
			`GET /api/finance/goals/${id}/plan`,
			`GET /api/finance/goals/${id}/contributions`,
			`POST /api/finance/goals/${id}/contributions`,
			`DELETE /api/finance/goals/${id}/contributions/${id}`,
			"POST /api/finance/goals",
			"GET /api/finance/recurring",
			"GET /api/finance/recurring?month=2026-12&all=true",
			"POST /api/finance/recurring",
			`PATCH /api/finance/recurring/${id}`,
			`POST /api/finance/recurring/${id}/paid`,
			`DELETE /api/finance/recurring/${id}/paid`,
			`DELETE /api/finance/recurring/${id}`,
			"GET /api/finance/credit-cards",
			"GET /api/finance/installments",
			"GET /api/finance/installments?months=12",
			"GET /api/finance/chart?metric=spending_by_category&month=2026-11&type=bar",
			"GET /api/finance/chart?metric=monthly_result",
		]);
		expect(calls[6]?.body).toEqual({ ids: [id] });
		expect(calls[7]?.body).toEqual({});
		expect(calls[8]?.body).toEqual({ paidAmount: 120.5 });
		expect(calls[11]?.body).toEqual({ amount: 99.9, note: null });
		expect(calls[13]?.body).toEqual({ month: "2026-10", category: "Alimentação", targetAmount: 800 });
		expect(calls[14]?.body).toEqual({ month: "2026-10", category: "Lazer" });
		expect(calls[15]?.body).toEqual({ fromMonth: "2026-09", toMonth: "2026-10" });
		expect(calls[18]?.body).toEqual({ amount: 150, date: "2026-11-20", note: "13o" });
		expect(calls[20]?.body).toEqual({ name: "Viagem", targetAmount: 5000, targetDate: "2027-06-30" });
		expect(calls[23]?.body).toEqual({ kind: "bill", name: "Aluguel", amount: 1500, dayOfMonth: 5, category: "Moradia" });
		expect(calls[24]?.body).toEqual({ amount: 1600, effectiveFrom: "2027-01" });
		expect(calls[25]?.body).toEqual({ month: "2026-12" });
		expect(calls[26]?.body).toEqual({ month: "2026-12" });
	});

	test("validação recusa valor <= 0, mês inválido e 101 ids", async () => {
		const { rpc, calls } = setup(false);
		const bad = [
			{ name: "set_budget_income", arguments: { month: "2026-10", income: 0 } },
			{ name: "set_spending_goal", arguments: { month: "2026-10", targetAmount: -1 } },
			{ name: "set_savings_target", arguments: { month: "2026-13", savingsPercentage: 10 } },
			{ name: "delete_manual_transactions", arguments: { ids: Array(101).fill("11111111-1111-4111-8111-111111111111") } },
			{ name: "mark_bill_paid", arguments: { pluggyBillId: "bill-1", paidAmount: 0 } },
			{ name: "mark_bill_paid", arguments: { pluggyBillId: "" } },
			{ name: "update_manual_transaction", arguments: { id: "11111111-1111-4111-8111-111111111111" } },
			{ name: "search_transactions", arguments: { limit: 500 } },
			{ name: "set_category_limit", arguments: { month: "2026-10", category: "Lazer", targetAmount: 0 } },
			{ name: "set_category_limit", arguments: { month: "2026-13", category: "Lazer", targetAmount: 10 } },
			{ name: "copy_category_limits", arguments: { fromMonth: "2026-09", toMonth: "setembro" } },
			{ name: "add_goal_contribution", arguments: { id: "11111111-1111-4111-8111-111111111111", amount: 0 } },
			{ name: "add_goal_contribution", arguments: { id: "nao-e-uuid", amount: 10 } },
			{ name: "add_goal_contribution", arguments: { id: "11111111-1111-4111-8111-111111111111", amount: 10, kind: "transfer" } },
			{ name: "create_recurring_item", arguments: { kind: "bill", name: "X", amount: 10, dayOfMonth: 32, category: "Y" } },
			{ name: "create_recurring_item", arguments: { kind: "loan", name: "X", amount: 10, dayOfMonth: 5, category: "Y" } },
			{ name: "create_recurring_item", arguments: { kind: "bill", name: "X", amount: 0, dayOfMonth: 5, category: "Y" } },
			{ name: "update_recurring_item", arguments: { id: "11111111-1111-4111-8111-111111111111" } },
			{ name: "mark_recurring_paid", arguments: { id: "11111111-1111-4111-8111-111111111111", month: "dezembro" } },
			{ name: "list_installments", arguments: { months: 13 } },
			{ name: "list_installments", arguments: { months: 0 } },
			{ name: "get_chart", arguments: { metric: "pie_of_everything" } },
			{ name: "get_chart", arguments: { metric: "monthly_result", months: 13 } },
			{ name: "get_chart", arguments: { metric: "spending_by_day", month: "novembro" } },
		];
		for (const b of bad) {
			const r = await rpc("tools/call", b);
			expect(r.error ?? r.result?.isError).toBeTruthy();
		}
		expect(calls).toHaveLength(0);
	});
});

describe("MCP remoto: escopos OAuth", () => {
	const writeToolsOf = async (scopes: ReadonlySet<McpScope>) => {
		const { rpc } = setup(scopes);
		const { result } = await rpc("tools/list");
		return result.tools
			.filter((t: { annotations: { readOnlyHint: boolean } }) => !t.annotations.readOnlyHint)
			.map((t: { name: string }) => t.name)
			.sort();
	};

	test("mcp:read lista só leitura", async () => {
		expect(await writeToolsOf(new Set(["mcp:read"]))).toEqual([]);
	});

	test("cada escopo de escrita lista só as suas tools", async () => {
		expect(await writeToolsOf(new Set(["mcp:read", "mcp:goals:write"]))).toEqual([
			"add_goal_contribution",
			"create_goal",
			"delete_goal",
			"delete_goal_contribution",
			"update_goal",
		]);
		expect(await writeToolsOf(new Set(["mcp:read", "mcp:bills:write"]))).toEqual([
			"create_recurring_item",
			"delete_recurring_item",
			"mark_bill_paid",
			"mark_recurring_paid",
			"unmark_bill_paid",
			"unmark_recurring_paid",
			"update_recurring_item",
		]);
		expect(await writeToolsOf(new Set(["mcp:read", "mcp:categories:write"]))).toEqual([
			"recategorize_transactions",
		]);
		expect(await writeToolsOf(new Set(["mcp:read", "mcp:budgets:write"]))).toEqual([
			"copy_category_limits",
			"delete_category_limit",
			"set_budget_income",
			"set_category_limit",
			"set_savings_target",
			"set_spending_goal",
		]);
		expect(await writeToolsOf(new Set(["mcp:read", "mcp:transactions:write"]))).toEqual([
			"create_manual_transaction",
			"delete_manual_transactions",
			"hide_transactions",
			"update_manual_transaction",
		]);
	});

	test("vários escopos listam a união", async () => {
		const names = await writeToolsOf(
			new Set(["mcp:read", "mcp:goals:write", "mcp:bills:write"]),
		);
		expect(names).toContain("create_goal");
		expect(names).toContain("mark_bill_paid");
		expect(names).not.toContain("set_budget_income");
	});

	test("todos os escopos listam todas as escritas", async () => {
		const names = await writeToolsOf(ALL_MCP_SCOPES);
		expect(names).toHaveLength(23);
	});

	test("tool fora do escopo não existe para o cliente", async () => {
		const { rpc, calls } = setup(new Set(["mcp:read", "mcp:goals:write"]));
		const call = await rpc("tools/call", {
			name: "set_budget_income",
			arguments: { month: "2026-10", income: 100 },
		});
		expect(call.error ?? call.result?.isError).toBeTruthy();
		expect(calls).toHaveLength(0);
	});
});
