import { describe, expect, test } from "bun:test";
import {
	addMonthsClamped,
	dateOnly,
	estimateOpenBill,
	openBillSince,
	summarizeLimit,
} from "./credit-cards.js";

describe("dateOnly", () => {
	test("keeps the UTC day the bank sent", () => {
		expect(dateOnly(new Date("2026-11-17T00:00:00.000Z"))).toBe("2026-11-17");
		expect(dateOnly(null)).toBeNull();
	});
});

describe("addMonthsClamped", () => {
	test("moves a month ahead and clamps to a shorter month", () => {
		expect(addMonthsClamped("2026-11-17", 1)).toBe("2026-12-17");
		expect(addMonthsClamped("2026-12-17", 1)).toBe("2027-01-17");
		expect(addMonthsClamped("2027-01-31", 1)).toBe("2027-02-28");
		expect(addMonthsClamped("2028-01-31", 1)).toBe("2028-02-29");
	});
});

describe("summarizeLimit", () => {
	test("works out what is in use and its share of the limit", () => {
		expect(summarizeLimit(5000, 3250)).toEqual({ total: 5000, available: 3250, used: 1750, usedPercent: 35 });
	});

	test("a card with no limit, or without the available amount, has no summary", () => {
		expect(summarizeLimit(null, 100)).toBeNull();
		expect(summarizeLimit(5000, null)).toBeNull();
		expect(summarizeLimit(0, 0)).toBeNull();
	});

	test("an available amount above the limit never makes the used amount negative", () => {
		expect(summarizeLimit(1000, 1200)?.used).toBe(0);
	});
});

describe("estimateOpenBill", () => {
	test("sums the unbilled purchases and moves the last bill's dates one month ahead", () => {
		expect(
			estimateOpenBill({
				lastDueDate: "2026-11-17",
				lastClosingDate: "2026-11-10",
				unbilledTotal: 312.456,
				unbilledCount: 5,
			}),
		).toEqual({
			estimatedTotal: 312.46,
			transactionCount: 5,
			estimatedClosingDate: "2026-12-10",
			estimatedDueDate: "2026-12-17",
			isEstimate: true,
		});
	});

	test("without a known closing date only the due date is estimated", () => {
		const estimate = estimateOpenBill({ lastDueDate: "2026-11-17", lastClosingDate: null, unbilledTotal: 10, unbilledCount: 1 });
		expect(estimate?.estimatedClosingDate).toBeNull();
		expect(estimate?.estimatedDueDate).toBe("2026-12-17");
	});

	test("a card with no bills and nothing unbilled has no open bill", () => {
		expect(estimateOpenBill({ lastDueDate: null, lastClosingDate: null, unbilledTotal: 0, unbilledCount: 0 })).toBeNull();
	});

	test("a card with a past bill and nothing unbilled has an open bill of zero", () => {
		expect(estimateOpenBill({ lastDueDate: "2026-11-17", lastClosingDate: null, unbilledTotal: 0, unbilledCount: 0 })?.estimatedTotal).toBe(0);
	});
});

describe("openBillSince", () => {
	test("starts at the last closing date when it is known", () => {
		expect(openBillSince("2026-11-19", "2026-11-12")).toBe("2026-11-12");
	});

	test("without a closing date it starts a month before the last due date", () => {
		expect(openBillSince("2026-11-19", null)).toBe("2026-10-19");
		expect(openBillSince("2026-03-31", null)).toBe("2026-02-28");
	});

	test("a card with no bill has no starting point", () => {
		expect(openBillSince(null, null)).toBeNull();
	});
});
