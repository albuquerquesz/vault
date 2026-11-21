import { addMonthsClamped } from "./credit-cards.js";
import { normalizeText } from "./transaction-search.js";

export type InstallmentRow = {
	id: string;
	accountId: string;
	cardName: string | null;
	/** `AAAA-MM-DD`. */
	date: string;
	/** As the card reports it: positive is a purchase. */
	amount: number;
	description: string | null;
	installmentNumber: number | null;
	totalInstallments: number | null;
};

export type InstallmentPlan = {
	name: string;
	cardName: string | null;
	accountId: string;
	totalInstallments: number;
	/** The last installment seen so far. */
	lastNumber: number;
	lastDate: string;
	installmentAmount: number;
	remainingInstallments: number;
	remainingAmount: number;
	/** The last date moved one month ahead; null once the plan is complete. */
	nextExpectedDate: string | null;
	isComplete: boolean;
};

export type UpcomingMonth = {
	month: string;
	total: number;
	count: number;
	items: { name: string; cardName: string | null; installmentNumber: number; totalInstallments: number; amount: number }[];
};

/** An installment posts about a month after the previous one. */
const MONTHS_BETWEEN = 1;
/** A plan whose last installment is older than this is taken as stopped (cancelled, refunded). */
export const STALE_AFTER_DAYS = 62;
/** A later installment may differ from the last one by rounding only. */
const AMOUNT_TOLERANCE = 0.1;

const round2 = (value: number) => Math.round(value * 100) / 100;
const SUFFIX = /\s*(\d{1,2})\/(\d{1,2})\s*$/;

function isValid(number: number, total: number) {
	return Number.isInteger(number) && Number.isInteger(total) && total >= 2 && total <= 60 && number >= 1 && number <= total;
}

/**
 * Which installment a transaction is. The card's structured fields win; the
 * "n/m" at the end of the description is the fallback for rows without them.
 */
export function installmentOf(row: Pick<InstallmentRow, "description" | "installmentNumber" | "totalInstallments">): { number: number; total: number } | null {
	if (row.installmentNumber != null && row.totalInstallments != null && isValid(row.installmentNumber, row.totalInstallments)) {
		return { number: row.installmentNumber, total: row.totalInstallments };
	}
	const match = SUFFIX.exec(row.description ?? "");
	if (!match) return null;
	const number = Number(match[1]);
	const total = Number(match[2]);
	return isValid(number, total) ? { number, total } : null;
}

/** The merchant without the "n/m" suffix. */
export function baseName(description: string | null): string {
	return (description ?? "").replace(SUFFIX, "").trim();
}

function daysBetween(from: string, to: string): number {
	return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/**
 * Chains the installments of each purchase. Rows of one merchant, card and total
 * can belong to different purchases (Steam 1/3, 2/3, 3/3 and then another 1/3, 2/3),
 * so an installment joins the open plan that is waiting for exactly that number,
 * the one with the closest amount, and otherwise starts a plan of its own.
 */
export function buildInstallmentPlans(rows: InstallmentRow[]): InstallmentPlan[] {
	type Chain = { name: string; cardName: string | null; accountId: string; total: number; lastNumber: number; lastDate: string; lastAmount: number };
	const chainsByGroup = new Map<string, Chain[]>();
	const all: Chain[] = [];

	const ordered = rows
		.filter((row) => row.amount > 0)
		.map((row) => ({ row, info: installmentOf(row) }))
		.filter((entry): entry is { row: InstallmentRow; info: { number: number; total: number } } => entry.info !== null)
		.sort((a, b) => a.row.date.localeCompare(b.row.date) || a.info.number - b.info.number || a.row.id.localeCompare(b.row.id));

	for (const { row, info } of ordered) {
		const name = baseName(row.description);
		const key = `${row.accountId}|${normalizeText(name)}|${info.total}`;
		const chains = chainsByGroup.get(key) ?? [];
		chainsByGroup.set(key, chains);

		const waiting = chains
			.filter((chain) => chain.lastNumber === info.number - 1 && chain.lastNumber < chain.total)
			.filter((chain) => Math.abs(row.amount - chain.lastAmount) <= chain.lastAmount * AMOUNT_TOLERANCE)
			.sort((a, b) => Math.abs(row.amount - a.lastAmount) - Math.abs(row.amount - b.lastAmount));
		const chain = info.number > 1 ? waiting[0] : undefined;

		if (chain) {
			chain.lastNumber = info.number;
			chain.lastDate = row.date;
			chain.lastAmount = row.amount;
		} else {
			const created: Chain = { name, cardName: row.cardName, accountId: row.accountId, total: info.total, lastNumber: info.number, lastDate: row.date, lastAmount: row.amount };
			chains.push(created);
			all.push(created);
		}
	}

	return all.map((chain) => {
		const remaining = chain.total - chain.lastNumber;
		const isComplete = remaining === 0;
		return {
			name: chain.name,
			cardName: chain.cardName,
			accountId: chain.accountId,
			totalInstallments: chain.total,
			lastNumber: chain.lastNumber,
			lastDate: chain.lastDate,
			installmentAmount: round2(chain.lastAmount),
			remainingInstallments: remaining,
			remainingAmount: round2(remaining * chain.lastAmount),
			nextExpectedDate: isComplete ? null : addMonthsClamped(chain.lastDate, MONTHS_BETWEEN),
			isComplete,
		};
	});
}

/** Plans still running: not complete, and an installment posted recently. */
export function activePlans(plans: InstallmentPlan[], today: string): InstallmentPlan[] {
	return plans
		.filter((plan) => !plan.isComplete && daysBetween(plan.lastDate, today) <= STALE_AFTER_DAYS)
		.sort((a, b) => (a.nextExpectedDate ?? "").localeCompare(b.nextExpectedDate ?? "") || a.name.localeCompare(b.name));
}

/** What the remaining installments add up to in each of the next months (the current one included). */
export function projectUpcoming(plans: InstallmentPlan[], today: string, months: number): UpcomingMonth[] {
	const first = today.slice(0, 7);
	const last = addMonthsClamped(`${first}-01`, months - 1).slice(0, 7);
	const byMonth = new Map<string, UpcomingMonth>();
	for (const plan of plans) {
		for (let step = 1; step <= plan.remainingInstallments; step += 1) {
			const month = addMonthsClamped(plan.lastDate, step * MONTHS_BETWEEN).slice(0, 7);
			// An installment already due earlier this month still counts for this month.
			const bucket = month < first ? first : month;
			if (bucket > last) continue;
			const entry = byMonth.get(bucket) ?? { month: bucket, total: 0, count: 0, items: [] };
			entry.total = round2(entry.total + plan.installmentAmount);
			entry.count += 1;
			entry.items.push({
				name: plan.name,
				cardName: plan.cardName,
				installmentNumber: plan.lastNumber + step,
				totalInstallments: plan.totalInstallments,
				amount: plan.installmentAmount,
			});
			byMonth.set(bucket, entry);
		}
	}
	return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}
