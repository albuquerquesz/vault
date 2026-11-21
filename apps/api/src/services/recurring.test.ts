import { describe, expect, test } from "bun:test";
import {
	buildOccurrences,
	dueDateFor,
	isActiveIn,
	previousMonth,
	type RealTransaction,
	type RecurringItemRow,
	summarizeOccurrences,
} from "./recurring.js";

const item = (over: Partial<RecurringItemRow> = {}): RecurringItemRow => ({
	id: "rent",
	kind: "bill",
	name: "Aluguel",
	amount: 1500,
	dayOfMonth: 5,
	startMonth: "2026-01",
	endMonth: null,
	category: "Moradia",
	matchText: null,
	...over,
});

const tx = (over: Partial<RealTransaction> = {}): RealTransaction => ({
	id: "t1",
	date: "2026-12-05",
	amount: -1500,
	category: "Moradia",
	description: "PIX ALUGUEL JOAO",
	kind: "expense",
	...over,
});

describe("dueDateFor", () => {
	test("day 31 in a shorter month falls on its last day", () => {
		expect(dueDateFor("2026-02", 31)).toBe("2026-02-28");
		expect(dueDateFor("2028-02", 31)).toBe("2028-02-29");
		expect(dueDateFor("2026-04", 31)).toBe("2026-04-30");
		expect(dueDateFor("2026-12", 5)).toBe("2026-12-05");
	});
});

describe("isActiveIn", () => {
	test("covers the start month and the end month, both included", () => {
		const bounded = { startMonth: "2026-03", endMonth: "2026-05" };
		expect(isActiveIn(bounded, "2026-02")).toBe(false);
		expect(isActiveIn(bounded, "2026-03")).toBe(true);
		expect(isActiveIn(bounded, "2026-05")).toBe(true);
		expect(isActiveIn(bounded, "2026-06")).toBe(false);
	});

	test("an item without an end month never ends", () => {
		expect(isActiveIn({ startMonth: "2026-03", endMonth: null }, "2030-01")).toBe(true);
	});
});

describe("previousMonth", () => {
	test("crosses the year", () => {
		expect(previousMonth("2027-01")).toBe("2026-12");
		expect(previousMonth("2026-12")).toBe("2026-11");
	});
});

describe("buildOccurrences", () => {
	const none = new Set<string>();

	test("a matching real transaction makes the item realized", () => {
		const [occurrence] = buildOccurrences({
			month: "2026-12",
			items: [item()],
			transactions: [tx()],
			paidByHand: none,
		});
		expect(occurrence).toMatchObject({
			status: "realized",
			dueDate: "2026-12-05",
			matchedTransaction: { id: "t1", amount: -1500 },
		});
	});

	test("an item with no match is expected, or paid when marked by hand", () => {
		const base = { month: "2026-12", items: [item()], transactions: [] };
		expect(buildOccurrences({ ...base, paidByHand: none })[0]?.status).toBe("expected");
		expect(buildOccurrences({ ...base, paidByHand: new Set(["rent"]) })[0]?.status).toBe(
			"paid_manual",
		);
	});

	test("a real transaction wins over a manual mark", () => {
		const [occurrence] = buildOccurrences({
			month: "2026-12",
			items: [item()],
			transactions: [tx()],
			paidByHand: new Set(["rent"]),
		});
		expect(occurrence?.status).toBe("realized");
	});

	test("the amount must be within the tolerance", () => {
		const within = buildOccurrences({ month: "2026-12", items: [item()], transactions: [tx({ amount: -1560 })], paidByHand: none });
		expect(within[0]?.status).toBe("realized");
		const outside = buildOccurrences({ month: "2026-12", items: [item()], transactions: [tx({ amount: -1700 })], paidByHand: none });
		expect(outside[0]?.status).toBe("expected");
	});

	test("matching ignores case and accents and can use its own text", () => {
		const custom = buildOccurrences({
			month: "2026-12",
			items: [item({ name: "Casa", matchText: "imobiliária" })],
			transactions: [tx({ description: "IMOBILIARIA SOL" })],
			paidByHand: none,
		});
		expect(custom[0]?.status).toBe("realized");
	});

	test("a bill never matches money in, and an income never matches money out", () => {
		const bill = buildOccurrences({ month: "2026-12", items: [item()], transactions: [tx({ kind: "income", amount: 1500 })], paidByHand: none });
		expect(bill[0]?.status).toBe("expected");
		const income = buildOccurrences({
			month: "2026-12",
			items: [item({ id: "salary", kind: "income", name: "Salário", amount: 5000 })],
			transactions: [tx({ description: "SALARIO EMPRESA", kind: "expense", amount: -5000 })],
			paidByHand: none,
		});
		expect(income[0]?.status).toBe("expected");
	});

	test("one transaction pays one item only, the closest in amount", () => {
		const items = [item({ id: "a", name: "Aluguel", amount: 1500 }), item({ id: "b", name: "Aluguel", amount: 1520 })];
		const result = buildOccurrences({ month: "2026-12", items, transactions: [tx({ amount: -1518 })], paidByHand: none });
		const realized = result.filter((o) => o.status === "realized");
		expect(realized).toHaveLength(1);
		expect(realized[0]?.id).toBe("b");
	});

	test("items outside the month are left out and the rest is ordered by due day", () => {
		const items = [
			item({ id: "late", name: "Internet", dayOfMonth: 25, amount: 100 }),
			item({ id: "early", name: "Condomínio", dayOfMonth: 2, amount: 400 }),
			item({ id: "ended", name: "Antigo", endMonth: "2026-06" }),
		];
		const result = buildOccurrences({ month: "2026-12", items, transactions: [], paidByHand: none });
		expect(result.map((o) => o.id)).toEqual(["early", "late"]);
	});
});

describe("summarizeOccurrences", () => {
	test("pending leaves out what already happened", () => {
		const occurrences = buildOccurrences({
			month: "2026-12",
			items: [
				item({ id: "rent", amount: 1500 }),
				item({ id: "net", name: "Internet", amount: 100 }),
				item({ id: "salary", kind: "income", name: "Salário", amount: 5000 }),
			],
			transactions: [tx()],
			paidByHand: new Set(["net"]),
		});
		expect(summarizeOccurrences(occurrences)).toEqual({
			billsPlanned: 1600,
			billsPending: 0,
			incomePlanned: 5000,
			incomePending: 5000,
		});
	});
});
