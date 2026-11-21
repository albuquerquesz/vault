/**
 * Temporary diagnostics: describes the SHAPE of what Pluggy returns for credit
 * cards (which fields exist, whether they are filled, how many rows) so we can
 * see what the MeuPluggy connector sends. It never includes a value: no amounts,
 * names, descriptions or ids, only keys, presence, counts and day differences.
 */

export type Presence = "set" | "null" | "absent";

const DAY_MS = 24 * 60 * 60 * 1000;

function asRecord(value: unknown): Record<string, unknown> {
	return value !== null && typeof value === "object"
		? (value as Record<string, unknown>)
		: {};
}

export function presence(
	value: unknown,
	keys: readonly string[],
): Record<string, Presence> {
	const record = asRecord(value);
	return Object.fromEntries(
		keys.map((key) => [
			key,
			!(key in record) ? "absent" : record[key] === null ? "null" : "set",
		]),
	);
}

function parseDate(value: unknown): Date | null {
	if (typeof value !== "string") return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function dayDiff(from: unknown, to: unknown): number | null {
	const a = parseDate(from);
	const b = parseDate(to);
	return a && b ? Math.round((b.getTime() - a.getTime()) / DAY_MS) : null;
}

const CREDIT_DATA_KEYS = [
	"level",
	"brand",
	"balanceCloseDate",
	"balanceDueDate",
	"availableCreditLimit",
	"balanceForeignCurrency",
	"minimumPayment",
	"creditLimit",
	"isLimitFlexible",
	"status",
	"holderType",
	"disaggregatedCreditLimits",
	"additionalCards",
] as const;

/** The first CREDIT account of an /accounts response. */
export function describeCreditAccounts(results: unknown[], now = new Date()) {
	const credit = results.filter((row) => asRecord(row).type === "CREDIT");
	const first = asRecord(credit[0]);
	const creditData = asRecord(first.creditData);
	const closeDate = parseDate(creditData.balanceCloseDate);
	const dueDate = parseDate(creditData.balanceDueDate);
	return {
		accounts: results.length,
		creditAccounts: credit.length,
		topKeys: Object.keys(first).sort(),
		creditDataKeys: Object.keys(creditData).sort(),
		creditData: presence(creditData, CREDIT_DATA_KEYS),
		closeToDueDays: dayDiff(creditData.balanceCloseDate, creditData.balanceDueDate),
		closeInFuture: closeDate ? closeDate.getTime() > now.getTime() : null,
		dueInFuture: dueDate ? dueDate.getTime() > now.getTime() : null,
	};
}

const BILL_KEYS = [
	"dueDate",
	"billClosingDate",
	"totalAmount",
	"minimumPaymentAmount",
	"allowsInstallments",
	"financeCharges",
	"payments",
] as const;

/** An /bills response: whether a closing date comes and whether any bill is still to be due. */
export function describeBills(results: unknown[], now = new Date()) {
	const dated = results
		.map((row) => ({ row: asRecord(row), due: parseDate(asRecord(row).dueDate) }))
		.sort((a, b) => (b.due?.getTime() ?? 0) - (a.due?.getTime() ?? 0));
	const latest = dated[0]?.row ?? {};
	return {
		count: results.length,
		keys: Object.keys(latest).sort(),
		latest: presence(latest, BILL_KEYS),
		latestDueMonth: dated[0]?.due ? dated[0].due.toISOString().slice(0, 7) : null,
		latestClosingToDueDays: dayDiff(latest.billClosingDate, latest.dueDate),
		dueAfterNow: dated.filter((item) => item.due && item.due.getTime() > now.getTime()).length,
		withClosingDate: dated.filter((item) => item.row.billClosingDate != null).length,
		withMinimumPayment: dated.filter((item) => item.row.minimumPaymentAmount != null).length,
		latestFinanceCharges: Array.isArray(latest.financeCharges) ? latest.financeCharges.length : null,
		latestPayments: Array.isArray(latest.payments) ? latest.payments.length : null,
	};
}

const METADATA_KEYS = [
	"installmentNumber",
	"totalInstallments",
	"totalAmount",
	"billId",
	"payeeMCC",
	"cardNumber",
] as const;

/** Credit card transactions: whether installment metadata comes and whether any row is future dated. */
export function describeCardTransactions(rows: unknown[], today = new Date()) {
	const todayText = today.toISOString().slice(0, 10);
	const withMetadata = rows.filter((row) => asRecord(asRecord(row).creditCardMetadata) !== null && asRecord(row).creditCardMetadata != null);
	const metadataKeys = new Set<string>();
	const filled: Record<string, number> = Object.fromEntries(METADATA_KEYS.map((key) => [key, 0]));
	for (const row of withMetadata) {
		const metadata = asRecord(asRecord(row).creditCardMetadata);
		for (const key of Object.keys(metadata)) metadataKeys.add(key);
		for (const key of METADATA_KEYS) if (metadata[key] != null) filled[key] = (filled[key] ?? 0) + 1;
	}
	return {
		rows: rows.length,
		withCreditCardMetadata: withMetadata.length,
		metadataKeys: [...metadataKeys].sort(),
		metadataFilledRows: filled,
		futureDated: rows.filter((row) => {
			const date = asRecord(row).date;
			return typeof date === "string" && date.slice(0, 10) > todayText;
		}).length,
		// Rows whose text ends in "n/m", to compare with the structured installment fields.
		descriptionEndsInInstallment: rows.filter((row) => {
			const text = asRecord(row).description;
			return typeof text === "string" && /\d{1,2}\/\d{1,2}\s*$/.test(text);
		}).length,
	};
}

/** Logs a described shape; diagnostics must never break a sync. */
export function logShape(what: string, build: () => Record<string, unknown>) {
	try {
		console.info("[pluggy-shape]", { what, ...build() });
	} catch {
		// Ignore: this is only a diagnostic.
	}
}
