import type {
	CreatePluggyConnectTokenInput,
	PluggyConnectToken,
	PluggyConnector,
	PluggyCredentials,
	PluggyItem,
	PluggyTransaction,
} from "./types";

const PLUGGY_API = "https://api.pluggy.ai";

/** Cache API keys per clientId (BYOK-safe). */
const apiKeyCache = new Map<string, { key: string; expiresAt: number }>();

export class PluggyAuthError extends Error {
	statusCode: number;

	constructor(message: string, statusCode = 401) {
		super(message);
		this.name = "PluggyAuthError";
		this.statusCode = statusCode;
	}
}

export async function authenticatePluggy(
	creds: PluggyCredentials,
): Promise<{ apiKey: string; expiresIn: number }> {
	const res = await fetch(`${PLUGGY_API}/auth`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			clientId: creds.clientId,
			clientSecret: creds.clientSecret,
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new PluggyAuthError(
			`Credenciais Pluggy inválidas (${res.status}): ${text}`,
			res.status === 401 || res.status === 403 ? 400 : 502,
		);
	}

	const data = (await res.json()) as { apiKey: string; expiresIn?: number };
	return {
		apiKey: data.apiKey,
		expiresIn: data.expiresIn ?? 7200,
	};
}

async function getApiKey(creds: PluggyCredentials): Promise<string> {
	const cached = apiKeyCache.get(creds.clientId);
	if (cached && Date.now() < cached.expiresAt - 60_000) {
		return cached.key;
	}

	const { apiKey, expiresIn } = await authenticatePluggy(creds);
	apiKeyCache.set(creds.clientId, {
		key: apiKey,
		expiresAt: Date.now() + expiresIn * 1000,
	});
	return apiKey;
}

export function clearPluggyApiKeyCache(clientId?: string) {
	if (clientId) {
		apiKeyCache.delete(clientId);
		return;
	}
	apiKeyCache.clear();
}

async function pluggyFetch(
	creds: PluggyCredentials,
	path: string,
	opts: RequestInit = {},
): Promise<unknown> {
	const apiKey = await getApiKey(creds);
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

export function createPluggyClient(creds: PluggyCredentials) {
	return {
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

			const data = await pluggyFetch(creds, "/connect_token", {
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
			const response = await pluggyFetch(creds, `/connectors?${params}`);
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
				creds,
				`/items/${itemId}/transactions?${params}`,
			);
			const result = (response as { data?: unknown[] }).data ?? [];
			return result as PluggyTransaction[];
		},

		async getItem(itemId: string): Promise<PluggyItem> {
			const response = await pluggyFetch(creds, `/items/${itemId}`);
			return response as PluggyItem;
		},

		async deleteItem(itemId: string) {
			await pluggyFetch(creds, `/items/${itemId}`, { method: "DELETE" });
		},

		async registerWebhook(url: string) {
			const data = await pluggyFetch(creds, "/webhooks", {
				method: "POST",
				body: JSON.stringify({ url, events: ["item.synced"] }),
			});
			return data as { id: string };
		},

		async deleteWebhook(webhookId: string) {
			await pluggyFetch(creds, `/webhooks/${webhookId}`, {
				method: "DELETE",
			});
		},
	};
}

export type PluggyClient = ReturnType<typeof createPluggyClient>;
