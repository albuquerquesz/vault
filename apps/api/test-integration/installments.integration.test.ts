import { beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.js";
import {
	pluggyAccounts,
	pluggyItems,
	pluggyTransactions,
} from "../src/db/schema/index.js";
import type { PluggyAccount, PluggyTransaction } from "../src/clients/pluggy/types.js";
import { addMonthsClamped, dateOnly } from "../src/services/credit-cards.js";
import { syncTransactionsForItem } from "../src/services/pluggy.js";
import { todayInSaoPaulo } from "../src/services/subscriptions.js";
import { api, resetDatabase, TEST_USER_ID } from "./helpers.js";

beforeEach(resetDatabase);

const today = () => todayInSaoPaulo();
const daysAgo = (days: number) =>
	dateOnly(new Date(Date.parse(`${today()}T00:00:00Z`) - days * 86_400_000)) as string;

async function seedAccounts() {
	const [item] = await db
		.insert(pluggyItems)
		.values({ userId: TEST_USER_ID, pluggyItemId: "pi-1", provider: "MeuPluggy" })
		.returning();
	const [card] = await db
		.insert(pluggyAccounts)
		.values({ pluggyItemId: item!.id, pluggyAccountId: "pa-card", type: "CREDIT", subtype: "CREDIT_CARD", name: "gold" })
		.returning();
	const [bank] = await db
		.insert(pluggyAccounts)
		.values({ pluggyItemId: item!.id, pluggyAccountId: "pa-bank", type: "BANK", name: "Conta" })
		.returning();
	return { item: item!, card: card!, bank: bank! };
}

describe("GET /installments", () => {
	test("lista os planos em andamento e soma o que falta mês a mês", async () => {
		const { item, card, bank } = await seedAccounts();
		let n = 0;
		const tx = (accountId: string, date: string, amount: string, description: string, extra: { installmentNumber?: number; totalInstallments?: number } = {}) =>
			db.insert(pluggyTransactions).values({
				pluggyItemId: item.id,
				pluggyAccountId: accountId,
				pluggyTransactionId: `t-${++n}`,
				date,
				amount,
				description,
				category: "Shopping",
				...extra,
			});

		// By the text only (the gold case).
		await tx(card.id, daysAgo(15), "54.95", "Mercado*Mercadolivre 1/6");
		await tx(card.id, daysAgo(9), "54.90", "Mercado*Mercadolivre 2/6");
		// By the structured fields only (the Mercado Pago case: no n/m in the text).
		await tx(card.id, daysAgo(13), "6.51", "Pag*Steam", { installmentNumber: 1, totalInstallments: 3 });
		await tx(card.id, daysAgo(9), "6.49", "Pag*Steam", { installmentNumber: 2, totalInstallments: 3 });
		// Finished, a refund and a bank account row stay out.
		await tx(card.id, daysAgo(8), "63.12", "Sh Manaira 3/3");
		await tx(card.id, daysAgo(8), "-20.00", "Estorno 2/4");
		await tx(bank.id, daysAgo(8), "30.00", "Pix 2/5");

		const { status, json } = await api("GET", "/installments?months=6");
		expect(status).toBe(200);

		expect(json.plans.map((plan: { name: string }) => plan.name).sort()).toEqual(["Mercado*Mercadolivre", "Pag*Steam"]);
		const mercadolivre = json.plans.find((plan: { name: string }) => plan.name === "Mercado*Mercadolivre");
		expect(mercadolivre).toMatchObject({
			cardName: "gold",
			lastNumber: 2,
			totalInstallments: 6,
			installmentAmount: 54.9,
			remainingInstallments: 4,
			remainingAmount: 219.6,
			nextExpectedDate: addMonthsClamped(daysAgo(9), 1),
		});
		expect(json.summary).toEqual({ activePlans: 2, remainingInstallments: 5, remainingAmount: 226.09 });

		// The next installment of each lands one month after the last, in the same month for both.
		const nextMonth = addMonthsClamped(daysAgo(9), 1).slice(0, 7);
		const first = json.upcoming.find((month: { month: string }) => month.month === nextMonth);
		expect(first).toMatchObject({ count: 2, total: 61.39 });
		expect(json.upcoming.reduce((sum: number, month: { count: number }) => sum + month.count, 0)).toBe(5);
	});

	test("o intervalo de meses é validado e quem não tem cartão recebe tudo vazio", async () => {
		expect((await api("GET", "/installments?months=13")).status).toBe(400);
		expect((await api("GET", "/installments?months=0")).status).toBe(400);

		const empty = await api("GET", "/installments");
		expect(empty.json).toEqual({
			plans: [],
			upcoming: [],
			summary: { activePlans: 0, remainingInstallments: 0, remainingAmount: 0 },
		});
	});
});

describe("o sync guarda o número da parcela", () => {
	const card: PluggyAccount = { id: "pa-card", itemId: "pi-1", type: "CREDIT", subtype: "CREDIT_CARD", name: "gold" };
	const purchase = (installment: { installmentNumber: number; totalInstallments: number } | null): PluggyTransaction => ({
		id: "pt-1",
		date: daysAgo(3),
		amount: 54.9,
		description: "MP*MERCADOLIVRE",
		category: "Shopping",
		accountId: "pa-card",
		creditCardMetadata: installment ? { billId: null, ...installment } : { billId: null },
	});
	const serviceWith = (transaction: PluggyTransaction) =>
		({
			listAccounts: async () => [card],
			listBills: async () => [],
			getTransactionsByAccount: async () => ({ transactions: [transaction] }),
		}) as never;

	async function sync(transaction: PluggyTransaction) {
		const [item] = await db.select().from(pluggyItems);
		await syncTransactionsForItem({
			service: serviceWith(transaction),
			userId: TEST_USER_ID,
			localItemId: item!.id,
			pluggyItemId: "pi-1",
		});
		const [stored] = await db.select().from(pluggyTransactions).where(eq(pluggyTransactions.pluggyTransactionId, "pt-1"));
		return stored!;
	}

	test("grava número e total, e um sync sem eles não apaga o que já se sabe", async () => {
		await db.insert(pluggyItems).values({ userId: TEST_USER_ID, pluggyItemId: "pi-1", provider: "MeuPluggy" });

		const first = await sync(purchase({ installmentNumber: 2, totalInstallments: 6 }));
		expect([first.installmentNumber, first.totalInstallments]).toEqual([2, 6]);

		const again = await sync(purchase(null));
		expect([again.installmentNumber, again.totalInstallments]).toEqual([2, 6]);
	});
});
