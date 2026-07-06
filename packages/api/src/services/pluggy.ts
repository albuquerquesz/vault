import { env } from "../db/env";

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

export interface PluggyConnectToken {
	accessToken: string;
}

export interface PluggyTransaction {
	id: string;
	date: string;
	amount: number;
	description?: string;
	category?: string;
}

export const pluggyService = {
	async createConnectToken(): Promise<PluggyConnectToken> {
		const data = await pluggyFetch("/connect_token", {
			method: "POST",
			body: JSON.stringify({}),
		});
		return data as PluggyConnectToken;
	},

	async createItem({
		connect_token,
		provider,
	}: {
		connect_token: string;
		provider?: string;
	}) {
		const body: Record<string, unknown> = { connect_token };
		if (provider) body.provider = provider;
		const data = await pluggyFetch("/items", {
			method: "POST",
			body: JSON.stringify(body),
		});
		return data;
	},

	async getItems() {
		const data = await pluggyFetch("/items");
		return data;
	},

	async deleteItem(itemId: string) {
		await pluggyFetch(`/items/${itemId}`, { method: "DELETE" });
	},

	async getTransactions({
		itemId,
		startDate,
		endDate,
	}: {
		itemId: string;
		startDate: string;
		endDate: string;
	}): Promise<PluggyTransaction[]> {
		const params = new URLSearchParams({
			start_date: startDate,
			end_date: endDate,
		});
		const data = await pluggyFetch(`/v2/transactions/${itemId}?${params}`);
		return (data ?? []) as PluggyTransaction[];
	},

	async createWebhook({ url, events }: { url: string; events: string[] }) {
		const data = await pluggyFetch("/webhooks", {
			method: "POST",
			body: JSON.stringify({ url, events }),
		});
		return data;
	},

	async deleteWebhook(webhookId: string) {
		await pluggyFetch(`/webhooks/${webhookId}`, { method: "DELETE" });
	},
};
