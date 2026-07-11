import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, queryClient } from "@/utils/api";

// --- Types ---

export interface PluggyItem {
	id: string;
	userId: string;
	pluggyItemId: string;
	provider: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface PluggyTransaction {
	id: string;
	pluggyTransactionId: string;
	date: string;
	amount: string;
	description: string | null;
	category: string | null;
	provider: string;
}

export interface PluggyConnectTokenOutput {
	accessToken: string;
}

export interface PluggyConnector {
	id: string;
	name: string;
	imageUrl: string;
	type: string;
	isOpenFinance: boolean;
}

export interface PluggySyncInput {
	pluggyItemId: string;
	startDate: string;
	endDate: string;
}

export interface PluggyDeleteItemInput {
	pluggyItemId: string;
}

export interface PluggyCredentialsStatus {
	configured: boolean;
	clientIdMasked: string | null;
}

export interface PluggyCredentialsInput {
	clientId: string;
	clientSecret: string;
}

// --- SDK ---

export const pluggySdk = {
	listItemsOptions() {
		return {
			queryKey: ["pluggyItems"],
			queryFn: () => apiFetch<PluggyItem[]>("/api/pluggy/items"),
		} as const;
	},
	credentialsStatusOptions() {
		return {
			queryKey: ["pluggyCredentials"],
			queryFn: () =>
				apiFetch<PluggyCredentialsStatus>("/api/connectors/credentials"),
		} as const;
	},
};

function invalidatePluggyQueries() {
	return Promise.all([
		queryClient.invalidateQueries({ queryKey: ["pluggyItems"] }),
		queryClient.invalidateQueries({ queryKey: ["pluggyTransactions"] }),
		queryClient.invalidateQueries({ queryKey: ["pluggyConnectors"] }),
		queryClient.invalidateQueries({ queryKey: ["pluggyCredentials"] }),
	]);
}

// --- Hooks ---

export function usePluggyItems() {
	return useQuery({
		...pluggySdk.listItemsOptions(),
		staleTime: 1000 * 60 * 5,
	});
}

export function usePluggyCredentialsStatus(options?: { enabled?: boolean }) {
	return useQuery({
		...pluggySdk.credentialsStatusOptions(),
		staleTime: 1000 * 60 * 2,
		enabled: options?.enabled ?? true,
		retry: false,
	});
}

export function useSavePluggyCredentials() {
	return useMutation({
		mutationFn: (input: PluggyCredentialsInput) =>
			apiFetch<PluggyCredentialsStatus>("/api/connectors/credentials", {
				method: "PUT",
				body: input,
			}),
		onSuccess: async () => {
			await invalidatePluggyQueries();
			toast.success("Credenciais Pluggy salvas");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});
}

export function useDeletePluggyCredentials() {
	return useMutation({
		mutationFn: () =>
			apiFetch<unknown>("/api/connectors/credentials", {
				method: "DELETE",
			}),
		onSuccess: async () => {
			await invalidatePluggyQueries();
			toast.success("Credenciais Pluggy removidas");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});
}

export function usePluggyConnectToken() {
	return useMutation({
		mutationFn: (connectorId?: string) =>
			apiFetch<PluggyConnectTokenOutput>("/api/connectors/token", {
				method: "POST",
				body: connectorId ? { connectorId } : undefined,
			}),
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});
}

export function usePluggyConnectors(enabled = true) {
	return useQuery({
		queryKey: ["pluggyConnectors"],
		queryFn: () => apiFetch<PluggyConnector[]>("/api/connectors"),
		staleTime: 1000 * 60 * 30,
		enabled,
		retry: false,
	});
}

export function usePluggySync(input: PluggySyncInput) {
	return useMutation({
		mutationFn: () =>
			apiFetch<{ synced: number; total: number }>("/api/pluggy/sync", {
				method: "POST",
				body: input,
			}),
		onSuccess: async () => {
			await invalidatePluggyQueries();
			toast.success("Transações sincronizadas");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});
}

export function usePluggyDeleteItem() {
	return async (input: PluggyDeleteItemInput) => {
		await apiFetch<unknown>(`/api/pluggy/items/${input.pluggyItemId}`, {
			method: "DELETE",
		});
		await invalidatePluggyQueries();
		toast.success("Item removido");
	};
}

export function usePluggyTransactions(limit = 20) {
	return useQuery({
		queryKey: ["pluggyTransactions", limit],
		queryFn: () =>
			apiFetch<PluggyTransaction[]>(`/api/pluggy/transactions?limit=${limit}`),
		staleTime: 1000 * 60 * 5,
	});
}
