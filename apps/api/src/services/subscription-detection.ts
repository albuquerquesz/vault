import dayjs from "dayjs";

/** The vault has no subscription table: they are inferred from the spending history. */
export type SubscriptionCandidate = {
	date: string;
	/** Positive amount spent, in BRL. */
	amount: number;
	description: string | null;
	category: string | null;
	accountName: string | null;
	source: "pluggy" | "cash";
};

export type Subscription = {
	name: string;
	/** Latest charge. */
	amount: number;
	category: string | null;
	accountName: string | null;
	cadence: "monthly";
	/** high = 3+ charges, medium = 2 charges of the same amount. */
	confidence: "high" | "medium";
	occurrences: number;
	firstChargeDate: string;
	lastChargeDate: string;
	nextExpectedDate: string;
	source: "pluggy" | "cash";
};

export type SubscriptionsResult = {
	asOf: string;
	/** Months of history the detection looked at. */
	windowMonths: number;
	monthlyTotal: number;
	subscriptions: Subscription[];
};

export const SUBSCRIPTION_WINDOW_MONTHS = 7;
const MIN_GAP_DAYS = 24;
const MAX_GAP_DAYS = 38;
/** A charge older than this means the subscription is no longer current. */
const ACTIVE_WITHIN_DAYS = 45;
const AMOUNT_TOLERANCE = 0.1;
const LATEST_AMOUNT_TOLERANCE = 0.35;
const INSTALLMENT =
	/parc(ela)?\.?\s*\d+\s*(\/|de)\s*\d+|\b\d{1,2}\s*\/\s*\d{1,2}\b/i;
const NOISE_WORDS = new Set([
	"compra",
	"no",
	"na",
	"debito",
	"credito",
	"cartao",
	"pagamento",
	"pgto",
	"pix",
	"enviado",
	"transferencia",
	"de",
	"do",
	"da",
	"em",
	"via",
	"com",
	"br",
	"www",
]);

function stripAccents(value: string) {
	return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** "NETFLIX.COM 0123" and "Netflix.com" share the key "netflix". */
export function merchantKey(description: string | null) {
	if (!description) return "";
	const tokens = stripAccents(description.toLowerCase())
		.replace(/[^a-z0-9\s*]/g, " ")
		.replace(/\*/g, " ")
		.split(/\s+/)
		.filter(
			(token) =>
				token.length > 1 && !/\d/.test(token) && !NOISE_WORDS.has(token),
		);
	return tokens.slice(0, 3).join(" ");
}

function displayName(description: string | null, key: string) {
	const cleaned = (description ?? "").replace(/\s+/g, " ").trim();
	return cleaned.length > 0 && cleaned.length <= 60 ? cleaned : key;
}

function median(values: number[]) {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2
		? (sorted[middle] as number)
		: ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

function daysBetween(from: string, to: string) {
	return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

function roundMoney(value: number) {
	return Math.round(value * 100) / 100;
}

/**
 * Monthly recurring charges still running at `today` (YYYY-MM-DD).
 * Same merchant, a charge every ~30 days, a stable amount, the last charge in
 * the past 45 days. Installments and one-off merchants are left out.
 */
export function detectSubscriptions(
	candidates: SubscriptionCandidate[],
	today: string,
	windowMonths = SUBSCRIPTION_WINDOW_MONTHS,
): SubscriptionsResult {
	const groups = new Map<string, SubscriptionCandidate[]>();
	for (const candidate of candidates) {
		if (candidate.amount <= 0) continue;
		if (INSTALLMENT.test(candidate.description ?? "")) continue;
		const key = merchantKey(candidate.description);
		if (!key) continue;
		groups.set(key, [...(groups.get(key) ?? []), candidate]);
	}

	const subscriptions: Subscription[] = [];
	for (const [key, rows] of groups) {
		const charges = rows.sort((a, b) => a.date.localeCompare(b.date));
		// Two charges on the same day (retry, duplicate) count once.
		const deduped = charges.filter(
			(row, index) => index === 0 || row.date !== charges[index - 1]?.date,
		);
		if (deduped.length < 2) continue;

		const last = deduped[deduped.length - 1] as SubscriptionCandidate;
		if (daysBetween(last.date, today) > ACTIVE_WITHIN_DAYS) continue;

		const gaps = deduped
			.slice(1)
			.map((row, index) =>
				daysBetween((deduped[index] as SubscriptionCandidate).date, row.date),
			);
		const regular = gaps.filter(
			(gap) => gap >= MIN_GAP_DAYS && gap <= MAX_GAP_DAYS,
		).length;
		if (regular / gaps.length < 0.8) continue;

		const amounts = deduped.map((row) => row.amount);
		const typical = median(amounts);
		const stable = amounts.filter(
			(amount) => Math.abs(amount - typical) <= typical * AMOUNT_TOLERANCE,
		).length;
		if (stable / amounts.length < 0.7) continue;
		if (Math.abs(last.amount - typical) > typical * LATEST_AMOUNT_TOLERANCE)
			continue;

		const confidence = deduped.length >= 3 ? "high" : "medium";
		if (confidence === "medium" && deduped[0]?.amount !== last.amount) continue;

		subscriptions.push({
			name: displayName(last.description, key),
			amount: roundMoney(last.amount),
			category: last.category,
			accountName: last.accountName,
			cadence: "monthly",
			confidence,
			occurrences: deduped.length,
			firstChargeDate: (deduped[0] as SubscriptionCandidate).date,
			lastChargeDate: last.date,
			nextExpectedDate: dayjs(last.date).add(1, "month").format("YYYY-MM-DD"),
			source: last.source,
		});
	}

	subscriptions.sort(
		(a, b) => b.amount - a.amount || a.name.localeCompare(b.name),
	);
	return {
		asOf: today,
		windowMonths,
		monthlyTotal: roundMoney(
			subscriptions.reduce((total, item) => total + item.amount, 0),
		),
		subscriptions,
	};
}
