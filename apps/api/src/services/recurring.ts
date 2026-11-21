import { normalizeText } from "./transaction-search.js";

export type RecurringKind = "bill" | "income";

export type RecurringItemRow = {
	id: string;
	kind: RecurringKind;
	name: string;
	amount: number;
	dayOfMonth: number;
	startMonth: string;
	endMonth: string | null;
	category: string;
	matchText: string | null;
};

export type RealTransaction = {
	id: string;
	date: string;
	/** Signed: negative is money out. */
	amount: number;
	category: string;
	description: string | null;
	kind: "income" | "expense";
};

export type RecurringStatus = "expected" | "realized" | "paid_manual";

export type RecurringOccurrence = RecurringItemRow & {
	month: string;
	/** `AAAA-MM-DD`, the day clamped to the month's last day. */
	dueDate: string;
	status: RecurringStatus;
	matchedTransaction: { id: string; date: string; amount: number } | null;
};

/** Default tolerance between the registered amount and the real one. */
export const MATCH_TOLERANCE = 0.05;

const round2 = (value: number) => Math.round(value * 100) / 100;

export function previousMonth(month: string): string {
	const [year = 0, mon = 1] = month.split("-").map(Number);
	const date = new Date(Date.UTC(year, mon - 2, 1));
	return date.toISOString().slice(0, 7);
}

/** Whether the item applies to the month. */
export function isActiveIn(
	item: Pick<RecurringItemRow, "startMonth" | "endMonth">,
	month: string,
): boolean {
	return item.startMonth <= month && (item.endMonth === null || month <= item.endMonth);
}

/** The day of the month, clamped: day 31 in February is the 28th (or 29th). */
export function dueDateFor(month: string, dayOfMonth: number): string {
	const [year = 0, mon = 1] = month.split("-").map(Number);
	const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
	const day = Math.min(Math.max(dayOfMonth, 1), lastDay);
	return `${month}-${String(day).padStart(2, "0")}`;
}

function matchesItem(
	item: RecurringItemRow,
	tx: RealTransaction,
	tolerance: number,
): boolean {
	// A bill is money out and an income is money in; the other direction never matches.
	if ((item.kind === "bill") !== (tx.kind === "expense")) return false;
	const needle = normalizeText(item.matchText?.trim() ? item.matchText : item.name);
	if (!needle) return false;
	const haystack = `${normalizeText(tx.description)} ${normalizeText(tx.category)}`;
	if (!haystack.includes(needle)) return false;
	return Math.abs(Math.abs(tx.amount) - item.amount) <= item.amount * tolerance;
}

/**
 * The items that apply to a month, each with its status: realized when a real
 * transaction matches it, paid by hand when the user marked it, expected
 * otherwise. A transaction pays at most one item, the closest in amount.
 */
export function buildOccurrences(params: {
	month: string;
	items: RecurringItemRow[];
	transactions: RealTransaction[];
	/** Item ids marked as paid by hand for this month. */
	paidByHand: ReadonlySet<string>;
	tolerance?: number;
}): RecurringOccurrence[] {
	const { month, paidByHand } = params;
	const tolerance = params.tolerance ?? MATCH_TOLERANCE;
	const active = params.items.filter((item) => isActiveIn(item, month));

	// Pair every item with every transaction that fits, then hand them out from
	// the closest amount to the farthest, so a transaction never goes to a worse
	// match just because its item came first.
	const pairs: { item: RecurringItemRow; tx: RealTransaction; gap: number }[] = [];
	for (const item of active)
		for (const tx of params.transactions)
			if (matchesItem(item, tx, tolerance))
				pairs.push({ item, tx, gap: Math.abs(Math.abs(tx.amount) - item.amount) });
	pairs.sort(
		(a, b) =>
			a.gap - b.gap ||
			a.item.name.localeCompare(b.item.name) ||
			a.item.id.localeCompare(b.item.id) ||
			a.tx.id.localeCompare(b.tx.id),
	);

	const usedTransactions = new Set<string>();
	const matches = new Map<string, RealTransaction>();
	for (const { item, tx } of pairs) {
		if (matches.has(item.id) || usedTransactions.has(tx.id)) continue;
		matches.set(item.id, tx);
		usedTransactions.add(tx.id);
	}

	return active
		.map((item) => {
			const matched = matches.get(item.id) ?? null;
			const status: RecurringStatus = matched
				? "realized"
				: paidByHand.has(item.id)
					? "paid_manual"
					: "expected";
			return {
				...item,
				month,
				dueDate: dueDateFor(month, item.dayOfMonth),
				status,
				matchedTransaction: matched
					? { id: matched.id, date: matched.date, amount: matched.amount }
					: null,
			};
		})
		.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name));
}

export type RecurringSummary = {
	billsPlanned: number;
	billsPending: number;
	incomePlanned: number;
	incomePending: number;
};

/**
 * Planned is what the items add up to; pending is what has not happened yet.
 * Only pending items belong in a projection: the realized ones are already in
 * the real transactions, so counting them again would double the month.
 */
export function summarizeOccurrences(occurrences: RecurringOccurrence[]): RecurringSummary {
	const sum = (kind: RecurringKind, pendingOnly: boolean) =>
		round2(
			occurrences
				.filter((o) => o.kind === kind && (!pendingOnly || o.status === "expected"))
				.reduce((total, o) => total + o.amount, 0),
		);
	return {
		billsPlanned: sum("bill", false),
		billsPending: sum("bill", true),
		incomePlanned: sum("income", false),
		incomePending: sum("income", true),
	};
}
