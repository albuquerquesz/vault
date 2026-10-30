import dayjs from "dayjs";
import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	pluggyAccounts,
	pluggyItems,
	pluggyTransactions,
} from "../db/schema/index.js";
import {
	type ClassifiedTransaction,
	classifyPluggyTransactions,
	summarizeClassified,
} from "./pluggy-classification.js";

export type ClassifiedPluggyRow = {
	id: string;
	pluggyItemId: string;
	pluggyTransactionId: string;
	date: string;
	rawAmount: number;
	category: string | null;
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
	);

	return rows
		.filter((row) => (!start || row.date >= start) && (!end || row.date <= end))
		.map((row) => ({
			...row,
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
