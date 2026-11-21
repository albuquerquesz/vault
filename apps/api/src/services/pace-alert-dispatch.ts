import dayjs from "dayjs";
import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import webPush from "web-push";
import { env } from "../db/env.js";
import { db } from "../db/index.js";
import {
	categoryAlertSent,
	monthlyCategoryLimit,
	monthlySpendingGoal,
	pushSubscription,
	type UserSettings,
	user,
} from "../db/schema/index.js";
import { decryptSecret } from "../lib/secret-crypto.js";
import { getMonthlySpent, listFinanceTransactions, getMonthBounds } from "../routers/finance.js";
import { calculateCategoryLimits } from "./category-limits.js";
import {
	buildPaceAlertMessage,
	type CategoryAlert,
	isQuietHours,
	paceClock,
	pendingCategoryAlerts,
	projectMonthEndSpend,
	shouldAlertPace,
} from "./pace-alert.js";
import {
	type BrowserSubscription,
	isExpiredPushError,
	pushAvailable,
} from "./push.js";

export type PaceAlertSender = (
	subscription: BrowserSubscription,
	payload: string,
) => Promise<unknown>;

export type PaceAlertResult = {
	sent: number;
	failed: number;
	skipped?:
		| "quiet_hours"
		| "disabled"
		| "no_subscription"
		| "nothing_due"
		| "already_sent_today"
		| "push_unavailable";
};

const defaultSender: PaceAlertSender = (subscription, payload) =>
	webPush.sendNotification(subscription, payload, { TTL: 3600 });

/**
 * Evaluates and sends the pace alert for one user: at most one push per device
 * per day (Brasília), with the category alerts due folded into the same push.
 * Safe to call any number of times: the day is claimed on the device row and
 * each category threshold on `category_alert_sent` before anything is sent.
 */
