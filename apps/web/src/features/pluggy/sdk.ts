import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE =
	import.meta.env.VITE_API_BASE ??
	`http://${import.meta.env.DEV ? "localhost" : "100.100.100.100"}:3000`;

export interface PluggyItem {
	id: string;
	pluggyItemId: string;
	provider: string;
	status: string;
}

export interface PluggyAccount {
	id: string;
	pluggyItemId: string;
	pluggyAccountId: string;
	type: "BANK" | "CREDIT";
	subtype?: string | null;
	name?: string | null;
	balance?: string | null;
	availableBalance?: string | null;
	currency?: string | null;
	transferNumber?: string | null;
	brand?: string | null;
	status?: string | null;
	provider: string;
}

export interface PluggyTransaction {
	id: string;
	pluggyTransactionId: string;
	date: string;
	amount: string;
	description?: string | null;
	category?: string | null;
	provider: string;
	pluggyAccountId?: string | null;
}

export interface PluggySyncResult {
	total: number;
	synced: number;
	status: "success" | "failed";
	error?: string;
}

async function readApiError(res: Response): Promise<string> {
	const text = await res.text().catch(() => "");
	if (!text) {
		return `HTTP ${res.status}`;
	}

	try {
		const data = JSON.parse(text) as { error?: string; message?: string };
		return data.error ?? data.message ?? text;
	} catch {
		return text;
	}
}

async function fetcher<T>(path: string): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`);
	if (!res.ok) {
		throw new Error(await readApiError(res));
	}
	return res.json();
}

// ─── Connect Token ──────────────────────────────────────────────────────────

export function usePluggyConnectToken() {
	return useMutation<string, Error, void>({
		mutationFn: async () => {
			const res = await fetch(`${API_BASE}/api/pluggy/connect`, {
				method: "POST",
			});
			if (!res.ok) throw new Error(await readApiError(res));
			const data = await res.json();
			return data.url;
		},
	});
}

// ─── Items ──────────────────────────────────────────────────────────────────

export function usePluggyItems() {
	return useQuery<PluggyItem[]>({
		queryKey: ["pluggy-items"],
		queryFn: () => fetcher<PluggyItem[]>("/api/pluggy/items"),
	});
}

export function usePluggyRegisterItem() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (pluggyItemId: string) => {
			const res = await fetch(`${API_BASE}/api/pluggy/items`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pluggyItemId }),
			});
			if (!res.ok) throw new Error(await readApiError(res));
			return res.json();
		},
		onSettled: async () => {
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["pluggy-items"] }),
				qc.invalidateQueries({ queryKey: ["pluggy-transactions"] }),
				qc.invalidateQueries({ queryKey: ["pluggy-accounts"] }),
			]);
		},
	});
}

export function usePluggyDeleteItem() {
	const qc = useQueryClient();
	return useMutation<void, Error, string>({
		mutationFn: async (pluggyItemId: string) => {
			const res = await fetch(
				`${API_BASE}/api/pluggy/items/${encodeURIComponent(pluggyItemId)}`,
				{ method: "DELETE" },
			);
			if (!res.ok) throw new Error(await readApiError(res));
		},
		onSettled: async () => {
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["pluggy-items"] }),
				qc.invalidateQueries({ queryKey: ["pluggy-transactions"] }),
				qc.invalidateQueries({ queryKey: ["pluggy-accounts"] }),
			]);
		},
	});
}

// ─── Accounts ───────────────────────────────────────────────────────────────

export function usePluggyAccounts() {
	return useQuery<PluggyAccount[]>({
		queryKey: ["pluggy-accounts"],
		queryFn: () => fetcher<PluggyAccount[]>("/api/pluggy/accounts"),
	});
}

// ─── Transactions ───────────────────────────────────────────────────────────

export function usePluggyTransactions(params?: {
	itemId?: string;
	accountId?: string;
	limit?: number;
}) {
	const { itemId, accountId, limit = 50 } = params ?? {};
	return useQuery<PluggyTransaction[]>({
		queryKey: ["pluggy-transactions", itemId, accountId, limit],
		queryFn: () => {
			const qs = new URLSearchParams({ limit: String(limit) });
			if (itemId) qs.set("itemId", itemId);
			if (accountId) qs.set("accountId", accountId);
			return fetcher<PluggyTransaction[]>(
				`/api/pluggy/transactions?${qs.toString()}`,
			);
		},
	});
}

// ─── Sync ───────────────────────────────────────────────────────────────────

export function usePluggySync() {
	return useMutation<PluggySyncResult, Error, string>({
		mutationFn: async (itemId: string) => {
			const res = await fetch(`${API_BASE}/api/pluggy/sync/${itemId}`, {
				method: "POST",
			});
			if (!res.ok) throw new Error(await readApiError(res));
			const data = await res.json();
			return data.sync as PluggySyncResult;
		},
	});
}
