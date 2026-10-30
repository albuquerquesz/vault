import dayjs from "dayjs";
import {
	and,
	eq,
	sum,
} from "drizzle-orm";
import webPush from "web-push";
import { env } from "../db/env.js";
import { db } from "../db/index.js";
import {
	expense,
	pushSubscription,
	type UserSettings,
	user,
} from "../db/schema/index.js";
import { decryptSecret } from "../lib/secret-crypto.js";
import { getDueDailySummaryDate } from "./daily-summary-time.js";
import { getPluggyTotals } from "./pluggy-ledger.js";
import {
	type BrowserSubscription,
	isExpiredPushError,
	pushAvailable,
} from "./push.js";

export async function sendDueDailySummaries(now = dayjs()) {
	const vapidSubject = env.VAPID_SUBJECT;
	const vapidPublicKey = env.VAPID_PUBLIC_KEY;
	const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
	if (!pushAvailable || !vapidSubject || !vapidPublicKey || !vapidPrivateKey)
		return { sent: 0, failed: 0, skipped: "push_unavailable" as const };
	webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
	const users = await db
		.select({ id: user.id, settings: user.settings })
		.from(user);
	let sent = 0;
	let failed = 0;
	for (const row of users) {
		const settings = (row.settings ?? {}) as UserSettings;
		if (!settings.dailySummaryEnabled) continue;
		const today = getDueDailySummaryDate(now);
		if (!today) continue;
		const start = today;
		const [manualOut, manualIn, bank, subscriptions] = await Promise.all([
			db
				.select({ amount: sum(expense.amount).mapWith(Number) })
				.from(expense)
				.where(
					and(
						eq(expense.userId, row.id),
						eq(expense.source, "cash"),
						eq(expense.kind, "expense"),
						eq(expense.expenseDate, today),
					),
				),
			db
				.select({ amount: sum(expense.amount).mapWith(Number) })
				.from(expense)
				.where(
					and(
						eq(expense.userId, row.id),
						eq(expense.source, "cash"),
						eq(expense.kind, "income"),
						eq(expense.expenseDate, today),
					),
				),
			getPluggyTotals({ userId: row.id, start, end: today }),
			db
				.select({
					hash: pushSubscription.endpointHash,
					secret: pushSubscription.secret,
					lastSent: pushSubscription.lastDailySummaryDate,
				})
				.from(pushSubscription)
				.where(eq(pushSubscription.userId, row.id)),
		]);
		const income = (manualIn[0]?.amount ?? 0) + bank.income;
		const spent = (manualOut[0]?.amount ?? 0) + bank.spent;
		const money = (amount: number) =>
			new Intl.NumberFormat("pt-BR", {
				style: "currency",
				currency: "BRL",
			}).format(amount);
		const payload = JSON.stringify({
			title: "Resumo financeiro de hoje",
			body: `Entrou ${money(income)} · Saiu ${money(spent)}`,
			url: "/",
		});
		if (subscriptions.length === 0) continue;
		for (const subscription of subscriptions) {
			if (subscription.lastSent === today) continue;
			try {
				await webPush.sendNotification(
					JSON.parse(decryptSecret(subscription.secret)) as BrowserSubscription,
					payload,
					{ TTL: 3600 },
				);
				await db
					.update(pushSubscription)
					.set({ lastDailySummaryDate: today })
					.where(eq(pushSubscription.endpointHash, subscription.hash));
				sent++;
			} catch (error) {
				if (isExpiredPushError(error))
					await db
						.delete(pushSubscription)
						.where(eq(pushSubscription.endpointHash, subscription.hash));
				else failed++;
			}
		}
	}
	return { sent, failed };
}
