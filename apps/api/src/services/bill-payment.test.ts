import { describe, expect, test } from "bun:test";
import { effectivePaidAmount, paidSource } from "./bill-payment.js";

describe("effectivePaidAmount", () => {
	test("keeps the bank amount when there is no manual payment", () => {
		expect(
			effectivePaidAmount({ bankPaid: 50, billTotal: 200, manualPaid: undefined }),
		).toBe(50);
	});

	test("a manual payment without an amount pays the whole bill", () => {
		expect(
			effectivePaidAmount({ bankPaid: 0, billTotal: 200, manualPaid: null }),
		).toBe(200);
	});

	test("a partial manual payment is used when larger than the bank's", () => {
		expect(
			effectivePaidAmount({ bankPaid: 30, billTotal: 200, manualPaid: 80 }),
		).toBe(80);
	});

	test("the bank wins once it reports more than the manual payment", () => {
		expect(
			effectivePaidAmount({ bankPaid: 200, billTotal: 200, manualPaid: 80 }),
		).toBe(200);
	});
});

describe("paidSource", () => {
	test("is manual only while the manual payment is what raises the amount", () => {
		expect(
			paidSource({ bankPaid: 0, effectivePaid: 200, hasManualPayment: true }),
		).toBe("manual");
		expect(
			paidSource({ bankPaid: 200, effectivePaid: 200, hasManualPayment: true }),
		).toBe("bank");
		expect(
			paidSource({ bankPaid: 40, effectivePaid: 40, hasManualPayment: false }),
		).toBe("bank");
	});
});
