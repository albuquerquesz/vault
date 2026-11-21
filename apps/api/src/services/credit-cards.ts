const round2 = (value: number) => Math.round(value * 100) / 100;

/** `AAAA-MM-DD` of a date, in UTC: the bank sends midnight UTC for a plain date. */
export function dateOnly(value: Date | null | undefined): string | null {
	return value ? value.toISOString().slice(0, 10) : null;
}

/** Adds months keeping the day; a day past the end of the month falls on its last day. */
export function addMonthsClamped(date: string, months: number): string {
	const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
	const target = new Date(Date.UTC(year, month - 1 + months, 1));
	const lastDay = new Date(
		Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
	).getUTCDate();
	target.setUTCDate(Math.min(day, lastDay));
	return target.toISOString().slice(0, 10);
}

export type CardLimit = {
	total: number;
	available: number;
	used: number;
	/** Share of the limit in use, 0 to 100. */
	usedPercent: number;
};

/** The limit, what is left and what is in use; null when the card reports no limit. */
export function summarizeLimit(
	total: number | null | undefined,
	available: number | null | undefined,
): CardLimit | null {
	if (total == null || available == null || total <= 0) return null;
	const used = Math.max(round2(total - available), 0);
	return {
		total: round2(total),
		available: round2(available),
		used,
		usedPercent: round2((used / total) * 100),
	};
}

export type OpenBillEstimate = {
	/** Sum of the card's purchases that no closed bill has taken yet. */
	estimatedTotal: number;
	transactionCount: number;
	/** The last bill's dates moved one month ahead; null when they are unknown. */
	estimatedClosingDate: string | null;
	estimatedDueDate: string | null;
	isEstimate: true;
};

/**
 * The bill that has not closed yet. Pluggy never returns it, so it is built from
 * the card's transactions that no bill claimed (no billId) and, for the dates,
 * from the last closed bill moved one month ahead.
 */
export function estimateOpenBill(params: {
	lastDueDate: string | null;
	lastClosingDate: string | null;
	unbilledTotal: number;
	unbilledCount: number;
}): OpenBillEstimate | null {
	const { lastDueDate, lastClosingDate, unbilledTotal, unbilledCount } = params;
	if (!lastDueDate && unbilledCount === 0) return null;
	return {
		estimatedTotal: round2(unbilledTotal),
		transactionCount: unbilledCount,
		estimatedClosingDate: lastClosingDate ? addMonthsClamped(lastClosingDate, 1) : null,
		estimatedDueDate: lastDueDate ? addMonthsClamped(lastDueDate, 1) : null,
		isEstimate: true,
	};
}
