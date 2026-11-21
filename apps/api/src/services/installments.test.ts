import { describe, expect, test } from "bun:test";
import {
	activePlans,
	baseName,
	buildInstallmentPlans,
	type InstallmentRow,
	installmentOf,
	projectUpcoming,
} from "./installments.js";

let seq = 0;
const row = (date: string, description: string, amount: number, over: Partial<InstallmentRow> = {}): InstallmentRow => ({
	id: `t${++seq}`,
	accountId: "card-gold",
	cardName: "gold",
	date,
	amount,
	description,
	installmentNumber: null,
	totalInstallments: null,
	...over,
});

describe("installmentOf", () => {
	test("the structured fields win over the text", () => {
		expect(installmentOf({ description: "Loja 9/9", installmentNumber: 2, totalInstallments: 6 })).toEqual({ number: 2, total: 6 });
	});

	test("a row with the fields but no text still counts (the Mercado Pago case)", () => {
		expect(installmentOf({ description: "MP*MERCADOLIVRE", installmentNumber: 1, totalInstallments: 3 })).toEqual({ number: 1, total: 3 });
	});

	test("falls back to n/m at the end of the description", () => {
		expect(installmentOf({ description: "Mercado*Mercadolivre 2/6", installmentNumber: null, totalInstallments: null })).toEqual({ number: 2, total: 6 });
	});

	test("things that only look like installments are not", () => {
		for (const description of ["Apple.Com/Bill", "Compra 12/11", "Loja 1/1", "Loja 0/3", null])
			expect(installmentOf({ description, installmentNumber: null, totalInstallments: null })).toBeNull();
	});
});

describe("baseName", () => {
	test("drops the n/m suffix", () => {
		expect(baseName("Pag*Steam 2/3")).toBe("Pag*Steam");
		expect(baseName("Loja")).toBe("Loja");
	});
});

describe("buildInstallmentPlans", () => {
	test("one purchase is one plan with what is left and the next expected date", () => {
		const [plan, ...others] = buildInstallmentPlans([
			row("2026-11-06", "Mercado*Mercadolivre 1/6", 54.95),
			row("2026-11-12", "Mercado*Mercadolivre 2/6", 54.9),
		]);
		expect(others).toHaveLength(0);
		expect(plan).toMatchObject({
			name: "Mercado*Mercadolivre",
			totalInstallments: 6,
			lastNumber: 2,
			installmentAmount: 54.9,
			remainingInstallments: 4,
			remainingAmount: 219.6,
			nextExpectedDate: "2026-12-12",
			isComplete: false,
		});
	});

	test("two purchases from the same merchant and total do not mix (Steam)", () => {
		const plans = buildInstallmentPlans([
			row("2026-08-25", "Pag*Steam 1/3", 20.01),
			row("2026-09-12", "Pag*Steam 2/3", 19.99),
			row("2026-10-12", "Pag*Steam 3/3", 19.99),
			row("2026-11-08", "Pag*Steam 1/3", 6.51),
			row("2026-11-12", "Pag*Steam 2/3", 6.49),
		]);
		expect(plans).toHaveLength(2);
		const done = plans.find((plan) => plan.isComplete);
		const running = plans.find((plan) => !plan.isComplete);
		expect(done?.installmentAmount).toBe(19.99);
		expect(running).toMatchObject({ lastNumber: 2, installmentAmount: 6.49, remainingInstallments: 1, nextExpectedDate: "2026-12-12" });
	});

	test("simultaneous purchases pair by amount (two 2/2 on the same day)", () => {
		const plans = buildInstallmentPlans([
			row("2026-07-02", "Jim.Com* Maria Eduard 1/2", 31.95),
			row("2026-07-03", "Jim.Com* Maria Eduard 1/2", 42.6),
			row("2026-07-07", "Jim.Com* Maria Eduard 2/2", 42.59),
			row("2026-07-07", "Jim.Com* Maria Eduard 2/2", 31.95),
		]);
		expect(plans).toHaveLength(2);
		expect(plans.every((plan) => plan.isComplete)).toBe(true);
		expect(plans.map((plan) => plan.installmentAmount).sort()).toEqual([31.95, 42.59]);
	});

	test("a plan that reached its last installment is complete", () => {
		const [plan] = buildInstallmentPlans([
			row("2026-09-13", "00106 Sh Manaira 1/3", 63.14),
			row("2026-10-12", "00106 Sh Manaira 2/3", 63.12),
			row("2026-11-14", "00106 Sh Manaira 3/3", 63.12),
		]);
		expect(plan).toMatchObject({ isComplete: true, remainingInstallments: 0, nextExpectedDate: null, remainingAmount: 0 });
	});

	test("uses the structured fields for a card whose descriptions carry no n/m", () => {
		const [plan] = buildInstallmentPlans([
			row("2026-10-28", "MP*MERCADOLIVRE", 26.5, { accountId: "card-mp", cardName: "Mercado Pago", installmentNumber: 2, totalInstallments: 3 }),
		]);
		expect(plan).toMatchObject({ cardName: "Mercado Pago", lastNumber: 2, totalInstallments: 3, remainingInstallments: 1 });
	});

	test("refunds and rows that are not installments are left out", () => {
		expect(buildInstallmentPlans([row("2026-11-10", "Loja 2/3", -50), row("2026-11-10", "Apple.Com/Bill", 5.9)])).toEqual([]);
	});

	test("the same merchant on two cards stays apart", () => {
		const plans = buildInstallmentPlans([
			row("2026-11-12", "Loja 2/3", 10, { accountId: "a" }),
			row("2026-11-12", "Loja 2/3", 10, { accountId: "b" }),
		]);
		expect(plans).toHaveLength(2);
	});
});

describe("activePlans", () => {
	const plans = buildInstallmentPlans([
		row("2026-11-12", "Recente 2/6", 50),
		row("2026-06-01", "Parada 2/6", 50),
		row("2026-11-14", "Terminada 3/3", 50),
	]);

	test("keeps the running ones and drops the complete and the stopped", () => {
		expect(activePlans(plans, "2026-11-21").map((plan) => plan.name)).toEqual(["Recente"]);
	});
});

describe("projectUpcoming", () => {
	const plans = activePlans(
		buildInstallmentPlans([
			row("2026-11-06", "Mercado*Mercadolivre 1/6", 54.95),
			row("2026-11-12", "Mercado*Mercadolivre 2/6", 54.9),
			row("2026-11-08", "Pag*Steam 1/3", 6.51),
			row("2026-11-12", "Pag*Steam 2/3", 6.49),
		]),
		"2026-11-21",
	);

	test("adds the remaining installments month by month, from December to March", () => {
		const upcoming = projectUpcoming(plans, "2026-11-21", 6);
		expect(upcoming.map((month) => month.month)).toEqual(["2026-12", "2027-01", "2027-02", "2027-03"]);
		expect(upcoming[0]).toMatchObject({ total: 61.39, count: 2 });
		expect(upcoming[1]).toMatchObject({ total: 54.9, count: 1 });
		expect(upcoming[0]?.items.map((item) => `${item.name} ${item.installmentNumber}/${item.totalInstallments}`)).toEqual([
			"Mercado*Mercadolivre 3/6",
			"Pag*Steam 3/3",
		]);
	});

	test("the window cuts what falls beyond it", () => {
		expect(projectUpcoming(plans, "2026-11-21", 2).map((month) => month.month)).toEqual(["2026-12"]);
	});
});
