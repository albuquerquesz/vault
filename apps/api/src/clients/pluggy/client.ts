import type {
	CreatePluggyConnectTokenInput,
	PluggyAccount,
	PluggyAccountsPage,
	PluggyBill,
	PluggyBillsPage,
	PluggyConnector,
	PluggyConnectToken,
	PluggyCredentials,
	PluggyItem,
	PluggyRemoteAccount,
	PluggyRemoteBill,
	PluggyTransaction,
	PluggyTransactionsFetchResult,
	PluggyTransactionsPage,
	PluggyWebhookRegistration,
	RegisterPluggyWebhookInput,
} from "./types.js";

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

export class PluggyApiError extends Error {
	statusCode: number;
	details: string;

	constructor(message: string, statusCode: number, details: string) {
		super(message);
		this.name = "PluggyApiError";
		this.statusCode = statusCode;
		this.details = details;
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
		let detail = text;
		try {
			detail = (JSON.parse(text) as { message?: string }).message ?? text;
		} catch {}
		throw new PluggyAuthError(
			`Credenciais Pluggy inválidas (${res.status}): ${detail}`,
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
		const parsedMessage = (() => {
			try {
				const body = JSON.parse(text) as { message?: string };
				return body.message ?? text;
			} catch {
				return text;
			}
		})();
		throw new PluggyApiError(parsedMessage, res.status, text);
	}

	if (res.status === 204 || res.headers.get("content-length") === "0") {
		return null;
	}

	return res.json();
}

function normalizeAccount(account: PluggyRemoteAccount): PluggyAccount {
	const availableBalance =
		account.bankData?.availableBalance ??
		account.creditData?.availableCreditLimit ??
		account.balance;

	return {
		id: account.id,
		itemId: account.itemId,
		type: account.type,
		subtype: account.subtype,
		name: account.name,
		balance: account.balance ?? account.bankData?.closingBalance,
		availableBalance,
		currency: account.currencyCode,
		transferNumber: account.bankData?.transferNumber ?? account.number,
		status: account.status,
	};
}

function normalizeBill(bill: PluggyRemoteBill): PluggyBill {
	return {
		id: bill.id,
		dueDate: bill.dueDate,
		totalAmount: bill.totalAmount,
		totalAmountCurrencyCode: bill.totalAmountCurrencyCode,
		minimumPaymentAmount: bill.minimumPaymentAmount ?? undefined,
		allowsInstallments: bill.allowsInstallments,
		payments: bill.payments ?? [],
		financeCharges: bill.financeCharges ?? [],
	};
}

function isInvalidCursorError(error: unknown) {
	if (!(error instanceof PluggyApiError)) {
		return false;
	}

	return error.message.toLowerCase().includes("invalid cursor");
}

/**
 * Build the path for a `/v2/transactions` page.
 *
 * Pluggy returns `next` as a full query string
 * (e.g. `?accountId=...&dateFrom=...&after=...`), not the raw cursor.
 * Passing that whole string as `after` causes "Invalid cursor".
 */
export function resolveTransactionsPagePath(
	accountId: string,
	startDate: string,
	endDate: string,
	next: string | null,
): string {
	if (!next) {
		const params = new URLSearchParams({
			accountId,
			dateFrom: startDate,
			dateTo: endDate,
		});
		return `/v2/transactions?${params}`;
	}

	// Opaque next query string from Pluggy (preferred follow path).
	if (next.startsWith("?")) {
		return `/v2/transactions${next}`;
	}

	// Absolute path already (pathname + search).
	if (next.startsWith("/")) {
		return next;
	}

	// Full URL — keep path + search only.
	if (next.startsWith("http://") || next.startsWith("https://")) {
		const url = new URL(next);
		return `${url.pathname}${url.search}`;
	}

	// Legacy / defensive: treat as raw cursor token for `after`.
	const params = new URLSearchParams({
		accountId,
		dateFrom: startDate,
		dateTo: endDate,
		after: next,
	});
	return `/v2/transactions?${params}`;
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

			if (input.connectorId) {
				body.connectorId = input.connectorId;
			}

			const options: Record<string, unknown> = {};
			if (input.clientUserId) {
				options.clientUserId = input.clientUserId;
			}
			if (input.webhookUrl) {
				options.webhookUrl = input.webhookUrl;
			}
			if (Object.keys(options).length > 0) {
				body.options = options;
			}

			const data = await pluggyFetch(creds, "/connect_token", {
				method: "POST",
				body: JSON.stringify(body),
			});
			return data as PluggyConnectToken;
		},

