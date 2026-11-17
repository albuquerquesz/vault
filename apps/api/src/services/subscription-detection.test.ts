import { describe, expect, test } from "bun:test";
import {
	detectSubscriptions,
	merchantKey,
	type SubscriptionCandidate,
} from "./subscription-detection.js";

function charge(
	description: string,
	date: string,
	amount: number,
	extra: Partial<SubscriptionCandidate> = {},
): SubscriptionCandidate {
	return {
		date,
		amount,
		description,
		category: "Digital services",
		accountName: "Nubank",
		source: "pluggy",
		...extra,
	};
}

const TODAY = "2026-11-08";

describe("merchantKey", () => {
	test("ignores case, accents, digits and noise words", () => {
		expect(merchantKey("NETFLIX.COM 0123")).toBe("netflix");
		expect(merchantKey("Compra no débito Spotify P1A2B3")).toBe("spotify");
		expect(merchantKey("PIX enviado Maria Silva")).toBe("maria silva");
	});

	test("keeps only the first three words", () => {
		expect(merchantKey("Google One Armazenamento Extra Plano")).toBe(
			"google one armazenamento",
		);
	});

	test("empty without a description", () => {
		expect(merchantKey(null)).toBe("");
	});
});

describe("detectSubscriptions", () => {
	test("finds a monthly charge still running", () => {
		const result = detectSubscriptions(
			[
				charge("Netflix.com", "2026-08-05", 44.9),
				charge("Netflix.com", "2026-09-05", 44.9),
				charge("Netflix.com", "2026-10-05", 44.9),
				charge("Netflix.com", "2026-11-05", 44.9),
			],
			TODAY,
		);
		expect(result.subscriptions).toHaveLength(1);
		expect(result.subscriptions[0]).toMatchObject({
			name: "Netflix.com",
			amount: 44.9,
			confidence: "high",
			occurrences: 4,
			firstChargeDate: "2026-08-05",
			lastChargeDate: "2026-11-05",
			nextExpectedDate: "2026-12-05",
		});
		expect(result.monthlyTotal).toBe(44.9);
		expect(result.asOf).toBe(TODAY);
	});

	test("two equal charges a month apart count with medium confidence", () => {
		const result = detectSubscriptions(
			[
				charge("Spotify", "2026-10-02", 23.9),
				charge("Spotify", "2026-11-02", 23.9),
			],
			TODAY,
		);
		expect(result.subscriptions[0]?.confidence).toBe("medium");
	});

	test("two charges with different amounts are not enough", () => {
		const result = detectSubscriptions(
			[
				charge("Spotify", "2026-10-02", 23.9),
				charge("Spotify", "2026-11-02", 30),
			],
			TODAY,
		);
		expect(result.subscriptions).toHaveLength(0);
	});

	test("a price rise keeps it a subscription and reports the latest amount", () => {
		const result = detectSubscriptions(
			[
				charge("Netflix.com", "2026-07-05", 39.9),
				charge("Netflix.com", "2026-08-05", 44.9),
				charge("Netflix.com", "2026-09-05", 44.9),
				charge("Netflix.com", "2026-10-05", 44.9),
			],
			TODAY,
		);
		expect(result.subscriptions[0]?.amount).toBe(44.9);
	});

	test("a subscription not charged for over 45 days is no longer current", () => {
		const result = detectSubscriptions(
			[
				charge("Deezer", "2026-06-01", 21.9),
				charge("Deezer", "2026-07-01", 21.9),
				charge("Deezer", "2026-08-01", 21.9),
			],
			TODAY,
		);
		expect(result.subscriptions).toHaveLength(0);
	});

	test("installments are not subscriptions", () => {
		const result = detectSubscriptions(
			[
				charge("Magalu parcela 1/4", "2026-08-10", 150),
				charge("Magalu parcela 2/4", "2026-09-10", 150),
				charge("Magalu parcela 3/4", "2026-10-10", 150),
			],
			TODAY,
		);
		expect(result.subscriptions).toHaveLength(0);
	});

	test("frequent shopping with varying amounts is not a subscription", () => {
		const result = detectSubscriptions(
			[
				charge("Supermercado Bom Preço", "2026-09-04", 212.4),
				charge("Supermercado Bom Preço", "2026-09-19", 98.1),
				charge("Supermercado Bom Preço", "2026-10-03", 340.55),
				charge("Supermercado Bom Preço", "2026-10-21", 75.2),
				charge("Supermercado Bom Preço", "2026-11-02", 180),
			],
			TODAY,
		);
		expect(result.subscriptions).toHaveLength(0);
	});

	test("charges that do not come every month are ignored", () => {
		const result = detectSubscriptions(
			[
				charge("Uber", "2026-09-01", 25),
				charge("Uber", "2026-09-04", 25),
				charge("Uber", "2026-10-30", 25),
			],
			TODAY,
		);
		expect(result.subscriptions).toHaveLength(0);
	});

	test("two charges on the same day count once", () => {
		const result = detectSubscriptions(
			[
				charge("Spotify", "2026-10-02", 23.9),
				charge("Spotify", "2026-10-02", 23.9),
			],
			TODAY,
		);
		expect(result.subscriptions).toHaveLength(0);
	});

	test("manual entries count and the list is sorted by amount", () => {
		const result = detectSubscriptions(
			[
				charge("Academia", "2026-09-10", 120, {
					source: "cash",
					category: "Saúde",
				}),
				charge("Academia", "2026-10-10", 120, {
					source: "cash",
					category: "Saúde",
				}),
				charge("Academia", "2026-11-10", 120, {
					source: "cash",
					category: "Saúde",
				}),
				charge("Spotify", "2026-09-02", 23.9),
				charge("Spotify", "2026-10-02", 23.9),
				charge("Spotify", "2026-11-02", 23.9),
			],
			"2026-11-11",
		);
		expect(result.subscriptions.map((item) => item.name)).toEqual([
			"Academia",
			"Spotify",
		]);
		expect(result.monthlyTotal).toBe(143.9);
	});

	test("ignores non positive amounts", () => {
		const result = detectSubscriptions(
			[
				charge("Estorno", "2026-10-02", -10),
				charge("Estorno", "2026-11-02", 0),
			],
			TODAY,
		);
		expect(result.subscriptions).toHaveLength(0);
	});
});
