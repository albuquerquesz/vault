import { describe, expect, test } from "bun:test";
import {
	mapPluggyTransactionsToExpenses,
	type StoredTransactionForExpense,
} from "./pluggy.js";

function tx(
	overrides: Partial<StoredTransactionForExpense> = {},
): StoredTransactionForExpense {
	return {
		pluggyTransactionId: "remote-tx-1",
		date: "2026-07-01",
		amount: "-42.50",
		description: "Mercado",
		category: "Alimentação",
		provider: "Nubank",
		accountName: "Cartão de Crédito",
		accountType: "CREDIT",
		accountSubtype: "credit_card",
		accountBrand: "Mastercard",
		...overrides,
	};
}

describe("mapPluggyTransactionsToExpenses", () => {
	test("includes origin metadata for outgoing transactions", () => {
		const result = mapPluggyTransactionsToExpenses({
			userId: "user-1",
			localItemId: "item-1",
			transactions: [tx()],
		});

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			userId: "user-1",
			sourceItemId: "item-1",
			sourceExternalId: "remote-tx-1",
			amount: "42.50",
			source: "pluggy",
			sourceProvider: "Nubank",
			sourceAccountName: "Cartão de Crédito",
			sourceAccountType: "CREDIT",
			sourceAccountSubtype: "credit_card",
			sourceAccountBrand: "Mastercard",
		});
	});

	test("keeps null account fields when account is missing", () => {
		const result = mapPluggyTransactionsToExpenses({
			userId: "user-1",
			localItemId: "item-1",
			transactions: [
				tx({
					accountName: null,
					accountType: null,
					accountSubtype: null,
					accountBrand: null,
				}),
			],
		});

		expect(result).toHaveLength(1);
		expect(result[0]?.sourceProvider).toBe("Nubank");
		expect(result[0]?.sourceAccountName).toBeNull();
		expect(result[0]?.sourceAccountType).toBeNull();
		expect(result[0]?.sourceAccountSubtype).toBeNull();
		expect(result[0]?.sourceAccountBrand).toBeNull();
	});

	test("ignores income and ignored transfer categories", () => {
		const result = mapPluggyTransactionsToExpenses({
			userId: "user-1",
			localItemId: "item-1",
			transactions: [
				tx({ pluggyTransactionId: "income", amount: "100" }),
				tx({
					pluggyTransactionId: "pix",
					amount: "-10",
					category: "Transfer - PIX",
				}),
				tx({ pluggyTransactionId: "expense", amount: "-15" }),
			],
		});

		expect(result).toHaveLength(1);
		expect(result[0]?.sourceExternalId).toBe("expense");
	});
});