		async listConnectors(
			countries?: string[],
			isOpenFinance?: boolean,
		): Promise<PluggyConnector[]> {
			const params = new URLSearchParams();
			if (countries && countries.length > 0) {
				params.set("countries", JSON.stringify(countries));
			}
			if (typeof isOpenFinance === "boolean") {
				params.set("isOpenFinance", String(isOpenFinance));
			}
			const path = params.size > 0 ? `/connectors?${params}` : "/connectors";
			const response = await pluggyFetch(creds, path);
			const result =
				(response as { results?: unknown[]; data?: unknown[] }).results ??
				(response as { results?: unknown[]; data?: unknown[] }).data ??
				[];
			return result as PluggyConnector[];
		},

		async listAccounts(itemId: string): Promise<PluggyAccount[]> {
			const response = (await pluggyFetch(
				creds,
				`/accounts?itemId=${encodeURIComponent(itemId)}`,
			)) as PluggyAccountsPage;
			return response.results.map(normalizeAccount);
		},

		/** Credit card bills for a CREDIT account. */
		async listBills(accountId: string): Promise<PluggyBill[]> {
			const response = (await pluggyFetch(
				creds,
				`/bills?accountId=${encodeURIComponent(accountId)}`,
			)) as PluggyBillsPage;
			return (response.results ?? []).map(normalizeBill);
		},

		async getTransactionsByAccount(
			accountId: string,
			startDate: string,
			endDate: string,
		): Promise<PluggyTransactionsFetchResult> {
			const transactions: PluggyTransaction[] = [];
			let next: string | null = null;

			do {
				const path = resolveTransactionsPagePath(
					accountId,
					startDate,
					endDate,
					next,
				);

				try {
					const response = (await pluggyFetch(
						creds,
						path,
					)) as PluggyTransactionsPage;

					transactions.push(...response.results);
					next = response.next ?? null;
				} catch (error) {
					if (isInvalidCursorError(error)) {
						return {
							transactions,
							error:
								error instanceof PluggyApiError
									? error.message
									: "Invalid cursor",
						};
					}

					throw error;
				}
			} while (next);

			return { transactions };
		},

		async getItem(itemId: string): Promise<PluggyItem> {
			const response = await pluggyFetch(creds, `/items/${itemId}`);
			return response as PluggyItem;
		},

		async deleteItem(itemId: string) {
			await pluggyFetch(creds, `/items/${itemId}`, { method: "DELETE" });
		},

		async registerWebhook(
			input: RegisterPluggyWebhookInput,
		): Promise<PluggyWebhookRegistration> {
			const body: Record<string, unknown> = {
				url: input.url,
				event: input.event,
			};
			if (input.headers && Object.keys(input.headers).length > 0) {
				body.headers = input.headers;
			}

			const data = await pluggyFetch(creds, "/webhooks", {
				method: "POST",
				body: JSON.stringify(body),
			});
			return data as PluggyWebhookRegistration;
		},

		async listWebhooks(): Promise<PluggyWebhookRegistration[]> {
			const response = await pluggyFetch(creds, "/webhooks");
			const page = response as {
				results?: PluggyWebhookRegistration[];
				data?: PluggyWebhookRegistration[];
			};
			return page.results ?? page.data ?? [];
		},

		async deleteWebhook(webhookId: string) {
			await pluggyFetch(creds, `/webhooks/${webhookId}`, {
				method: "DELETE",
			});
		},
	};
}

export type PluggyClient = ReturnType<typeof createPluggyClient>;
