import { beforeEach, describe, expect, test } from "bun:test";
import { db } from "../src/db/index.js";
import {
	pluggyAccounts,
	pluggyBills,
	pluggyItems,
	pluggyTransactions,
} from "../src/db/schema/index.js";
import type { PluggyAccount, PluggyBill } from "../src/clients/pluggy/types.js";
import {
	syncAccountsForItem,
	syncBillsForCreditAccounts,
	materializeMonthlyBillsFromPluggy,
} from "../src/services/pluggy.js";
import { api, resetDatabase, TEST_USER_ID } from "./helpers.js";

beforeEach(resetDatabase);

async function seedItem() {
	const [item] = await db
		.insert(pluggyItems)
		.values({ userId: TEST_USER_ID, pluggyItemId: "pi-1", provider: "MeuPluggy" })
		.returning();
	return item!;
}

// A fake of the Pluggy service: only what the two sync phases call.
const fakeService = (accounts: PluggyAccount[], bills: PluggyBill[]) =>
	({
		listAccounts: async () => accounts,
		listBills: async () => bills,
	}) as never;

describe("o sync grava os campos do cartão", () => {
	const card: PluggyAccount = {
		id: "pa-card",
		itemId: "pi-1",
		type: "CREDIT",
		subtype: "CREDIT_CARD",
		name: "gold",
		balance: 831.47,
		availableBalance: 3200,
		brand: "MASTERCARD",
		status: "ACTIVE",
		creditLimit: 5000,
		availableCreditLimit: 3200,
		balanceDueDate: "2026-11-17T00:00:00.000Z",
		minimumPayment: 120.5,
	};
	const bill: PluggyBill = {
		id: "bill-1",
		dueDate: "2026-11-17T00:00:00.000Z",
		billClosingDate: "2026-11-10T00:00:00.000Z",
		totalAmount: 831.47,
		minimumPaymentAmount: 120.5,
		payments: [],
		financeCharges: [],
	};

	test("limite, vencimento, mínimo e fechamento ficam no banco e são atualizados no sync seguinte", async () => {
		const item = await seedItem();
		const service = fakeService([card], [bill]);

		const accounts = await syncAccountsForItem({ service, localItemId: item.id, pluggyItemId: "pi-1" });
		await syncBillsForCreditAccounts({
			service,
			userId: TEST_USER_ID,
			accounts: accounts.accounts,
			accountIdsByRemoteId: accounts.accountIdsByRemoteId,
			materialize: false,
		});

		const [storedAccount] = await db.select().from(pluggyAccounts);
		expect(Number(storedAccount?.creditLimit)).toBe(5000);
		expect(Number(storedAccount?.availableCreditLimit)).toBe(3200);
		expect(Number(storedAccount?.minimumPayment)).toBe(120.5);
		expect(storedAccount?.balanceDueDate?.toISOString().slice(0, 10)).toBe("2026-11-17");
		expect(storedAccount?.balanceCloseDate).toBeNull();
		expect(storedAccount?.brand).toBe("MASTERCARD");
		const [storedBill] = await db.select().from(pluggyBills);
		expect(storedBill?.billClosingDate?.toISOString().slice(0, 10)).toBe("2026-11-10");

		// The next sync brings a new limit and no closing date: both follow the bank.
		await syncAccountsForItem({
			service: fakeService([{ ...card, creditLimit: 6000, availableCreditLimit: 100 }], []),
			localItemId: item.id,
			pluggyItemId: "pi-1",
		});
		const [updated] = await db.select().from(pluggyAccounts);
		expect(Number(updated?.creditLimit)).toBe(6000);
		expect(Number(updated?.availableCreditLimit)).toBe(100);
	});
});

