import { normalizeText } from "./transaction-search.js";

export type CategoryLimit = {
	category: string;
	targetAmount: number;
};

export type SpendingTransaction = {
	amount: number;
	category: string;
	kind: "income" | "expense";
};

export type CategoryLimitStatus = CategoryLimit & {
	spent: number;
	remaining: number;
	/** Share of the limit already used, 0 to 100 or more. */
	percentUsed: number;
	isOver: boolean;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Spending per category against its limit. Only expenses count (income and the
 * movements the ledger already leaves out are not here), under the category
 * name the user sees, compared without case or accents.
 */
export function calculateCategoryLimits(params: {
	limits: CategoryLimit[];
	transactions: SpendingTransaction[];
}): CategoryLimitStatus[] {
	const spentByKey = new Map<string, number>();
	for (const tx of params.transactions) {
		if (tx.kind !== "expense") continue;
		const key = normalizeText(tx.category);
		spentByKey.set(key, (spentByKey.get(key) ?? 0) + Math.abs(tx.amount));
	}

	return params.limits.map((limit) => {
		const spent = round2(spentByKey.get(normalizeText(limit.category)) ?? 0);
		return {
			...limit,
			spent,
			remaining: round2(limit.targetAmount - spent),
			percentUsed: round2((spent / limit.targetAmount) * 100),
			isOver: spent > limit.targetAmount,
		};
	});
}
