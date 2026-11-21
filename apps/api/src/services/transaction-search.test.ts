import { describe, expect, test } from "bun:test";
import {
	matchesTransactionSearch,
	normalizeText,
	paginate,
	type SearchableTransaction,
} from "./transaction-search.js";

const tx = (over: Partial<SearchableTransaction> = {}): SearchableTransaction => ({
	date: "2026-10-10",
	amount: -42.5,
	category: "Alimentação",
	description: "PADARIA SÃO JOÃO",
	kind: "expense",
	...over,
});

describe("normalizeText", () => {
	test("drops accents and case", () => {
		expect(normalizeText("  Alimentação ")).toBe("alimentacao");
		expect(normalizeText(null)).toBe("");
	});
});

describe("matchesTransactionSearch", () => {
	test("text ignores case and accents and also looks at the category", () => {
		expect(matchesTransactionSearch(tx(), { q: "sao joao" })).toBe(true);
		expect(matchesTransactionSearch(tx(), { q: "ALIMENTACAO" })).toBe(true);
		expect(matchesTransactionSearch(tx(), { q: "uber" })).toBe(false);
	});

	test("amount range uses the absolute value", () => {
		expect(matchesTransactionSearch(tx(), { minAmount: 40, maxAmount: 50 })).toBe(true);
		expect(matchesTransactionSearch(tx(), { minAmount: 50 })).toBe(false);
		expect(matchesTransactionSearch(tx(), { maxAmount: 10 })).toBe(false);
	});

	test("category and kind are exact after normalising", () => {
		expect(matchesTransactionSearch(tx(), { category: "alimentacao" })).toBe(true);
		expect(matchesTransactionSearch(tx(), { category: "Transporte" })).toBe(false);
		expect(matchesTransactionSearch(tx(), { kind: "income" })).toBe(false);
	});

	test("filters combine", () => {
		expect(
			matchesTransactionSearch(tx(), { q: "padaria", kind: "expense", minAmount: 40 }),
		).toBe(true);
		expect(
			matchesTransactionSearch(tx(), { q: "padaria", kind: "expense", minAmount: 100 }),
		).toBe(false);
	});
});

describe("paginate", () => {
	const rows = Array.from({ length: 7 }, (_, i) => i);

	test("walks every row once, without repeating or skipping", () => {
		const seen: number[] = [];
		let cursor: string | undefined;
		do {
			const result = paginate(rows, { limit: 3, cursor });
			seen.push(...result.page);
			cursor = result.nextCursor ?? undefined;
		} while (cursor);
		expect(seen).toEqual(rows);
	});

	test("reports the total and no next cursor on the last page", () => {
		const result = paginate(rows, { limit: 3, cursor: "6" });
		expect(result).toEqual({ page: [6], total: 7, nextCursor: null });
	});
});
