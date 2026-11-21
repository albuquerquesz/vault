/** Lowercase, accent-free, trimmed text for comparing descriptions and categories. */
export function normalizeText(value: string | null | undefined): string {
	return (value ?? "")
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim();
}

export type SearchableTransaction = {
	date: string;
	/** Signed: negative is money out. */
	amount: number;
	category: string;
	description: string | null;
	kind: "income" | "expense";
};

export type TransactionSearchFilters = {
	q?: string;
	/** Compared against the absolute amount, in reais. */
	minAmount?: number;
	maxAmount?: number;
	category?: string;
	kind?: "income" | "expense";
};

export function matchesTransactionSearch(
	tx: SearchableTransaction,
	filters: TransactionSearchFilters,
): boolean {
	const { q, minAmount, maxAmount, category, kind } = filters;
	const absolute = Math.abs(tx.amount);

	if (kind && tx.kind !== kind) return false;
	if (minAmount !== undefined && absolute < minAmount) return false;
	if (maxAmount !== undefined && absolute > maxAmount) return false;
	if (category && normalizeText(tx.category) !== normalizeText(category))
		return false;
	if (q) {
		const needle = normalizeText(q);
		const haystack = `${normalizeText(tx.description)} ${normalizeText(tx.category)}`;
		if (!haystack.includes(needle)) return false;
	}
	return true;
}

/** Cursor is the offset of the next row, as a string. */
export function paginate<T>(
	rows: T[],
	params: { limit: number; cursor?: string },
): { page: T[]; total: number; nextCursor: string | null } {
	const offset = Math.max(Number.parseInt(params.cursor ?? "0", 10) || 0, 0);
	const page = rows.slice(offset, offset + params.limit);
	const next = offset + page.length;
	return {
		page,
		total: rows.length,
		nextCursor: next < rows.length ? String(next) : null,
	};
}
