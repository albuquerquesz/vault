import { describe, expect, test } from "bun:test";
import {
	describeBills,
	describeCardTransactions,
	describeCreditAccounts,
	presence,
} from "./shape.js";

const NOW = new Date("2026-11-21T12:00:00Z");

describe("presence", () => {
	test("tells set, null and absent apart", () => {
		expect(presence({ a: 1, b: null }, ["a", "b", "c"])).toEqual({ a: "set", b: "null", c: "absent" });
		expect(presence(null, ["a"])).toEqual({ a: "absent" });
	});
});

describe("describeCreditAccounts", () => {
	test("describes the first card by keys and presence, never by value", () => {
		const shape = describeCreditAccounts(
			[
				{ id: "x", type: "BANK" },
				{
					id: "secret-id",
					type: "CREDIT",
					name: "gold",
					creditData: {
						balanceCloseDate: "2026-11-10T00:00:00Z",
						balanceDueDate: "2026-11-17T00:00:00Z",
						creditLimit: 5000,
						minimumPayment: null,
					},
				},
			],
			NOW,
		);
		expect(shape.creditAccounts).toBe(1);
		expect(shape.creditDataKeys).toEqual(["balanceCloseDate", "balanceDueDate", "creditLimit", "minimumPayment"]);
		expect(shape.creditData).toMatchObject({ creditLimit: "set", minimumPayment: "null", availableCreditLimit: "absent" });
		expect(shape.closeToDueDays).toBe(7);
		expect(shape.dueInFuture).toBe(false);
		expect(JSON.stringify(shape)).not.toContain("secret-id");
		expect(JSON.stringify(shape)).not.toContain("5000");
	});

	test("a response without cards is described as empty", () => {
		const shape = describeCreditAccounts([{ type: "BANK" }], NOW);
		expect(shape.creditAccounts).toBe(0);
		expect(shape.creditDataKeys).toEqual([]);
		expect(shape.closeToDueDays).toBeNull();
	});
});

describe("describeBills", () => {
	test("reports the latest bill, the closing date and bills still to be due", () => {
		const shape = describeBills(
			[
				{ dueDate: "2026-10-17T00:00:00Z", billClosingDate: "2026-10-10T00:00:00Z", totalAmount: 100, payments: [{}], financeCharges: [] },
				{ dueDate: "2026-12-17T00:00:00Z", billClosingDate: null, totalAmount: 999, minimumPaymentAmount: 50, payments: [], financeCharges: [{}, {}] },
			],
			NOW,
		);
		expect(shape.count).toBe(2);
		expect(shape.latestDueMonth).toBe("2026-12");
		expect(shape.latest).toMatchObject({ billClosingDate: "null", minimumPaymentAmount: "set", allowsInstallments: "absent" });
		expect(shape.dueAfterNow).toBe(1);
		expect(shape.withClosingDate).toBe(1);
		expect(shape.withMinimumPayment).toBe(1);
		expect(shape.latestFinanceCharges).toBe(2);
		expect(JSON.stringify(shape)).not.toContain("999");
	});
});

describe("describeCardTransactions", () => {
	test("counts installment metadata, future dated rows and descriptions ending in n/m", () => {
		const shape = describeCardTransactions(
			[
				{ date: "2026-11-12", description: "Loja 2/6", creditCardMetadata: { billId: "b1", installmentNumber: 2, totalInstallments: 6 } },
				{ date: "2026-12-12", description: "Loja 3/6", creditCardMetadata: { billId: null } },
				{ date: "2026-11-10", description: "Apple.Com/Bill", creditCardMetadata: null },
			],
			NOW,
		);
		expect(shape.rows).toBe(3);
		expect(shape.withCreditCardMetadata).toBe(2);
		expect(shape.metadataKeys).toEqual(["billId", "installmentNumber", "totalInstallments"]);
		expect(shape.metadataFilledRows).toMatchObject({ installmentNumber: 1, totalInstallments: 1, billId: 1, totalAmount: 0 });
		expect(shape.futureDated).toBe(1);
		expect(shape.descriptionEndsInInstallment).toBe(2);
		expect(JSON.stringify(shape)).not.toContain("Loja");
	});
});
