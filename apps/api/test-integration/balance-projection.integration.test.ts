import { beforeEach, describe, expect, test } from "bun:test";
import { db } from "../src/db/index.js";
import { pluggyAccounts, pluggyBills, pluggyItems } from "../src/db/schema/index.js";
import { addMonthsClamped } from "../src/services/credit-cards.js";
import { todayInSaoPaulo } from "../src/services/subscriptions.js";
import { api, resetDatabase, TEST_USER_ID } from "./helpers.js";

beforeEach(resetDatabase);

const today = () => todayInSaoPaulo();
const projection = (query = "") => api("GET", `/projection${query}`);

async function seedAccounts(bankBalance: string | null = "5000.00") {
	const [item] = await db
		.insert(pluggyItems)
		.values({ userId: TEST_USER_ID, pluggyItemId: "pi-1", provider: "MeuPluggy" })
		.returning();
	const [bank] = await db
		.insert(pluggyAccounts)
		.values({ pluggyItemId: item!.id, pluggyAccountId: "pa-bank", type: "BANK", name: "Conta", balance: bankBalance })
		.returning();
	const [card] = await db
		.insert(pluggyAccounts)
		.values({ pluggyItemId: item!.id, pluggyAccountId: "pa-card", type: "CREDIT", name: "gold", balance: "9999.00" })
		.returning();
	return { item: item!, bank: bank!, card: card! };
}

describe("GET /projection", () => {
	test("sem conta bancária devolve startBalance nulo, meses vazios e a premissa", async () => {
		const { status, json } = await projection();
		expect(status).toBe(200);
		expect(json).toMatchObject({ startBalance: null, months: [], isEstimate: true });
		expect(json.assumptions[0].code).toBe("NO_BANK_ACCOUNT");
	});

	test("horizonte fora de 1 a 12 devolve VALIDATION_ERROR", async () => {
		for (const months of ["0", "13", "x"]) {
			const { status, json } = await projection(`?months=${months}`);
			expect(status).toBe(400);
			expect(json.code).toBe("VALIDATION_ERROR");
		}
	});

	test("parte do saldo dos bancos (sem o cartão) e soma receita, conta fixa e fatura fechada", async () => {
		const { card } = await seedAccounts();
		await api("POST", "/recurring", { kind: "income", name: "Pró-labore", amount: 3000, dayOfMonth: 28, category: "Salário" });
		await api("POST", "/recurring", { kind: "bill", name: "Aluguel", amount: 1000, dayOfMonth: 15, category: "Moradia" });
		const due = addMonthsClamped(today(), 1);
		await db.insert(pluggyBills).values({
			pluggyAccountId: card.id,
			pluggyBillId: "bill-1",
			dueDate: new Date(`${due}T00:00:00Z`),
			totalAmount: "400.00",
			paidAmount: "100.00",
		});

		const { status, json } = await projection("?months=3");
		expect(status).toBe(200);
		expect(json.startBalance).toBe(5000);
		expect(json.months).toHaveLength(3);
		expect(json.months[0].month).toBe(today().slice(0, 7));

		const nextMonth = json.months[1];
		expect(nextMonth).toMatchObject({ income: 3000, fixedBills: 1000 });
		const closed = json.events.filter((event: { kind: string }) => event.kind === "closed_card_bill");
		expect(closed).toHaveLength(1);
		expect(closed[0]).toMatchObject({ amount: -300, certainty: "fact", date: due });
		const income = json.events.find((event: { kind: string }) => event.kind === "income");
		expect(income.certainty).toBe("registered");
		expect(json.months.reduce((sum: number, m: { closedCardBills: number }) => sum + m.closedCardBills, 0)).toBe(300);
		expect(json.assumptions.map((a: { code: string }) => a.code)).toContain("START_BALANCE");
	});

	test("a média de gasto variável vem dos meses fechados e o saldo negativo é avisado", async () => {
		await seedAccounts("1000.00");
		const current = today().slice(0, 7);
		for (const back of [1, 2, 3])
			await api("POST", "/transactions/manual", {
				kind: "expense",
				date: `${addMonthsClamped(`${current}-01`, -back).slice(0, 7)}-10`,
				amount: 2000,
				category: "Mercado",
			});

		const { json } = await projection("?months=3");
		expect(json.months[1].variable).toBe(2000);
		expect(json.months[1].endBalance).toBeLessThan(0);
		expect(json.firstNegativeMonth).toBeTruthy();
		expect(json.assumptions.map((a: { code: string }) => a.code)).toContain("NO_INCOME");
	});
});

describe("GET /chart: balance_projection", () => {
	test("desenha o saldo dia a dia do mês atual a partir de hoje, em linha", async () => {
		await seedAccounts();
		const month = today().slice(0, 7);
		const { status, json } = await api("GET", `/chart?metric=balance_projection&month=${month}`);
		expect(status).toBe(200);
		expect(json.type).toBe("line");
		expect(json.data[0]).toEqual({ label: String(Number(today().slice(8, 10))), value: 5000 });
		const lastDay = Number(new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate());
		expect(json.data.at(-1).label).toBe(String(lastDay));
		expect(json.total).toBeNull();
		expect(json.projection.isEstimate).toBe(true);
		expect(json.svg).toContain("<svg");
	});

	test("mês futuro dentro do horizonte funciona; passado e além de 11 meses dão erro", async () => {
		await seedAccounts();
		const next = addMonthsClamped(`${today().slice(0, 7)}-01`, 2).slice(0, 7);
		const ok = await api("GET", `/chart?metric=balance_projection&month=${next}`);
		expect(ok.status).toBe(200);
		expect(ok.json.data.length).toBeGreaterThan(27);
		for (const bad of [addMonthsClamped(`${today().slice(0, 7)}-01`, -1).slice(0, 7), addMonthsClamped(`${today().slice(0, 7)}-01`, 12).slice(0, 7)]) {
			const r = await api("GET", `/chart?metric=balance_projection&month=${bad}`);
			expect(r.status).toBe(400);
			expect(r.json.code).toBe("VALIDATION_ERROR");
		}
		expect((await api("GET", "/chart?metric=balance_projection&type=bar")).status).toBe(400);
	});

	test("sem conta bancária devolve gráfico vazio", async () => {
		const { status, json } = await api("GET", "/chart?metric=balance_projection");
		expect(status).toBe(200);
		expect(json.data).toEqual([]);
	});
});
