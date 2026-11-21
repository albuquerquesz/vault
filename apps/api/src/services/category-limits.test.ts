import { describe, expect, test } from "bun:test";
import { calculateCategoryLimits } from "./category-limits.js";

describe("calculateCategoryLimits", () => {
	const limits = [{ category: "Alimentação", targetAmount: 500 }];

	test("sums the category's expenses, ignoring case and accents", () => {
		const [status] = calculateCategoryLimits({
			limits,
			transactions: [
				{ amount: -120.5, category: "alimentacao", kind: "expense" },
				{ amount: -80, category: "ALIMENTAÇÃO", kind: "expense" },
				{ amount: -999, category: "Transporte", kind: "expense" },
			],
		});
		expect(status).toMatchObject({
			spent: 200.5,
			remaining: 299.5,
			percentUsed: 40.1,
			isOver: false,
		});
	});

	test("income in the same category does not count as spending", () => {
		const [status] = calculateCategoryLimits({
			limits,
			transactions: [{ amount: 300, category: "Alimentação", kind: "income" }],
		});
		expect(status?.spent).toBe(0);
	});

	test("flags a limit that was passed", () => {
		const [status] = calculateCategoryLimits({
			limits,
			transactions: [{ amount: -520, category: "Alimentação", kind: "expense" }],
		});
		expect(status).toMatchObject({ isOver: true, remaining: -20, percentUsed: 104 });
	});

	test("a category without spending is at zero", () => {
		const [status] = calculateCategoryLimits({ limits, transactions: [] });
		expect(status).toMatchObject({ spent: 0, remaining: 500, percentUsed: 0, isOver: false });
	});
});
