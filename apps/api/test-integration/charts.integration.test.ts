import { beforeEach, describe, expect, test } from "bun:test";
import { db } from "../src/db/index.js";
import { pluggyAccounts, pluggyItems, pluggyTransactions } from "../src/db/schema/index.js";
import { addMonthsClamped, dateOnly } from "../src/services/credit-cards.js";
import { todayInSaoPaulo } from "../src/services/subscriptions.js";
import { api, resetDatabase, TEST_USER_ID } from "./helpers.js";

beforeEach(resetDatabase);

const manual = (kind: "expense" | "income", date: string, amount: number, category: string) =>
	api("POST", "/transactions/manual", { kind, date, amount, category });

const chart = (query: string) => api("GET", `/chart?${query}`);

describe("GET /chart: spending_by_category", () => {
	test("soma as despesas por categoria, ignora receita e entrega dados, Vega-Lite e SVG", async () => {
		await manual("expense", "2026-01-05", 300, "Mercado");
		await manual("expense", "2026-01-12", 100, "Mercado");
		await manual("expense", "2026-01-13", 250, "Lazer");
		await manual("income", "2026-01-14", 5000, "Salário");

		const { status, json } = await chart("metric=spending_by_category&month=2026-01");
		expect(status).toBe(200);
		expect(json).toMatchObject({ metric: "spending_by_category", type: "donut", total: 650 });
		expect(json.title).toBe("Gastos por categoria em jan/2026");
		expect(json.data).toEqual([
			{ label: "Mercado", value: 400 },
			{ label: "Lazer", value: 250 },
		]);
		expect(json.vegaLite.mark.type).toBe("arc");
		expect(json.svg).toContain("<svg");
		expect(json.svg).toContain("Mercado");
	});

	test("com muitas categorias, as menores viram Outras", async () => {
		for (let i = 1; i <= 10; i += 1) await manual("expense", "2026-01-10", i * 10, `Cat ${i}`);

		const { json } = await chart("metric=spending_by_category&month=2026-01&type=bar");
		expect(json.type).toBe("bar");
		expect(json.data).toHaveLength(8);
		// Seven stay; the three smallest (10, 20 and 30) become one.
		expect(json.data.at(-1)).toEqual({ label: "Outras", value: 10 + 20 + 30 });
		expect(json.total).toBe(550);
	});

	test("um mês sem gasto devolve o gráfico vazio, sem erro", async () => {
		const { status, json } = await chart("metric=spending_by_category&month=2026-01");
		expect(status).toBe(200);
		expect(json.data).toEqual([]);
		expect(json.svg).toContain("Sem dados no período");
	});
});

describe("GET /chart: monthly_result e spending_by_day", () => {
	test("receita e gasto dos últimos meses, em duas séries, do mais antigo ao mais novo", async () => {
		await manual("income", "2026-01-10", 5000, "Salário");
		await manual("expense", "2026-01-20", 3000, "Casa");
		await manual("income", "2026-03-10", 6000, "Salário");
		await manual("expense", "2026-03-11", 100, "Casa");

		const { json } = await chart("metric=monthly_result&month=2026-03&months=3");
		expect(json).toMatchObject({ type: "bar", total: null });
		expect(json.title).toBe("Receita e gasto: últimos 3 meses até mar/2026");
		expect(json.data).toEqual([
			{ label: "jan/2026", series: "Receita", value: 5000 },
			{ label: "jan/2026", series: "Gasto", value: 3000 },
			{ label: "fev/2026", series: "Receita", value: 0 },
			{ label: "fev/2026", series: "Gasto", value: 0 },
			{ label: "mar/2026", series: "Receita", value: 6000 },
			{ label: "mar/2026", series: "Gasto", value: 100 },
		]);
		expect(json.vegaLite.encoding.color.field).toBe("series");
	});

	test("gasto por dia traz todos os dias do mês, com zero onde não houve gasto", async () => {
		await manual("expense", "2026-01-02", 40, "Mercado");
		await manual("expense", "2026-01-02", 10, "Lazer");
		await manual("expense", "2026-01-31", 5, "Mercado");

		const { json } = await chart("metric=spending_by_day&month=2026-01");
		expect(json.type).toBe("line");
		expect(json.data).toHaveLength(31);
		expect(json.data[1]).toEqual({ label: "2", value: 50 });
		expect(json.data[30]).toEqual({ label: "31", value: 5 });
		expect(json.data[2]).toEqual({ label: "3", value: 0 });
		expect(json.svg).toContain("<polyline");
	});
});

describe("GET /chart: upcoming_installments", () => {
	test("soma as parcelas que ainda vão cair, mês a mês", async () => {
		const today = todayInSaoPaulo();
		const daysAgo = (days: number) => dateOnly(new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000)) as string;
		const [item] = await db.insert(pluggyItems).values({ userId: TEST_USER_ID, pluggyItemId: "pi-1", provider: "MeuPluggy" }).returning();
		const [card] = await db.insert(pluggyAccounts).values({ pluggyItemId: item!.id, pluggyAccountId: "pa", type: "CREDIT", name: "gold" }).returning();
		const tx = (n: number, date: string, amount: string) =>
			db.insert(pluggyTransactions).values({
				pluggyItemId: item!.id,
				pluggyAccountId: card!.id,
				pluggyTransactionId: `t${n}`,
				date,
				amount,
				description: `Loja ${n}/3`,
				category: "Shopping",
			});
		await tx(1, daysAgo(40), "50.00");
		await tx(2, daysAgo(9), "50.00");

		const { json } = await chart("metric=upcoming_installments&months=3");
		expect(json.type).toBe("bar");
		expect(json.data).toHaveLength(1);
		expect(json.data[0]).toEqual({ label: expect.any(String), value: 50 });
		expect(json.total).toBe(50);
		expect(addMonthsClamped(daysAgo(9), 1).slice(0, 7)).toBeTruthy();
	});
});

describe("GET /chart: validação", () => {
	test("métrica desconhecida, tipo que não vale, meses fora do intervalo e mês inválido", async () => {
		expect((await chart("metric=tudo")).status).toBe(400);
		expect((await chart("")).status).toBe(400);
		const wrongType = await chart("metric=spending_by_category&month=2026-01&type=line");
		expect(wrongType.status).toBe(400);
		expect(wrongType.json.error).toContain("donut, bar");
		expect((await chart("metric=monthly_result&months=13")).status).toBe(400);
		expect((await chart("metric=spending_by_day&month=2026-13")).status).toBe(400);
	});
});
