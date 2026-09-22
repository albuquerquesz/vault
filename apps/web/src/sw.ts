/// <reference lib="webworker" />
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision?: string }> };

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event) => {
	if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
	if (event.request.mode !== "navigate") return;
	const url = new URL(event.request.url);
	if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
	event.respondWith(fetch(event.request).catch(async () => {
		return (await matchPrecache("/offline.html")) ?? Response.error();
	}));
});

self.addEventListener("push", (event) => {
	let payload: { title?: string; body?: string; url?: string } = {};
	try { payload = event.data?.json() ?? {}; } catch { /* Ignore malformed payloads. */ }
	const url = payload.url?.startsWith("/") && !payload.url.startsWith("//") ? payload.url : "/";
	event.waitUntil(self.registration.showNotification(payload.title ?? "Vault", {
		body: payload.body ?? "Você tem uma nova notificação.",
		icon: "/icons/vault-192-v3.png",
		data: { url },
	}));
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const path = event.notification.data?.url ?? "/";
	const target = new URL(path, self.location.origin).href;
	event.waitUntil((async () => {
		const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
		const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
		if (existing) { await existing.focus(); await existing.navigate(target); }
		else await self.clients.openWindow(target);
	})());
});
