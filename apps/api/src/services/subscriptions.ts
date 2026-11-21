import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { and, eq, gte, lte, not } from "drizzle-orm";
import { db } from "../db/index.js";
import { expense } from "../db/schema/index.js";
import { signedAmount } from "./pluggy-classification.js";
import { loadClassifiedPluggyTransactions } from "./pluggy-ledger.js";
import {
	detectSubscriptions,
	SUBSCRIPTION_WINDOW_MONTHS,
	type SubscriptionCandidate,
	type SubscriptionsResult,
} from "./subscription-detection.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export type {
	Subscription,
	SubscriptionsResult,
} from "./subscription-detection.js";

export function todayInSaoPaulo(now = dayjs()) {
	return now.tz("America/Sao_Paulo").format("YYYY-MM-DD");
}

/** Loads the user's recent spending (bank and manual) and detects subscriptions. */
export async function listCurrentSubscriptions(params: {
	userId: string;
	today?: string;
}): Promise<SubscriptionsResult> {
	const today = params.today ?? todayInSaoPaulo();
	const start = dayjs(today)
		.subtract(SUBSCRIPTION_WINDOW_MONTHS, "month")
		.format("YYYY-MM-DD");

	const [pluggyRows, manualRows] = await Promise.all([
		loadClassifiedPluggyTransactions({
			userId: params.userId,
			start,
			end: today,
		}),
		db
			.select()
			.from(expense)
			.where(
				and(
					eq(expense.userId, params.userId),
					eq(expense.kind, "expense"),
					not(eq(expense.source, "pluggy")),
					gte(expense.expenseDate, start),
					lte(expense.expenseDate, today),
				),
			),
	]);

	const candidates: SubscriptionCandidate[] = [
		...pluggyRows
			// Own-money movements and refunds are not charges.
			.filter((row) => row.classification.kind === "expense")
			.filter((row) => row.date >= start && row.date <= today)
			.map<SubscriptionCandidate>((row) => ({
				date: row.date,
				amount: Math.abs(signedAmount(row.classification)),
				description: row.description,
				category: row.displayCategory,
				accountName: row.accountName,
				source: "pluggy",
			})),
		...manualRows.map<SubscriptionCandidate>((row) => ({
			date: row.expenseDate,
			amount: Number(row.amount),
			description: row.note,
			category: row.category,
			accountName: row.sourceAccountName,
			source: "cash",
		})),
	];

	return detectSubscriptions(candidates, today);
}
