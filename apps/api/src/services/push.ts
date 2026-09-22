import { createHash } from "node:crypto";
import { and, eq, lt, or, isNull } from "drizzle-orm";
import webPush from "web-push";
import { env } from "../common/env.js";
import { db } from "../db/index.js";
import { pushSubscription } from "../db/schema/push-subscription.js";
import { decryptSecret, encryptSecret } from "../lib/secret-crypto.js";

export type BrowserSubscription = {
	endpoint: string;
	expirationTime?: number | null;
	keys: { auth: string; p256dh: string };
};

export const pushAvailable = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);

export function validateSubscription(value: BrowserSubscription): boolean {
	let url: URL;
	try { url = new URL(value.endpoint); } catch { return false; }
	const host = url.hostname.toLowerCase();
	const trustedHost = host === "fcm.googleapis.com" || host === "updates.push.services.mozilla.com" ||
		host === "web.push.apple.com" || host.endsWith(".push.apple.com") ||
		host === "wns.notify.windows.com" || host.endsWith(".notify.windows.com");
	return url.protocol === "https:" && !url.username && !url.password && !url.port &&
		trustedHost && value.endpoint.length <= 2048 &&
		/^[A-Za-z0-9_-]{8,256}$/.test(value.keys.auth) &&
		/^[A-Za-z0-9_-]{40,256}$/.test(value.keys.p256dh);
}

export function endpointHash(endpoint: string): string {
	return createHash("sha256").update(endpoint).digest("hex");
}

export async function savePushSubscription(userId: string, subscription: BrowserSubscription) {
	const hash = endpointHash(subscription.endpoint);
	await db.insert(pushSubscription).values({
		endpointHash: hash, userId, secret: encryptSecret(JSON.stringify(subscription)),
	}).onConflictDoUpdate({ target: pushSubscription.endpointHash, set: {
		userId, secret: encryptSecret(JSON.stringify(subscription)),
	} });
}

export async function deletePushSubscription(userId: string, endpoint: string) {
	await db.delete(pushSubscription).where(and(
		eq(pushSubscription.endpointHash, endpointHash(endpoint)), eq(pushSubscription.userId, userId),
	));
}

/** A device can revoke its old association after an account switch by proving possession of its keys. */
export async function revokeDeviceSubscription(subscription: BrowserSubscription) {
	const hash = endpointHash(subscription.endpoint);
	const row = await db.query.pushSubscription.findFirst({
		where: eq(pushSubscription.endpointHash, hash), columns: { secret: true },
	});
	if (!row) return;
	const stored = JSON.parse(decryptSecret(row.secret)) as BrowserSubscription;
	if (stored.keys.auth !== subscription.keys.auth || stored.keys.p256dh !== subscription.keys.p256dh) return;
	await db.delete(pushSubscription).where(eq(pushSubscription.endpointHash, hash));
}

export async function sendTestPush(userId: string, endpoint: string): Promise<"sent" | "missing" | "rate_limited" | "expired"> {
	const hash = endpointHash(endpoint);
	const cutoff = new Date(Date.now() - 60_000);
	const [row] = await db.update(pushSubscription).set({ lastTestAt: new Date() }).where(and(
		eq(pushSubscription.endpointHash, hash), eq(pushSubscription.userId, userId),
		or(isNull(pushSubscription.lastTestAt), lt(pushSubscription.lastTestAt, cutoff)),
	)).returning({ secret: pushSubscription.secret });
	if (!row) {
		const exists = await db.query.pushSubscription.findFirst({ where: and(
			eq(pushSubscription.endpointHash, hash), eq(pushSubscription.userId, userId),
		), columns: { endpointHash: true } });
		return exists ? "rate_limited" : "missing";
	}
	try {
		webPush.setVapidDetails(env.VAPID_SUBJECT!, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
		await webPush.sendNotification(JSON.parse(decryptSecret(row.secret)) as BrowserSubscription,
			JSON.stringify({ title: "Vault", body: "Notificações ativadas neste dispositivo.", url: "/settings" }),
			{ TTL: 60 });
		return "sent";
	} catch (error) {
		if (isExpiredPushError(error)) {
			await db.delete(pushSubscription).where(and(eq(pushSubscription.endpointHash, hash), eq(pushSubscription.userId, userId)));
			return "expired";
		}
		throw new Error("Push delivery temporarily failed");
	}
}

export function isExpiredPushError(error: unknown): boolean {
	const status = (error as { statusCode?: number } | null)?.statusCode;
	return status === 404 || status === 410;
}
