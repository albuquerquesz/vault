import { PluggyApiError } from "../clients/pluggy";
import type { PluggyCredentials } from "../clients/pluggy/types";
import { env } from "../db/env";
import { createPluggyService } from "./pluggy";

const WEBHOOK_SECRET_HEADER = "x-vault-webhook-secret";

export function getPluggyWebhookUrl(): string {
	if (env.PLUGGY_WEBHOOK_URL) {
		return env.PLUGGY_WEBHOOK_URL;
	}
	const base = env.BETTER_AUTH_URL.replace(/\/$/, "");
	return `${base}/api/webhooks/pluggy`;
}

export function getPluggyWebhookRegistrationHeaders():
	| Record<string, string>
	| undefined {
	if (!env.PLUGGY_WEBHOOK_SECRET) {
		return undefined;
	}
	return {
		"X-Vault-Webhook-Secret": env.PLUGGY_WEBHOOK_SECRET,
	};
}

export function isPluggyWebhookSecretValid(
	headers: Record<string, string | string[] | undefined | unknown>,
): boolean {
	if (!env.PLUGGY_WEBHOOK_SECRET) {
		return true;
	}

	const raw =
		headers[WEBHOOK_SECRET_HEADER] ?? headers["X-Vault-Webhook-Secret"];
	const value = Array.isArray(raw) ? raw[0] : raw;
	return typeof value === "string" && value === env.PLUGGY_WEBHOOK_SECRET;
}

/**
 * Ensure the user's Pluggy application has a client-level webhook pointing
 * at our public receiver. Safe to call repeatedly (ignores already-exists).
 */
export async function ensurePluggyWebhookRegistered(
	creds: PluggyCredentials,
): Promise<{ registered: boolean; id?: string; error?: string }> {
	const url = getPluggyWebhookUrl();

	// Only register publicly reachable HTTPS endpoints (Pluggy rejects localhost).
	if (!url.startsWith("https://")) {
		return {
			registered: false,
			error: "Webhook URL must be HTTPS public; skipping auto-register",
		};
	}

	const service = createPluggyService(creds);
	const headers = getPluggyWebhookRegistrationHeaders();

	try {
		const existing = await service.listWebhooks();
		const already = existing.find(
			(hook) => hook.url === url && (hook.event === "all" || !hook.event),
		);
		if (already) {
			return { registered: true, id: already.id };
		}

		const created = await service.registerWebhook({
			url,
			event: "all",
			headers,
		});
		return { registered: true, id: created.id };
	} catch (error) {
		const message =
			error instanceof PluggyApiError
				? error.message
				: error instanceof Error
					? error.message
					: "Failed to register Pluggy webhook";

		// Duplicate URL/event is fine.
		if (
			message.toLowerCase().includes("already") ||
			message.toLowerCase().includes("exist")
		) {
			return { registered: true, error: message };
		}

		return { registered: false, error: message };
	}
}
