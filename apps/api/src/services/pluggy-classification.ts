/**
 * Turns raw Pluggy transactions into what they mean for the user's money.
 *
 * Pluggy signs differ by account: on BANK accounts negative = money out, on
 * CREDIT (card) accounts positive = purchase and negative = payment/refund.
 * Money that only moves between the user's own accounts (transfers, savings,
 * investments, paying the card bill) is neither income nor spending.
 */

export type PluggyTransactionKind = "expense" | "income" | "refund" | "ignored";

export type ClassifiableTransaction = {
	id: string;
	date: string; // YYYY-MM-DD
	amount: number; // raw Pluggy amount
	category: string | null;
	description: string | null;
	accountType: string | null; // BANK | CREDIT
	accountId: string | null;
};

export type ClassifiedTransaction = {
	kind: PluggyTransactionKind;
	/** Always positive. */
	amount: number;
	reason: string;
};

/** Own-money movements in either direction. */
const INTERNAL_CATEGORIES = new Set([
	"Same person transfer",
	"Transfer - Internal",
	"Investments",
	"Credit card payment",
]);

const CARD_BILL_PAYMENT =
	/pagamento\s+(d[ea]\s+)?fatura|pagamento\s+(d[oe]\s+)?cart[aã]o|pagamento recebido/i;
const REFUND = /estorno|reembolso|devolu[cç][aã]o|cashback/i;

/** Max days between the two legs of a transfer between own accounts. */
const TRANSFER_PAIR_WINDOW_DAYS = 2;

