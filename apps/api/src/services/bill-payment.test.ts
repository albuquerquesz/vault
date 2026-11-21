import { describe, expect, test } from "bun:test";
import { effectivePaidAmount, inCyclePaidAmount, paidSource } from "./bill-payment.js";

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

describe("inCyclePaidAmount", () => {
	test("o que a fatura cheia tem a mais que o total do banco já foi pago no ciclo", () => {
		expect(inCyclePaidAmount({ bankTotal: 167.7, fullTotal: 367.7 })).toBe(200);
	});

	test("sem diferença ou com total do banco maior, nada foi pago", () => {
		expect(inCyclePaidAmount({ bankTotal: 831.47, fullTotal: 831.47 })).toBe(0);
		expect(inCyclePaidAmount({ bankTotal: 500, fullTotal: 100 })).toBe(0);
	});

	test("fatura quitada no ciclo (banco deve 0) conta tudo como pago", () => {
		expect(inCyclePaidAmount({ bankTotal: 0, fullTotal: 80.5 })).toBe(80.5);
	});
});
