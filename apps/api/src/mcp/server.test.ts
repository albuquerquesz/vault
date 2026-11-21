import { describe, expect, test } from "bun:test";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { createVaultMcpServer } from "./server.js";

type Call = { method: string; path: string; body?: unknown };

function setup(readOnly: boolean) {
	const calls: Call[] = [];
	const handler = createMcpHandler(
		() =>
			createVaultMcpServer(
				async (method, path, body) => {
					calls.push({ method, path, body });
					return new Response(JSON.stringify({ ok: true }), { status: 200 });
				},
				{ readOnly },
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
		])
			expect(by[n]).toBe(true);
		for (const n of [
			"create_goal",
			"update_goal",
			"set_budget_income",
			"recategorize_transactions",
			"mark_bill_paid",
			"update_manual_transaction",
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
		]);
		expect(calls[6]?.body).toEqual({ ids: [id] });
		expect(calls[7]?.body).toEqual({});
		expect(calls[8]?.body).toEqual({ paidAmount: 120.5 });
		expect(calls[11]?.body).toEqual({ amount: 99.9, note: null });
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
		];
		for (const b of bad) {
			const r = await rpc("tools/call", b);
			expect(r.error ?? r.result?.isError).toBeTruthy();
		}
		expect(calls).toHaveLength(0);
	});
});
