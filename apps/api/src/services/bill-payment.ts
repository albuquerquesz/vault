/**
 * The amount shown as paid for a card bill: whatever the bank reported, or the
 * manual payment, whichever is larger. When the bank catches up with (or passes)
 * the manual payment the bank's number simply wins.
 */
/**
 * Payments made during the cycle. The bank's totalAmount is what was still due
 * at closing, so whatever the full bill (sum of linked purchases) has on top of
 * it was already paid. Never negative.
 */
export function inCyclePaidAmount(params: {
	bankTotal: number;
	fullTotal: number;
}): number {
	const { bankTotal, fullTotal } = params;
	if (!(bankTotal >= 0) || !(fullTotal > bankTotal)) return 0;
	return Math.round((fullTotal - bankTotal) * 100) / 100;
}

export function effectivePaidAmount(params: {
	bankPaid: number;
	billTotal: number;
	/** `undefined` = no manual payment; `null` = the whole bill. */
	manualPaid: number | null | undefined;
}): number {
	const { bankPaid, billTotal, manualPaid } = params;
	if (manualPaid === undefined) return bankPaid;
	const manual = manualPaid === null ? billTotal : manualPaid;
	return Math.max(bankPaid, manual);
}

/** Where the paid amount of a bill comes from. */
export function paidSource(params: {
	bankPaid: number;
	effectivePaid: number;
	hasManualPayment: boolean;
}): "bank" | "manual" {
	return params.hasManualPayment && params.effectivePaid > params.bankPaid
		? "manual"
		: "bank";
}
