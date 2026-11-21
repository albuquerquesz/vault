import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { PluggyApiError } from "../src/clients/pluggy/index.js";
import type { PluggyInvestment } from "../src/clients/pluggy/types.js";
import { db } from "../src/db/index.js";
import { expense, investmentSnapshots, pluggyInvestments, pluggyItems } from "../src/db/schema/index.js";
import { syncInvestmentsForItem } from "../src/services/investments.js";
import { createPluggyService, syncTransactionsForItem } from "../src/services/pluggy.js";
import { api, resetDatabase, TEST_USER_ID } from "./helpers.js";

beforeEach(resetDatabase);

const inv = (over: Partial<PluggyInvestment>): PluggyInvestment => ({
	id: "i1",
	name: "CDB Cofrinho",
	type: "FIXED_INCOME",
	subtype: "CDB",
	institution: "Nubank",
	balance: 1100,
	amountInvested: 1000,
	amountProfit: null,
	currency: "BRL",
	status: "ACTIVE",
	date: "2026-11-20T00:00:00.000Z",
	...over,
});

async function seedItem() {
	const [item] = await db
		.insert(pluggyItems)
		.values({ userId: TEST_USER_ID, pluggyItemId: "remote-item", provider: "MeuPluggy" })
		.returning();
	return item?.id as string;
}

const sync = (localItemId: string, list: () => Promise<PluggyInvestment[]>) =>
	syncInvestmentsForItem({
		service: { listInvestments: list },
		userId: TEST_USER_ID,
		localItemId,
		pluggyItemId: "remote-item",
	});

describe("syncInvestmentsForItem", () => {
	test("grava as posições, não duplica no sync repetido e remove as que sumiram", async () => {
		const itemId = await seedItem();
		const first = await sync(itemId, async () => [inv({ id: "a" }), inv({ id: "b", type: "EQUITY", balance: 500, amountInvested: 400 })]);
		expect(first).toMatchObject({ status: "success", synced: 2 });
		await sync(itemId, async () => [inv({ id: "a", balance: 1200 }), inv({ id: "b", type: "EQUITY", balance: 500, amountInvested: 400 })]);
		let rows = await db.select().from(pluggyInvestments);
		expect(rows).toHaveLength(2);
		expect(Number(rows.find((r) => r.pluggyInvestmentId === "a")?.balance)).toBe(1200);

		await sync(itemId, async () => [inv({ id: "a", balance: 1200 })]);
		rows = await db.select().from(pluggyInvestments);
		expect(rows.map((r) => r.pluggyInvestmentId)).toEqual(["a"]);
	});

	test("produto não habilitado (403): pulado, nada gravado, sem erro", async () => {
		const itemId = await seedItem();
		const result = await sync(itemId, async () => {
			throw new PluggyApiError("Forbidden", 403, "{}");
		});
		expect(result.status).toBe("skipped");
		expect(await db.select().from(pluggyInvestments)).toHaveLength(0);
		expect(await db.select().from(investmentSnapshots)).toHaveLength(0);
	});

	test("outro erro vira fase failed sem lançar; resposta vazia mantém o que existia", async () => {
		const itemId = await seedItem();
		await sync(itemId, async () => [inv({ id: "a" })]);
		const failed = await sync(itemId, async () => {
			throw new PluggyApiError("boom", 500, "{}");
		});
		expect(failed.status).toBe("failed");
		const empty = await sync(itemId, async () => []);
		expect(empty).toMatchObject({ status: "success", total: 0 });
		expect(await db.select().from(pluggyInvestments)).toHaveLength(1);
	});

	test("o instantâneo do mês é regravado, não duplicado", async () => {
		const itemId = await seedItem();
		await sync(itemId, async () => [inv({ id: "a", balance: 1000 })]);
		await sync(itemId, async () => [inv({ id: "a", balance: 1500 })]);
		const snaps = await db.select().from(investmentSnapshots).where(eq(investmentSnapshots.userId, TEST_USER_ID));
		expect(snaps).toHaveLength(1);
		expect(Number(snaps[0]?.totalBalance)).toBe(1500);
	});
});

describe("sync completo com INVESTMENTS indisponível", () => {
	test("contas e transações sincronizam normalmente e o resultado continua success", async () => {
		const itemId = await seedItem();
		const service = {
			listAccounts: async () => [{ id: "acc-1", itemId: "remote-item", type: "BANK", subtype: "CHECKING_ACCOUNT", name: "Conta", balance: 100 }],
			listBills: async () => [],
			getTransactionsByAccount: async () => ({
				transactions: [{ id: "t1", date: new Date().toISOString(), amount: -42.5, description: "Padaria", accountId: "acc-1" }],
			}),
			listInvestments: async () => {
				throw new PluggyApiError("Forbidden", 403, "{}");
			},
		} as unknown as ReturnType<typeof createPluggyService>;
		const result = await syncTransactionsForItem({
			service,
			userId: TEST_USER_ID,
			localItemId: itemId,
			pluggyItemId: "remote-item",
		});
		expect(result.status).toBe("success");
		expect(result.investments?.status).toBe("skipped");
		expect(result.transactions.status).toBe("success");
		expect(await db.select().from(expense).where(eq(expense.userId, TEST_USER_ID))).toHaveLength(1);
	});
});

describe("rotas", () => {
	test("sem investimentos: carteira vazia e histórico vazio", async () => {
		const { status, json } = await api("GET", "/investments");
		expect(status).toBe(200);
		expect(json).toMatchObject({ totalBalance: 0, byType: [], positions: [], returnPercent: null });
		const history = await api("GET", "/investments/history");
		expect(history.json).toEqual({ snapshots: [] });
	});

	test("com dados: total, tipos, rentabilidade, histórico e gráfico de alocação", async () => {
		const itemId = await seedItem();
		await sync(itemId, async () => [
			inv({ id: "a", balance: 1100, amountInvested: 1000 }),
			inv({ id: "b", type: "EQUITY", subtype: "STOCK", name: "PETR4", balance: 900, amountInvested: null }),
		]);
		const { json } = await api("GET", "/investments");
		expect(json.totalBalance).toBe(2000);
		expect(json.byType.map((t: { type: string; percent: number }) => [t.type, t.percent])).toEqual([
			["FIXED_INCOME", 55],
			["EQUITY", 45],
		]);
		expect(json.returnAmount).toBe(100);
		expect(json.returnPercent).toBe(10);
		expect(json.positions.find((p: { name: string }) => p.name === "PETR4").returnPercent).toBeNull();

		const history = await api("GET", "/investments/history");
		expect(history.json.snapshots).toHaveLength(1);
		expect(history.json.snapshots[0].totalBalance).toBe(2000);

		const chart = await api("GET", "/chart?metric=portfolio_allocation");
		expect(chart.status).toBe(200);
		expect(chart.json).toMatchObject({ metric: "portfolio_allocation", type: "donut", total: 2000 });
		expect(chart.json.data).toEqual([
			{ label: "Renda fixa", value: 1100 },
			{ label: "Ações e FIIs", value: 900 },
		]);
		expect(chart.json.svg).toContain("Renda fixa");
	});

	test("investimento não entra no gasto do mês", async () => {
		const itemId = await seedItem();
		await sync(itemId, async () => [inv({ id: "a" })]);
		const month = new Date().toISOString().slice(0, 7);
		const { json } = await api("GET", `/partial-result?month=${month}`);
		expect(json.spent ?? 0).toBe(0);
	});
});
