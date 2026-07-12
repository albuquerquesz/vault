import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface PluggyItem {
	id: string;
	userId: string;
	pluggyItemId: string;
	provider: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface PluggyTransaction {
	id: string;
	pluggyItemId: string;
	pluggyTransactionId: string;
	date: string;
	amount: number;
	description: string;
	category: string;
	createdAt: string;
}

export interface RegisterPluggyItemResponse {
	item: PluggyItem;
	sync: {
		total: number;
		synced: number;
		status: "success" | "failed";
	};
}

const apiFetch = async <T>(url: string, init?: RequestInit): Promise<T> => {
	const res = await fetch(url, { credentials: "include", ...init });
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(body || `HTTP ${res.status}`);
	}
	return res.json();
};

export function usePluggyItems() {
	return useQuery({
		queryKey: ["pluggy-items"],
		queryFn: () => apiFetch<PluggyItem[]>("/api/pluggy/items"),
	});
}

export function usePluggyTransactions(options?: {
	itemId?: string;
	limit?: number;
}) {
	const itemId = options?.itemId;
	const limit = options?.limit ?? 20;

	return useQuery({
		queryKey: ["pluggy-transactions", itemId ?? "all", limit],
		queryFn: () => {
			const url = itemId
				? `/api/pluggy/transactions?itemId=${itemId}&limit=${limit}`
				: `/api/pluggy/transactions?limit=${limit}`;
			return apiFetch<PluggyTransaction[]>(url);
		},
		enabled: !options || !!options.itemId || true,
	});
}

export function useSyncPluggyItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (itemId: string) =>
			apiFetch<unknown>(`/api/pluggy/sync/${itemId}`, { method: "POST" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pluggy-transactions"] });
		},
	});
}

export function useRegisterPluggyItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { pluggyItemId: string }) =>
			apiFetch<RegisterPluggyItemResponse>("/api/pluggy/items", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pluggy-items"] });
			queryClient.invalidateQueries({ queryKey: ["pluggy-transactions"] });
		},
	});
}

export function usePluggyDeleteItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (itemId: string) =>
			apiFetch<unknown>(`/api/pluggy/items/${itemId}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pluggy-items"] });
			queryClient.invalidateQueries({ queryKey: ["pluggy-transactions"] });
		},
	});
}