describe("GET /credit-cards", () => {
	async function seedCard() {
		const item = await seedItem();
		const [account] = await db
			.insert(pluggyAccounts)
			.values({
				pluggyItemId: item.id,
				pluggyAccountId: "pa-card",
				type: "CREDIT",
				subtype: "CREDIT_CARD",
				name: "gold",
				brand: "MASTERCARD",
				creditLimit: "5000.00",
				availableCreditLimit: "3250.00",
				balanceDueDate: new Date("2026-11-17T00:00:00Z"),
				minimumPayment: "120.50",
			})
			.returning();
		await db.insert(pluggyBills).values({
			pluggyAccountId: account!.id,
			pluggyBillId: "bill-1",
			dueDate: new Date("2026-11-17T00:00:00Z"),
			billClosingDate: new Date("2026-11-10T00:00:00Z"),
			totalAmount: "831.47",
			paidAmount: "0",
			minimumPaymentAmount: "120.50",
			currency: "BRL",
		});
		const tx = (id: string, amount: string, description: string, billId: string | null, category = "Shopping", date = "2026-11-15") =>
			db.insert(pluggyTransactions).values({
				pluggyItemId: item.id,
				pluggyAccountId: account!.id,
				pluggyTransactionId: id,
				date,
				amount,
				description,
				category,
				pluggyBillId: billId,
			});
		await tx("t-billed", "50.00", "LOJA A", "bill-1");
		await tx("t-open-1", "100.10", "LOJA B", null);
		await tx("t-open-2", "20.00", "LOJA C", null);
		await tx("t-open-refund", "-10.00", "ESTORNO LOJA", null);
		// Bought on the closing date itself: it goes to the next bill.
		await tx("t-closing-day", "7.00", "LOJA NO FECHAMENTO", null, "Shopping", "2026-11-10");
		await tx("t-payment", "-831.47", "Pagamento recebido", null, "Credit card payment");
		// Saved before billId existed: still unbilled in the table, but from a bill that closed long ago.
		await db.insert(pluggyTransactions).values({
			pluggyItemId: item.id,
			pluggyAccountId: account!.id,
			pluggyTransactionId: "t-old-unbilled",
			date: "2026-09-01",
			amount: "999.99",
			description: "COMPRA ANTIGA",
			category: "Shopping",
			pluggyBillId: null,
		});
		return account!;
	}

	test("limite, última fatura e fatura aberta estimada", async () => {
		await seedCard();

		const { status, json } = await api("GET", "/credit-cards");
		expect(status).toBe(200);
		expect(json.cards).toHaveLength(1);
		const card = json.cards[0];
		expect(card).toMatchObject({ name: "gold", brand: "MASTERCARD", provider: "MeuPluggy" });
		expect(card.limit).toEqual({ total: 5000, available: 3250, used: 1750, usedPercent: 35 });
		expect(card.reported).toEqual({ dueDate: "2026-11-17", closeDate: null, minimumPayment: 120.5 });
		expect(card.lastBill).toMatchObject({
			pluggyBillId: "bill-1",
			dueDate: "2026-11-17",
			closingDate: "2026-11-10",
			totalAmount: 831.47,
			minimumPaymentAmount: 120.5,
		});
		// 100,10 + 20,00 + 7,00 on the closing day - 10,00 of refund; the card payment, the billed purchase and the
		// old row with no billId (before the closing date) stay out.
		expect(card.openBill).toEqual({
			estimatedTotal: 117.1,
			transactionCount: 4,
			estimatedClosingDate: "2026-12-10",
			estimatedDueDate: "2026-12-17",
			isEstimate: true,
		});
	});

	test("conta corrente não aparece e quem não tem cartão recebe lista vazia", async () => {
		const item = await seedItem();
		await db.insert(pluggyAccounts).values({ pluggyItemId: item.id, pluggyAccountId: "pa-bank", type: "BANK", name: "Conta" });

		expect((await api("GET", "/credit-cards")).json).toEqual({ cards: [] });
	});

	test("as faturas do mês trazem a data de fechamento", async () => {
		await seedCard();
		await materializeMonthlyBillsFromPluggy({ userId: TEST_USER_ID });

		const bills = (await api("GET", "/monthly-bills?month=2026-11")).json;
		const item = bills.items.find((entry: { pluggyBillId: string }) => entry.pluggyBillId === "bill-1");
		expect(item).toMatchObject({ dueDate: "2026-11-17", closingDate: "2026-11-10", minimumPaymentAmount: 120.5 });
	});
});
