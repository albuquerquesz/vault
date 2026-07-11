import { env } from "../../db/env";
import type {
	CreatePluggyConnectTokenInput,
	PluggyConnectToken,
	PluggyConnector,
	PluggyTransaction,
} from "./types";

const PLUGGY_API = "https://api.pluggy.ai";

let cachedApiKey: { key: string; expiresAt: number } | null = null;

async function getApiKey(): Promise<string> {
	if (cachedApiKey && Date.now() < cachedApiKey.expiresAt - 60_000) {
		return cachedApiKey.key;
	}

	const res = await fetch(`${PLUGGY_API}/auth`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			clientId: env.PLUGGY_CLIENT_ID,
			clientSecret: env.PLUGGY_CLIENT_SECRET,
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Pluggy auth failed (${res.status}): ${text}`);
	}

	const data = (await res.json()) as { apiKey: string; expiresIn?: number };
	cachedApiKey = {
		key: data.apiKey,
		expiresAt: Date.now() + (data.expiresIn ?? 7200) * 1000,
	};
	return cachedApiKey.key;
}

async function pluggyFetch(
	path: string,
	opts: RequestInit = {},
): Promise<unknown> {
	const apiKey = await getApiKey();
	const res = await fetch(`${PLUGGY_API}${path}`, {
		...opts,
		headers: {
			"Content-Type": "application/json",
			"X-API-KEY": apiKey,
			...opts.headers,
		},
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Pluggy API ${res.status}: ${text}`);
	}

	if (res.status === 204 || res.headers.get("content-length") === "0") {
		return null;
	}

	return res.json();
}

export const pluggyClient = {
	async createConnectToken(
		input: CreatePluggyConnectTokenInput = {},
	): Promise<PluggyConnectToken> {
		const body: Record<string, unknown> = {};

		if (input.itemId) {
			body.itemId = input.itemId;
		}

		if (input.clientUserId) {
			body.options = { clientUserId: input.clientUserId };
		}

		if (input.connectorId) {
			body.connectorId = input.connectorId;
		}

		const data = await pluggyFetch("/connect_token", {
			method: "POST",
			body: JSON.stringify(body),
		});
		return data as PluggyConnectToken;
	},

	async listConnectors(
		countries: string[] = ["BR"],
		isOpenFinance = true,
	): Promise<PluggyConnector[]> {
		const params = new URLSearchParams({
			countries: JSON.stringify(countries),
			isOpenFinance: String(isOpenFinance),
		});
		const response = await pluggyFetch(`/connectors?${params}`);
		const result = (response as { data?: unknown[] }).data ?? [];
		return result as PluggyConnector[];
	},

	async getTransactions(
		itemId: string,
		startDate: string,
		endDate: string,
	): Promise<PluggyTransaction[]> {
		const params = new URLSearchParams({
			start_date: startDate,
			end_date: endDate,
		});
		const response = await pluggyFetch(
			`/items/${itemId}/transactions?${params}`,
		);
		const result = (response as { data?: unknown[] }).data ?? [];
		return result as PluggyTransaction[];
	},

	async deleteItem(itemId: string) {
		await pluggyFetch(`/items/${itemId}`, { method: "DELETE" });
	},

	async registerWebhook(url: string) {
		const data = await pluggyFetch("/webhooks", {
			method: "POST",
			body: JSON.stringify({ url, events: ["item.synced"] }),
		});
		return data as { id: string };
	},

	async deleteWebhook(webhookId: string) {
		await pluggyFetch(`/webhooks/${webhookId}`, { method: "DELETE" });
	},
};
