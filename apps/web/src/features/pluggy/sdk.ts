import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/api";

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
	/** Local UUID of pluggy_accounts row; not for display. */
	pluggyAccountId?: string | null;
	accountName?: string | null;
	accountType?: string | null;
	accountSubtype?: string | null;
	accountBrand?: string | null;
	/** Remote Pluggy account id from pluggy_accounts.pluggyAccountId. */
	remoteAccountId?: string | null;
}

export interface PluggySyncResult {
	total: number;
	synced: number;
	status: "success" | "partial_failure" | "failed";
	error?: string;
	accounts: {
		total: number;
		synced: number;
		status: "success" | "failed" | "skipped";
		error?: string;
	};
	bills: {
		total: number;
		synced: number;
		status: "success" | "failed" | "skipped";
		error?: string;
	};
	transactions: {
		total: number;
		synced: number;
		status: "success" | "failed" | "skipped";
		error?: string;
	};
}

// ─── Connect Token ──────────────────────────────────────────────────────────

export function usePluggyConnectToken() {
	return useMutation<string, Error, void>({
		mutationFn: async () =>
			apiFetch<{ url: string }>("/api/pluggy/connect", {
				method: "POST",
			}).then((data) => data.url),
	});
}

// ─── Items ──────────────────────────────────────────────────────────────────

export function usePluggyItems(options?: { enabled?: boolean }) {
	return useQuery<PluggyItem[]>({
		queryKey: ["pluggy-items"],
		queryFn: () => apiFetch<PluggyItem[]>("/api/pluggy/items"),
		...(options ?? {}),
	});
}

export function usePluggyRegisterItem() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (pluggyItemId: string) =>
			apiFetch<{
				item: PluggyItem;
				sync: PluggySyncResult;
			}>("/api/pluggy/items", {
				method: "POST",
				body: { pluggyItemId },
			}),
		onSettled: async () => {
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["pluggy-items"] }),
				qc.invalidateQueries({ queryKey: ["pluggy-transactions"] }),
				qc.invalidateQueries({ queryKey: ["pluggy-accounts"] }),
				qc.invalidateQueries({ queryKey: ["transactions"] }),
				qc.invalidateQueries({ queryKey: ["monthlyBills"] }),
				qc.invalidateQueries({ queryKey: ["partialResult"] }),
			]);
		},
	});
}

export function usePluggyDeleteItem() {
	const qc = useQueryClient();
	return useMutation<void, Error, string>({
		mutationFn: async (pluggyItemId: string) =>
			apiFetch<void>(`/api/pluggy/items/${encodeURIComponent(pluggyItemId)}`, {
				method: "DELETE",
			}),
		onSettled: async () => {
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["pluggy-items"] }),
				qc.invalidateQueries({ queryKey: ["pluggy-transactions"] }),
				qc.invalidateQueries({ queryKey: ["pluggy-accounts"] }),
				qc.invalidateQueries({ queryKey: ["transactions"] }),
				qc.invalidateQueries({ queryKey: ["monthlyBills"] }),
				qc.invalidateQueries({ queryKey: ["partialResult"] }),
			]);
		},
	});
}

// ─── Accounts ───────────────────────────────────────────────────────────────

export function usePluggyAccounts() {
	return useQuery<PluggyAccount[]>({
		queryKey: ["pluggy-accounts"],
		queryFn: () => apiFetch<PluggyAccount[]>("/api/pluggy/accounts"),
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
			return apiFetch<PluggyTransaction[]>(
				`/api/pluggy/transactions?${qs.toString()}`,
			);
		},
	});
}

// ─── Sync ───────────────────────────────────────────────────────────────────

export function usePluggySync() {
	const qc = useQueryClient();
	return useMutation<PluggySyncResult, Error, string>({
		mutationFn: async (itemId: string) =>
			apiFetch<{ sync: PluggySyncResult }>(`/api/pluggy/sync/${itemId}`, {
				method: "POST",
			}).then((data) => data.sync),
		onSettled: async () => {
			await Promise.all([
				qc.invalidateQueries({ queryKey: ["pluggy-items"] }),
				qc.invalidateQueries({ queryKey: ["pluggy-transactions"] }),
				qc.invalidateQueries({ queryKey: ["pluggy-accounts"] }),
				qc.invalidateQueries({ queryKey: ["transactions"] }),
				qc.invalidateQueries({ queryKey: ["monthlyBills"] }),
				qc.invalidateQueries({ queryKey: ["partialResult"] }),
			]);
		},
	});
}