export async function sendPaceAlertForUser(params: {
	userId: string;
	now?: dayjs.Dayjs;
	send?: PaceAlertSender;
}): Promise<PaceAlertResult> {
	const now = params.now ?? dayjs();
	const send = params.send ?? defaultSender;
	const { userId } = params;
	const result: PaceAlertResult = { sent: 0, failed: 0 };

	if (isQuietHours(now)) return { ...result, skipped: "quiet_hours" };

	const [row] = await db
		.select({ settings: user.settings })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	if (!(row?.settings as UserSettings | undefined)?.paceAlertsEnabled)
		return { ...result, skipped: "disabled" };

	const subscriptions = await db
		.select({
			hash: pushSubscription.endpointHash,
			secret: pushSubscription.secret,
		})
		.from(pushSubscription)
		.where(eq(pushSubscription.userId, userId));
	if (subscriptions.length === 0) return { ...result, skipped: "no_subscription" };

	const clock = paceClock(now);
	const bounds = getMonthBounds(clock.month);

	const [goal] = await db
		.select({ targetAmount: monthlySpendingGoal.targetAmount })
		.from(monthlySpendingGoal)
		.where(
			and(
				eq(monthlySpendingGoal.userId, userId),
				eq(monthlySpendingGoal.month, clock.month),
			),
		)
		.limit(1);
	const limits = await db
		.select()
		.from(monthlyCategoryLimit)
		.where(
			and(
				eq(monthlyCategoryLimit.userId, userId),
				eq(monthlyCategoryLimit.month, clock.month),
			),
		);
	const target = goal ? Number(goal.targetAmount) : null;
	// No ceiling and no limits: nothing can be at risk, skip the heavy reads.
	if (target === null && limits.length === 0)
		return { ...result, skipped: "nothing_due" };

	let pace: { projected: number; target: number } | null = null;
	if (target !== null) {
		const spent = await getMonthlySpent({ userId, ...bounds });
		const projected = projectMonthEndSpend({
			spent,
			daysElapsed: clock.daysElapsed,
			daysInMonth: clock.daysInMonth,
		});
		if (shouldAlertPace({ projected, target, daysElapsed: clock.daysElapsed }))
			pace = { projected, target };
	}

	let categories: CategoryAlert[] = [];
	if (limits.length > 0) {
		const transactions = await listFinanceTransactions({
			userId,
			month: clock.month,
		});
		const statuses = calculateCategoryLimits({
			limits: limits.map((limit) => ({
				category: limit.category,
				targetAmount: Number(limit.targetAmount),
			})),
			transactions,
		});
		const sentRows = await db
			.select({
				key: categoryAlertSent.categoryKey,
				threshold: categoryAlertSent.threshold,
			})
			.from(categoryAlertSent)
			.where(
				and(
					eq(categoryAlertSent.userId, userId),
					eq(categoryAlertSent.month, clock.month),
				),
			);
		categories = pendingCategoryAlerts({
			limits: statuses,
			sent: new Set(sentRows.map((r) => `${r.key}:${r.threshold}`)),
		});
	}
	if (!pace && categories.length === 0) return { ...result, skipped: "nothing_due" };

	// Claim the day on each device; a repeated call claims nothing and stops here.
	const claimed: { hash: string; secret: string }[] = [];
	for (const sub of subscriptions) {
		const [won] = await db
			.update(pushSubscription)
			.set({ lastPaceAlertDate: clock.today })
			.where(
				and(
					eq(pushSubscription.endpointHash, sub.hash),
					or(
						isNull(pushSubscription.lastPaceAlertDate),
						ne(pushSubscription.lastPaceAlertDate, clock.today),
					),
				),
			)
			.returning({ hash: pushSubscription.endpointHash });
		if (won) claimed.push(sub);
	}
	if (claimed.length === 0) return { ...result, skipped: "already_sent_today" };

	// Claim the category thresholds; a concurrent run that got there first wins them.
	const wonCategories: CategoryAlert[] = [];
	const insertedKeys: { key: string; threshold: number }[] = [];
	for (const alert of categories) {
		const inserted = await db
			.insert(categoryAlertSent)
			.values(
				alert.mark.map((threshold) => ({
					userId,
					month: clock.month,
					categoryKey: alert.categoryKey,
					threshold,
				})),
			)
			.onConflictDoNothing()
			.returning({ threshold: categoryAlertSent.threshold });
		if (inserted.length === 0) continue;
		for (const r of inserted)
			insertedKeys.push({ key: alert.categoryKey, threshold: r.threshold });
		// If another run took the 100 but we got the 80, only the 80 is ours to send.
		const ownThreshold = Math.max(...inserted.map((r) => r.threshold));
		wonCategories.push({ ...alert, threshold: ownThreshold });
	}

	const release = async (devices: typeof claimed) => {
		for (const device of devices)
			await db
				.update(pushSubscription)
				.set({ lastPaceAlertDate: null })
				.where(
					and(
						eq(pushSubscription.endpointHash, device.hash),
						eq(pushSubscription.lastPaceAlertDate, clock.today),
					),
				);
	};

	if (!pace && wonCategories.length === 0) {
		await release(claimed);
		return { ...result, skipped: "nothing_due" };
	}

	const message = buildPaceAlertMessage({ pace, categories: wonCategories });
	const payload = JSON.stringify({ ...message, url: "/spending-goal" });
	const failedDevices: typeof claimed = [];
	for (const device of claimed) {
		try {
			await send(JSON.parse(decryptSecret(device.secret)) as BrowserSubscription, payload);
			result.sent++;
		} catch (error) {
			if (isExpiredPushError(error)) {
				await db
					.delete(pushSubscription)
					.where(eq(pushSubscription.endpointHash, device.hash));
			} else {
				result.failed++;
				failedDevices.push(device);
			}
		}
	}

	// A transient failure on every device must not burn today's alert or the
	// category thresholds; next trigger retries. Partial success keeps them.
	if (result.sent === 0 && failedDevices.length > 0) {
		await release(failedDevices);
		for (const inserted of insertedKeys)
			await db
				.delete(categoryAlertSent)
				.where(
					and(
						eq(categoryAlertSent.userId, userId),
						eq(categoryAlertSent.month, clock.month),
						eq(categoryAlertSent.categoryKey, inserted.key),
						eq(categoryAlertSent.threshold, inserted.threshold),
					),
				);
	} else if (failedDevices.length > 0) {
		await release(failedDevices);
	}
	return result;
}

/** Cron entry: evaluates every user who turned the alerts on. */
export async function sendDuePaceAlerts(now = dayjs()) {
	const vapidSubject = env.VAPID_SUBJECT;
	const vapidPublicKey = env.VAPID_PUBLIC_KEY;
	const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
	if (!pushAvailable || !vapidSubject || !vapidPublicKey || !vapidPrivateKey)
		return { sent: 0, failed: 0, skipped: "push_unavailable" as const };
	if (isQuietHours(now)) return { sent: 0, failed: 0, skipped: "quiet_hours" as const };
	webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
	const users = await db
		.select({ id: user.id })
		.from(user)
		.where(sql`${user.settings}->>'paceAlertsEnabled' = 'true'`);
	let sent = 0;
	let failed = 0;
	for (const row of users) {
		try {
			const outcome = await sendPaceAlertForUser({ userId: row.id, now });
			sent += outcome.sent;
			failed += outcome.failed;
		} catch (error) {
			failed++;
			console.error("[pace-alert] user evaluation failed", error);
		}
	}
	return { sent, failed };
}

/**
 * Hook for the end of a successful sync. Never throws: an alert problem must not
 * turn a good sync into a failed one.
 */
export async function sendPaceAlertAfterSync(userId: string) {
	if (!pushAvailable || !env.VAPID_SUBJECT || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY)
		return;
	try {
		webPush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
		await sendPaceAlertForUser({ userId });
	} catch (error) {
		console.error("[pace-alert] post-sync evaluation failed", error);
	}
}