function dayNumber(date: string) {
	return Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

function cents(amount: number) {
	return Math.round(Math.abs(amount) * 100);
}

function isCard(tx: ClassifiableTransaction) {
	return tx.accountType === "CREDIT";
}

/**
 * Pairs an outflow in one own bank account with an equal inflow in another
 * within a couple of days (e.g. PIX from Nubank to Mercado Pago).
 */
function findInternalTransferPairs(txs: ClassifiableTransaction[]) {
	const paired = new Set<string>();
	const inflowsByCents = new Map<number, ClassifiableTransaction[]>();
	for (const tx of txs) {
		if (isCard(tx) || tx.amount <= 0 || !tx.accountId) continue;
		const bucket = inflowsByCents.get(cents(tx.amount)) ?? [];
		bucket.push(tx);
		inflowsByCents.set(cents(tx.amount), bucket);
	}

	for (const out of txs) {
		if (isCard(out) || out.amount >= 0 || !out.accountId) continue;
		let best: ClassifiableTransaction | undefined;
		let bestGap = Number.POSITIVE_INFINITY;
		for (const inflow of inflowsByCents.get(cents(out.amount)) ?? []) {
			if (paired.has(inflow.id) || inflow.accountId === out.accountId) continue;
			const gap = Math.abs(dayNumber(inflow.date) - dayNumber(out.date));
			if (gap <= TRANSFER_PAIR_WINDOW_DAYS && gap < bestGap) {
				best = inflow;
				bestGap = gap;
			}
		}
		if (best) {
			paired.add(out.id);
			paired.add(best.id);
		}
	}
	return paired;
}

function isCardBillPaymentOnCard(tx: ClassifiableTransaction) {
	return (
		isCard(tx) &&
		tx.amount < 0 &&
		(tx.category?.trim() === "Credit card payment" ||
			CARD_BILL_PAYMENT.test(tx.description ?? ""))
	);
}

/**
 * Bank outflows that match a payment received by a connected card (same
 * amount, within a couple of days), e.g. a PIX to "Mercado Pago" that pays
 * the Mercado Pago card bill.
 */
function findCardBillPayments(txs: ClassifiableTransaction[]) {
	const payments = new Map<number, ClassifiableTransaction[]>();
	for (const tx of txs) {
		if (!isCardBillPaymentOnCard(tx)) continue;
		const bucket = payments.get(cents(tx.amount)) ?? [];
		bucket.push(tx);
		payments.set(cents(tx.amount), bucket);
	}

	const used = new Set<string>();
	const billPayments = new Set<string>();
	for (const out of txs) {
		if (isCard(out) || out.amount >= 0) continue;
		const match = (payments.get(cents(out.amount)) ?? []).find(
			(payment) =>
				!used.has(payment.id) &&
				Math.abs(dayNumber(payment.date) - dayNumber(out.date)) <=
					TRANSFER_PAIR_WINDOW_DAYS,
		);
		if (match) {
			used.add(match.id);
			billPayments.add(out.id);
		}
	}
	return billPayments;
}

function normalizeName(text: string) {
	return text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * True when the counterpart carries the user's full name, e.g. the user's own
 * account at an unconnected bank or their company. Single-word names are
 * skipped (too broad).
 */
function mentionsOwner(description: string, ownerNames: string[]) {
	if (ownerNames.length === 0 || !description) return false;
	const text = normalizeName(description);
	return ownerNames.some((name) => text.includes(name));
}

/** CNPJ root ("66.390.189") or full CNPJ, which marks a company counterpart. */
const CNPJ = /\b\d{2}\.\d{3}\.\d{3}\b|\b\d{14}\b/;

/** The user's own company (MEI/PJ): their full name next to a CNPJ. */
function isOwnerCompany(tx: ClassifiableTransaction, ownerNames: string[]) {
	const description = tx.description ?? "";
	return (
		!isCard(tx) &&
		CNPJ.test(description) &&
		mentionsOwner(description, ownerNames)
	);
}

/**
 * Money sent back to the company that matches a payout (same amount, within a
 * couple of days) cancels it out, e.g. PJ pays 1.640 twice and PF returns one.
 */
function findOwnerCompanyRoundTrips(companyTxs: ClassifiableTransaction[]) {
	const roundTrips = new Set<string>();
	const payouts = companyTxs.filter((tx) => tx.amount > 0);
	for (const back of companyTxs) {
		if (back.amount >= 0) continue;
		const payout = payouts.find(
			(tx) =>
				!roundTrips.has(tx.id) &&
				cents(tx.amount) === cents(back.amount) &&
				Math.abs(dayNumber(tx.date) - dayNumber(back.date)) <=
					TRANSFER_PAIR_WINDOW_DAYS,
		);
		if (payout) {
			roundTrips.add(payout.id);
			roundTrips.add(back.id);
		}
	}
	return roundTrips;
}

function classifyOne(
	tx: ClassifiableTransaction,
	pairedTransfers: Set<string>,
	cardBillPayments: Set<string>,
	ownerNames: string[],
	ownerCompany: { ids: Set<string>; roundTrips: Set<string> },
): ClassifiedTransaction {
	const amount = Math.abs(tx.amount);
	const category = tx.category?.trim() ?? "";
	const description = tx.description ?? "";

	if (!Number.isFinite(tx.amount) || tx.amount === 0) {
		return { kind: "ignored", amount, reason: "zero_amount" };
	}
	// What the user's company pays them (PJ -> PF) is personal income; sending
	// money to the company is not personal spending.
	if (ownerCompany.ids.has(tx.id)) {
		if (ownerCompany.roundTrips.has(tx.id)) {
			return { kind: "ignored", amount, reason: "owner_company_round_trip" };
		}
		return tx.amount > 0
			? { kind: "income", amount, reason: "owner_company_payout" }
			: { kind: "ignored", amount, reason: "owner_company_transfer" };
	}
	if (INTERNAL_CATEGORIES.has(category)) {
		return { kind: "ignored", amount, reason: "internal_category" };
	}

	if (isCard(tx)) {
		if (CARD_BILL_PAYMENT.test(description)) {
			return { kind: "ignored", amount, reason: "card_bill_payment" };
		}
		return tx.amount > 0
			? { kind: "expense", amount, reason: "card_purchase" }
			: { kind: "refund", amount, reason: "card_credit" };
	}

	if (pairedTransfers.has(tx.id)) {
		return { kind: "ignored", amount, reason: "own_account_transfer" };
	}
	if (mentionsOwner(description, ownerNames)) {
		return { kind: "ignored", amount, reason: "owner_name_transfer" };
	}
	if (tx.amount < 0) {
		// The card's purchases are counted on the card; paying the bill is not spending.
		if (CARD_BILL_PAYMENT.test(description) || cardBillPayments.has(tx.id)) {
			return { kind: "ignored", amount, reason: "card_bill_payment" };
		}
		return { kind: "expense", amount, reason: "bank_outflow" };
	}
	if (REFUND.test(description)) {
		return { kind: "refund", amount, reason: "bank_refund" };
	}
	return { kind: "income", amount, reason: "bank_inflow" };
}

/**
 * Classifies a batch. Pass every visible transaction around the period of
 * interest (all of the user's accounts) so transfer pairs can be matched.
 * `ownerName` (the user's full name) marks transfers with the user's own
 * accounts as internal and payouts from their company (name + CNPJ) as income.
 */
export function classifyPluggyTransactions(
	txs: ClassifiableTransaction[],
	options: { ownerName?: string | null } = {},
): Map<string, ClassifiedTransaction> {
	const owner = normalizeName(options.ownerName ?? "");
	const ownerNames = owner.split(" ").length >= 2 ? [owner] : [];
	const companyTxs = txs.filter((tx) => isOwnerCompany(tx, ownerNames));
	const ownerCompany = {
		ids: new Set(companyTxs.map((tx) => tx.id)),
		roundTrips: findOwnerCompanyRoundTrips(companyTxs),
	};
	// Card bill payments first, so they are not mistaken for transfer legs.
	const cardBillPayments = findCardBillPayments(txs);
	const pairedTransfers = findInternalTransferPairs(
		txs.filter(
			(tx) => !cardBillPayments.has(tx.id) && !ownerCompany.ids.has(tx.id),
		),
	);
	return new Map(
		txs.map((tx) => [
			tx.id,
			classifyOne(
				tx,
				pairedTransfers,
				cardBillPayments,
				ownerNames,
				ownerCompany,
			),
		]),
	);
}

/** Income and net spending (expenses minus refunds) of classified transactions. */
export function summarizeClassified(
	classified: Iterable<ClassifiedTransaction>,
): { income: number; spent: number } {
	let income = 0;
	let spent = 0;
	for (const tx of classified) {
		if (tx.kind === "income") income += tx.amount;
		else if (tx.kind === "expense") spent += tx.amount;
		else if (tx.kind === "refund") spent -= tx.amount;
	}
	return { income, spent: Math.max(0, spent) };
}

/** Signed amount for display: negative for spending, positive otherwise. */
export function signedAmount(tx: ClassifiedTransaction) {
	return tx.kind === "expense" ? -tx.amount : tx.amount;
}
