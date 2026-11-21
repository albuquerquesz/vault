import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.js";
import {
	goalContribution,
	pluggyAccounts,
	pluggyBills,
	pluggyItems,
	pluggyTransactions,
} from "../src/db/schema/index.js";
import { materializeMonthlyBillsFromPluggy } from "../src/services/pluggy.js";
import { api, resetDatabase, TEST_USER_ID } from "./helpers.js";

beforeEach(resetDatabase);

const manual = (
	kind: "expense" | "income",
	date: string,
	amount: number,
	category: string,
	note?: string,
) => api("POST", "/transactions/manual", { kind, date, amount, category, note });

describe("limites por categoria", () => {
	test("gravar de novo, sem acento nem caixa, substitui o valor", async () => {
		await api("POST", "/category-limits", { month: "2026-12", category: "Alimentação", targetAmount: 500 });
		const second = await api("POST", "/category-limits", { month: "2026-12", category: "alimentacao", targetAmount: 800 });
		expect(second.status).toBe(200);

		const { json } = await api("GET", "/category-limits?month=2026-12");
		expect(json.limits).toHaveLength(1);
		expect(json.limits[0].targetAmount).toBe(800);
	});

	test("o gasto vem do mesmo ledger e o resto é calculado", async () => {
		await api("POST", "/category-limits", { month: "2026-12", category: "Alimentação", targetAmount: 800 });
		await manual("expense", "2026-12-05", 120, "Alimentação");

		const { json } = await api("GET", "/category-limits?month=2026-12");
		expect(json.limits[0]).toMatchObject({ spent: 120, remaining: 680, isOver: false });
	});

	test("copiar não sobrescreve e apagar ignora acento e caixa", async () => {
		await api("POST", "/category-limits", { month: "2026-12", category: "Alimentação", targetAmount: 500 });

		const first = await api("POST", "/category-limits/copy", { fromMonth: "2026-12", toMonth: "2027-01" });
		expect(first.json).toEqual({ copied: 1, skipped: 0 });
		const again = await api("POST", "/category-limits/copy", { fromMonth: "2026-12", toMonth: "2027-01" });
		expect(again.json).toEqual({ copied: 0, skipped: 1 });

		const removed = await api("DELETE", "/category-limits", { month: "2027-01", category: "ALIMENTAÇÃO" });
		expect(removed.json.deleted).toBe(1);
		const missing = await api("DELETE", "/category-limits", { month: "2027-01", category: "Alimentação" });
		expect(missing.status).toBe(404);
	});

	test("mês inválido e valor zero são recusados", async () => {
		expect((await api("POST", "/category-limits", { month: "2026-13", category: "x", targetAmount: 10 })).status).toBe(400);
		expect((await api("POST", "/category-limits", { month: "2026-12", category: "x", targetAmount: 0 })).status).toBe(400);
	});
});

describe("metas, aportes e plano", () => {
	const createGoal = async () => {
		const { json } = await api("POST", "/goals", { name: "Viagem", targetAmount: 1000, targetDate: "2027-03-31" });
		return json.id as string;
	};

	test("aporte e retirada movem o valor atual na mesma transação", async () => {
		const id = await createGoal();

		const deposit = await api("POST", `/goals/${id}/contributions`, { amount: 100 });
		expect(deposit.status).toBe(201);
		expect(deposit.json.goal.currentAmount).toBe(100);

		const withdrawal = await api("POST", `/goals/${id}/contributions`, { amount: 30, kind: "withdrawal" });
		expect(withdrawal.json.goal.currentAmount).toBe(70);

		const tooMuch = await api("POST", `/goals/${id}/contributions`, { amount: 500, kind: "withdrawal" });
		expect(tooMuch.status).toBe(400);
		expect((await api("GET", `/goals/${id}/contributions`)).json).toHaveLength(2);
	});

	test("apagar um aporte desfaz o efeito e a meta é apagada com os aportes", async () => {
		const id = await createGoal();
		const deposit = await api("POST", `/goals/${id}/contributions`, { amount: 100 });

		const undone = await api("DELETE", `/goals/${id}/contributions/${deposit.json.contribution.id}`);
		expect(undone.json.goal.currentAmount).toBe(0);

		await api("POST", `/goals/${id}/contributions`, { amount: 40 });
		await api("DELETE", `/goals/${id}`);
		expect(await db.select().from(goalContribution).where(eq(goalContribution.goalId, id))).toHaveLength(0);
	});

	test("alcançar o alvo completa a meta", async () => {
		const id = await createGoal();
		const done = await api("POST", `/goals/${id}/contributions`, { amount: 1000 });
		expect(done.json.goal.isCompleted).toBe(true);
	});

	test("o plano usa o prazo e meta inexistente é 404", async () => {
		const id = await createGoal();
		const plan = await api("GET", `/goals/${id}/plan`);
		expect(plan.status).toBe(200);
		expect(plan.json.monthsLeft).toBeGreaterThan(0);
		expect(plan.json.perMonth).toBeGreaterThan(0);

		expect((await api("GET", "/goals/11111111-1111-4111-8111-111111111111/plan")).status).toBe(404);
	});
});

