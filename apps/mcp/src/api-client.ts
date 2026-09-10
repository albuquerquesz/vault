const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const REQUEST_TIMEOUT_MS = 15_000;

export type MonthInput = {
	month: string;
};

export class VaultApiError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "VaultApiError";
		this.status = status;
	}
}

function requiredEnv(name: string) {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`${name} is required to start the Vault MCP server`);
	}
	return value;
}

function getConfig() {
	return {
		baseUrl: requiredEnv("VAULT_API_URL").replace(/\/$/, ""),
		token: requiredEnv("VAULT_MCP_TOKEN"),
	};
}

export function validateMonth(month: string) {
	if (!MONTH_PATTERN.test(month)) {
		throw new Error("month must use the YYYY-MM format");
	}
}

async function get<T>(path: string): Promise<T> {
	const { baseUrl, token } = getConfig();
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(`${baseUrl}${path}`, {
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${token}`,
			},
			signal: controller.signal,
		});

		if (!response.ok) {
			let message = `Vault API request failed with status ${response.status}`;
			try {
				const body = (await response.json()) as { error?: string };
				if (body.error) message = body.error;
			} catch {
				// Keep the generic status message when the API did not return JSON.
			}
			throw new VaultApiError(message, response.status);
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error("Vault API request timed out after 15 seconds");
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

export function getFinancialOverview({ month }: MonthInput) {
	validateMonth(month);
	return get(`/api/finance/overview?month=${encodeURIComponent(month)}`);
}

export function listTransactions({ month }: MonthInput) {
	validateMonth(month);
	return get(`/api/finance/transactions?month=${encodeURIComponent(month)}`);
}

export function getMonthlyBills({ month }: MonthInput) {
	validateMonth(month);
	return get(`/api/finance/monthly-bills?month=${encodeURIComponent(month)}`);
}

export function listGoals() {
	return get("/api/finance/goals");
}

export function getSpendingInsights({ month }: MonthInput) {
	validateMonth(month);
	return get(`/api/finance/partial-result?month=${encodeURIComponent(month)}`);
}
