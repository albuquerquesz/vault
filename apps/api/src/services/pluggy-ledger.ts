import dayjs from "dayjs";
import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	categoryRule,
	pluggyAccounts,
	pluggyItems,
	pluggyTransactions,
	user,
} from "../db/schema/index.js";
import {
	type ClassifiedTransaction,
	classifyPluggyTransactions,
	summarizeClassified,
} from "./pluggy-classification.js";
import {
	type CategoryRuleLike,
	type RuleMatchType,
	resolveDisplayCategory,
} from "./category-rules.js";

export type ClassifiedPluggyRow = {
	id: string;
	pluggyItemId: string;
	pluggyTransactionId: string;
	date: string;
	rawAmount: number;
	category: string | null;
	categoryOverride: string | null;
	/** What the user sees: manual override, then the first matching rule, then `category`. */
	displayCategory: string;
	description: string | null;
	provider: string | null;
	accountId: string | null;
	accountName: string | null;
	accountType: string | null;
	accountSubtype: string | null;
	accountBrand: string | null;
	createdAt: Date;
	classification: ClassifiedTransaction;
};

/** The user's display name, used to spot transfers to/from their own company. */
export async function getOwnerName(userId: string) {
	const [row] = await db
		.select({ name: user.name })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	return row?.name ?? null;
}

/** The user's category rules (all of them; callers pick the enabled ones). */
export async function loadCategoryRules(
	userId: string,
): Promise<CategoryRuleLike[]> {
	const rows = await db
		.select()
		.from(categoryRule)
		.where(eq(categoryRule.userId, userId));
	return rows.map((row) => ({
		id: row.id,
		matchType: row.matchType as RuleMatchType,
		pattern: row.pattern,
		category: row.category,
		priority: row.priority,
		enabled: row.enabled,
		createdAt: row.createdAt,
	}));
}

/** Days loaded beyond the period so transfer legs just outside it still pair. */
const PAIRING_PADDING_DAYS = 3;

/**
 * Visible (not hidden) Pluggy transactions of all the user's accounts,
 * classified as expense / income / refund / ignored. Omit the range to load all.
 */
export async function loadClassifiedPluggyTransactions(params: {
	userId: string;
	start?: string;
	end?: string;
}): Promise<ClassifiedPluggyRow[]> {
	const { userId, start, end } = params;
	const paddedStart = start
		? dayjs(start).subtract(PAIRING_PADDING_DAYS, "day").format("YYYY-MM-DD")
		: undefined;
	const paddedEnd = end
		? dayjs(end).add(PAIRING_PADDING_DAYS, "day").format("YYYY-MM-DD")
		: undefined;

	const rows = await db
		.select({
			id: pluggyTransactions.id,
			pluggyItemId: pluggyTransactions.pluggyItemId,
			pluggyTransactionId: pluggyTransactions.pluggyTransactionId,
			date: pluggyTransactions.date,
			rawAmount: sql<number>`${pluggyTransactions.amount}`.mapWith(Number),
			category: pluggyTransactions.category,
			categoryOverride: pluggyTransactions.categoryOverride,
			description: pluggyTransactions.description,
			provider: pluggyItems.provider,
			accountId: pluggyTransactions.pluggyAccountId,
			accountName: pluggyAccounts.name,
			accountType: pluggyAccounts.type,
			accountSubtype: pluggyAccounts.subtype,
			accountBrand: pluggyAccounts.brand,
			createdAt:
				sql<Date>`coalesce(${pluggyTransactions.createdAt}, now())`.mapWith(
					(value) => new Date(value),
				),
		})
		.from(pluggyTransactions)
		.innerJoin(pluggyItems, eq(pluggyTransactions.pluggyItemId, pluggyItems.id))
		.leftJoin(
			pluggyAccounts,
			eq(pluggyTransactions.pluggyAccountId, pluggyAccounts.id),
		)
		.where(
			and(
				eq(pluggyItems.userId, userId),
				isNull(pluggyTransactions.hiddenAt),
				paddedStart ? gte(pluggyTransactions.date, paddedStart) : undefined,
				paddedEnd ? lte(pluggyTransactions.date, paddedEnd) : undefined,
			),
		);

	const rules = await loadCategoryRules(userId);
	const classified = classifyPluggyTransactions(
		rows.map((row) => ({
			id: row.id,
			date: row.date,
			amount: row.rawAmount,
			category: row.category,
			description: row.description,
			accountType: row.accountType,
			accountId: row.accountId,
		})),
		{ ownerName: await getOwnerName(userId) },
	);

	return rows
		.filter((row) => (!start || row.date >= start) && (!end || row.date <= end))
		.map((row) => ({
			...row,
			displayCategory: resolveDisplayCategory({
				override: row.categoryOverride,
				original: row.category,
				description: row.description,
				rules,
			}),
			classification: classified.get(row.id) ?? {
				kind: "ignored",
				amount: Math.abs(row.rawAmount),
				reason: "unclassified",
			},
		}));
}

/** Pluggy income and net spending of the user in [start, end]. */
export async function getPluggyTotals(params: {
	userId: string;
	start: string;
	end: string;
}) {
	const rows = await loadClassifiedPluggyTransactions(params);
	return summarizeClassified(rows.map((row) => row.classification));
}