describe("busca e edição de transações", () => {
	const dec = "from=2026-12-01&to=2026-12-31";

	beforeEach(async () => {
		await manual("expense", "2026-12-10", 42.5, "Alimentação", "PADARIA SÃO JOÃO");
		await manual("expense", "2026-12-11", 300, "Transporte", "UBER");
		await manual("expense", "2026-12-12", 15, "Lazer", "Cinema");
		await manual("income", "2026-12-13", 2000, "Salário", "Salário");
	});

	test("texto sem acento, tipo e faixa de valor inclusiva", async () => {
		expect((await api("GET", `/transactions/search?q=sao%20joao&${dec}`)).json.total).toBe(1);
		expect((await api("GET", `/transactions/search?kind=income&${dec}`)).json.total).toBe(1);
		const range = await api("GET", `/transactions/search?minAmount=42.5&maxAmount=300&${dec}`);
		expect(range.json.total).toBe(2);
	});

	test("a paginação percorre tudo sem repetir nem pular", async () => {
		const ids: string[] = [];
		let cursor: string | null = null;
		do {
			const page: any = await api("GET", `/transactions/search?${dec}&limit=3${cursor ? `&cursor=${cursor}` : ""}`);
			ids.push(...page.json.transactions.map((tx: { id: string }) => tx.id));
			cursor = page.json.nextCursor;
		} while (cursor);
		expect(ids).toHaveLength(4);
		expect(new Set(ids).size).toBe(4);
	});

	test("período grande demais, datas invertidas e limite alto são recusados", async () => {
		expect((await api("GET", "/transactions/search?from=2020-01-01&to=2026-12-31")).status).toBe(400);
		expect((await api("GET", "/transactions/search?from=2026-12-31&to=2026-12-01")).status).toBe(400);
		expect((await api("GET", "/transactions/search?limit=500")).status).toBe(400);
	});

	test("editar uma transação manual", async () => {
		const found = await api("GET", `/transactions/search?q=cinema&${dec}`);
		const id = found.json.transactions[0].id;

		const edited = await api("PATCH", `/transactions/manual/${id}`, { amount: 22.9, note: null, category: "Lazer 2" });
		expect(edited.status).toBe(200);
		expect(Number(edited.json.amount)).toBe(22.9);
		expect(edited.json.note).toBeNull();
		expect(edited.json.category).toBe("Lazer 2");

		expect((await api("PATCH", `/transactions/manual/${id}`, {})).status).toBe(400);
		expect((await api("PATCH", "/transactions/manual/11111111-1111-4111-8111-111111111111", { amount: 1 })).status).toBe(404);
	});

	test("lançamento do banco não aceita edição de valor ou data", async () => {
		const [item] = await db.insert(pluggyItems).values({ userId: TEST_USER_ID, pluggyItemId: "pi-1", provider: "Teste" }).returning();
		const [account] = await db.insert(pluggyAccounts).values({ pluggyItemId: item!.id, pluggyAccountId: "pa-1", type: "BANK", name: "Conta" }).returning();
		const [bank] = await db.insert(pluggyTransactions).values({
			pluggyItemId: item!.id,
			pluggyAccountId: account!.id,
			pluggyTransactionId: "pt-1",
			date: "2026-12-14",
			amount: "80.00",
			description: "LOJA",
			category: "Shopping",
		}).returning();

		const result = await api("PATCH", `/transactions/manual/${bank!.id}`, { amount: 1 });
		expect(result.status).toBe(400);
		expect(result.json.code).toBe("BANK_TRANSACTION_READ_ONLY");
	});
});

describe("fatura paga à mão", () => {
	async function seedBill() {
		const [item] = await db.insert(pluggyItems).values({ userId: TEST_USER_ID, pluggyItemId: "pi-1", provider: "Teste" }).returning();
		const [account] = await db.insert(pluggyAccounts).values({ pluggyItemId: item!.id, pluggyAccountId: "pa-1", type: "CREDIT", name: "Cartão Teste" }).returning();
		await db.insert(pluggyTransactions).values({
			pluggyItemId: item!.id,
			pluggyAccountId: account!.id,
			pluggyTransactionId: "pt-1",
			date: "2026-12-14",
			amount: "80.00",
			description: "LOJA",
			category: "Shopping",
			pluggyBillId: "bill-1",
		});
		// The bank says R$ 30 of a bill that shows as R$ 80 (its linked transactions).
		await db.insert(pluggyBills).values({
			pluggyAccountId: account!.id,
			pluggyBillId: "bill-1",
			dueDate: new Date("2026-12-20T12:00:00Z"),
			totalAmount: "500.00",
			paidAmount: "30.00",
			currency: "BRL",
		});
		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });
	}

	const billItem = async () =>
		(await api("GET", "/monthly-bills?month=2026-12")).json.items.find(
			(item: { pluggyBillId: string }) => item.pluggyBillId === "bill-1",
		);

	test("o banco vale até o ajuste manual passar dele", async () => {
		await seedBill();
		expect(await billItem()).toMatchObject({ paidAmount: 30, paidSource: "bank" });

		await api("POST", "/bills/bill-1/paid", {});
		const whole = await billItem();
		expect(whole.paidAmount).toBe(whole.totalAmount);
		expect(whole.paidSource).toBe("manual");

		await api("POST", "/bills/bill-1/paid", { paidAmount: 20 });
		expect(await billItem()).toMatchObject({ paidAmount: 30, paidSource: "bank" });

		await api("POST", "/bills/bill-1/paid", { paidAmount: 250 });
		expect(await billItem()).toMatchObject({ paidAmount: 250, paidSource: "manual" });
	});

	test("desmarcar volta ao valor do banco e fatura inexistente é 404", async () => {
		await seedBill();
		await api("POST", "/bills/bill-1/paid", { paidAmount: 250 });

		const cleared = await api("DELETE", "/bills/bill-1/paid");
		expect(cleared.json.cleared).toBe(true);
		expect(await billItem()).toMatchObject({ paidAmount: 30, paidSource: "bank" });

		expect((await api("POST", "/bills/nao-existe/paid", {})).status).toBe(404);
	});
});
