import { describe, expect, test } from "bun:test";
import { resolveTransactionsPagePath } from "./client.js";

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
