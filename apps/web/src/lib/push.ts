import { apiFetch, queryClient } from "@/utils/api";
import { authClient } from "./auth-client";

const OWNER_KEY = "vault:push-owner";

export function supportsPush() {
	return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function isIosBrowser() {
	return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone() {
	return window.matchMedia("(display-mode: standalone)").matches ||
		(window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export async function currentSubscription() {
	if (!supportsPush()) return null;
	const registration = await navigator.serviceWorker.ready;
	return registration.pushManager.getSubscription();
}

export async function disablePush() {
	const subscription = await currentSubscription();
	if (!subscription) return;
	try {
		await apiFetch<void>("/api/push/subscriptions", {
			method: "DELETE", body: { endpoint: subscription.endpoint },
		});
	} finally {
		await subscription.unsubscribe();
		localStorage.removeItem(OWNER_KEY);
	}
}

export async function rememberPushOwner() {
	const session = await authClient.getSession();
	if (session.data?.user.id) localStorage.setItem(OWNER_KEY, session.data.user.id);
}

export async function reconcilePushOwner() {
	const owner = localStorage.getItem(OWNER_KEY);
	if (!owner) return;
	const session = await authClient.getSession();
	if (session.data?.user.id === owner) return;
	const subscription = await currentSubscription();
	if (subscription) {
		try { await apiFetch<void>("/api/push/subscriptions/device", {
			method: "DELETE", body: subscription.toJSON(),
		}); } catch { /* The subscription will be invalidated locally. */ }
	}
	await subscription?.unsubscribe();
	localStorage.removeItem(OWNER_KEY);
	queryClient.clear();
}

export async function signOut() {
	try { await disablePush(); } catch { /* Sign-out must still complete. */ }
	try { await authClient.signOut(); } finally { localStorage.removeItem(OWNER_KEY); queryClient.clear(); }
}
