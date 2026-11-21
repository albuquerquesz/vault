import { PLUGGY_INVESTMENT_TYPES } from "./types.js";
import type {
	CreatePluggyConnectTokenInput,
	PluggyAccount,
	PluggyAccountsPage,
	PluggyBill,
	PluggyBillsPage,
	PluggyConnector,
	PluggyConnectToken,
	PluggyCredentials,
	PluggyInvestment,
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

export function normalizeAccount(account: PluggyRemoteAccount): PluggyAccount {
	const credit = account.creditData;
	const availableBalance =
		account.bankData?.availableBalance ??
		credit?.availableCreditLimit ??
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
		brand: credit?.brand ?? undefined,
		status: account.status ?? credit?.status ?? undefined,
		creditLimit: credit?.creditLimit ?? undefined,
		availableCreditLimit: credit?.availableCreditLimit ?? undefined,
		balanceCloseDate: credit?.balanceCloseDate ?? undefined,
		balanceDueDate: credit?.balanceDueDate ?? undefined,
		minimumPayment: credit?.minimumPayment ?? undefined,
	};
}

export function normalizeBill(bill: PluggyRemoteBill): PluggyBill {
	return {
		id: bill.id,
		dueDate: bill.dueDate,
		billClosingDate: bill.billClosingDate ?? undefined,
		totalAmount: bill.totalAmount,
		totalAmountCurrencyCode: bill.totalAmountCurrencyCode,
		minimumPaymentAmount: bill.minimumPaymentAmount ?? undefined,
		allowsInstallments: bill.allowsInstallments,
		payments: bill.payments ?? [],
		financeCharges: bill.financeCharges ?? [],
	};
}

const asNumber = (value: unknown): number | null =>
	typeof value === "number" && Number.isFinite(value) ? value : null;

const asString = (value: unknown): string | null =>
	typeof value === "string" && value.trim() ? value.trim() : null;

/**
 * Parses one raw `/investments` result. Returns null when it has no usable id
 * or balance, so a malformed row is dropped instead of breaking the sync.
 */
export function normalizeInvestment(raw: unknown): PluggyInvestment | null {
	if (!raw || typeof raw !== "object") return null;
	const row = raw as Record<string, unknown>;
	const id = asString(row.id);
	const balance = asNumber(row.balance);
	if (!id || balance === null) return null;
	const rawType = asString(row.type);
	const type = (PLUGGY_INVESTMENT_TYPES as readonly string[]).includes(
		rawType ?? "",
	)
		? (rawType as PluggyInvestment["type"])
		: "OTHER";
	const institution = row.institution as { name?: unknown } | null | undefined;
	const date = asString(row.date);
	return {
		id,
		itemId: asString(row.itemId) ?? undefined,
		name: asString(row.name) ?? "Investimento",
		type,
		subtype: asString(row.subtype),
		institution: asString(institution?.name) ?? asString(row.issuer),
		balance,
		amountInvested: asNumber(row.amountOriginal),
		amountProfit: asNumber(row.amountProfit),
		currency: (asString(row.currencyCode) ?? "BRL").toUpperCase().slice(0, 3),
		status: asString(row.status),
		date: date && !Number.isNaN(Date.parse(date)) ? date : null,
	};
}

/**
 * True when Pluggy refused `/investments` because the product is not part of
 * the team subscription (or the item/connector does not offer it). The exact
 * payload was never observed (the team has no INVESTMENTS), so this is
 * deliberately broad: 403, or 400/404 whose message talks about the
 * product/plan. Item-not-found 404s are not matched.
 */
export function isInvestmentsUnavailableError(error: unknown): boolean {
	if (!(error instanceof PluggyApiError)) return false;
	if (error.statusCode === 403) return true;
	if (error.statusCode !== 400 && error.statusCode !== 404) return false;
	const text = `${error.message} ${error.details}`.toLowerCase();
	if (text.includes("item not found")) return false;
	return /product|plan|subscription|not enabled|not available|not supported|investment/.test(
		text,
	);
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

		/**
		 * Positions of an item (`GET /investments`). Zero rows = empty portfolio.
		 * Throws PluggyApiError when the product is unavailable; callers decide
		 * with `isInvestmentsUnavailableError`.
		 */
		async listInvestments(itemId: string): Promise<PluggyInvestment[]> {
			const investments: PluggyInvestment[] = [];
			const maxPages = 20;
			for (let page = 1; page <= maxPages; page += 1) {
				const params = new URLSearchParams({
					itemId,
					pageSize: "500",
					page: String(page),
				});
				const response = (await pluggyFetch(
					creds,
					`/investments?${params}`,
				)) as { results?: unknown; totalPages?: unknown } | null;
				const results = Array.isArray(response?.results) ? response.results : [];
				for (const raw of results) {
					const parsed = normalizeInvestment(raw);
					if (parsed) investments.push(parsed);
				}
				const totalPages = asNumber(response?.totalPages) ?? 1;
				if (page >= totalPages || results.length === 0) break;
			}
			return investments;
		},

		async getItem(itemId: string): Promise<PluggyItem> {
			const response = await pluggyFetch(creds, `/items/${itemId}`);
			return response as PluggyItem;
		},

		/** Asks Pluggy to re-collect the item; it fires `item/updated` when done. */
		async updateItem(itemId: string): Promise<PluggyItem> {
			const response = await pluggyFetch(creds, `/items/${itemId}`, {
				method: "PATCH",
				body: JSON.stringify({}),
			});
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
