import { describe, expect, test } from "bun:test";
import { normalizeAccount, normalizeBill, resolveTransactionsPagePath } from "./client.js";

describe("resolveTransactionsPagePath", () => {
	const accountId = "06de14ee-115b-4c43-a4d1-321b6c5341a9";
	const startDate = "2026-02-01";
	const endDate = "2026-07-22";

	test("builds first page from filters", () => {
		const path = resolveTransactionsPagePath(
			accountId,
			startDate,
			endDate,
			null,
		);
		expect(path).toBe(
			`/v2/transactions?accountId=${accountId}&dateFrom=${startDate}&dateTo=${endDate}`,
		);
	});

	test("follows Pluggy opaque next query string without stuffing it into after", () => {
		const next =
			"?accountId=06de14ee-115b-4c43-a4d1-321b6c5341a9&dateFrom=2026-02-01&dateTo=2026-07-22&after=MjAyNi0wMi0yMFQxOToxNzo0Ny41NzBafDBiMTNjZGUwLWMyZjQtNGE0Mi1hNGQzLTNmNzI0ZDk4YTU2Nw%3D%3D";

		const path = resolveTransactionsPagePath(
			accountId,
			startDate,
			endDate,
			next,
		);

		expect(path).toBe(`/v2/transactions${next}`);
		expect(path).not.toContain("after=%3FaccountId");
	});

	test("accepts absolute path next values", () => {
		const next =
			"/v2/transactions?accountId=abc&after=cursor-token";
		expect(
			resolveTransactionsPagePath(accountId, startDate, endDate, next),
		).toBe(next);
	});

	test("strips origin from full URL next values", () => {
		const next =
			"https://api.pluggy.ai/v2/transactions?accountId=abc&after=cursor";
		expect(
			resolveTransactionsPagePath(accountId, startDate, endDate, next),
		).toBe("/v2/transactions?accountId=abc&after=cursor");
	});

	test("treats bare tokens as after cursor (legacy)", () => {
		const path = resolveTransactionsPagePath(
			accountId,
			startDate,
			endDate,
			"raw-cursor-token",
		);
		expect(path).toBe(
			`/v2/transactions?accountId=${accountId}&dateFrom=${startDate}&dateTo=${endDate}&after=raw-cursor-token`,
		);
	});
});

describe("normalizeAccount", () => {
	test("reads the card's limit, dates, minimum payment, brand and status from creditData", () => {
		const account = normalizeAccount({
			id: "a1",
			itemId: "i1",
			type: "CREDIT",
			subtype: "CREDIT_CARD",
			name: "gold",
			balance: 831.47,
			creditData: {
				brand: "MASTERCARD",
				status: "ACTIVE",
				creditLimit: 5000,
				availableCreditLimit: 3200,
				balanceCloseDate: null,
				balanceDueDate: "2026-11-17T00:00:00.000Z",
				minimumPayment: 120.5,
			},
		});

		expect(account).toMatchObject({
			brand: "MASTERCARD",
			status: "ACTIVE",
			creditLimit: 5000,
			availableCreditLimit: 3200,
			balanceDueDate: "2026-11-17T00:00:00.000Z",
			minimumPayment: 120.5,
		});
		// A null from the bank is "not reported", not a value.
		expect(account.balanceCloseDate).toBeUndefined();
		expect(account.availableBalance).toBe(3200);
	});

	test("a bank account carries no credit fields", () => {
		const account = normalizeAccount({
			id: "b1",
			itemId: "i1",
			type: "BANK",
			subtype: "CHECKING_ACCOUNT",
			balance: 10,
			bankData: { availableBalance: 8 },
		});
		expect(account.creditLimit).toBeUndefined();
		expect(account.brand).toBeUndefined();
		expect(account.availableBalance).toBe(8);
	});
});

describe("normalizeBill", () => {
	test("keeps the closing date when the bank sends it and leaves it out when it does not", () => {
		const base = { id: "b", dueDate: "2026-11-17T00:00:00.000Z", totalAmount: 100 };
		expect(normalizeBill({ ...base, billClosingDate: "2026-11-10T00:00:00.000Z" }).billClosingDate).toBe("2026-11-10T00:00:00.000Z");
		expect(normalizeBill({ ...base, billClosingDate: null }).billClosingDate).toBeUndefined();
		expect(normalizeBill(base).billClosingDate).toBeUndefined();
	});
});
