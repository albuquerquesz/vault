import { useMutation, useQuery } from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@vault/api/routers/index";
import { toast } from "sonner";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type PluggyItem = RouterOutputs["pluggy"]["listItems"][number];
export type PluggyTransaction =
	RouterOutputs["pluggy"]["listTransactions"][number];
export type PluggyConnectTokenOutput = RouterOutputs["pluggy"]["connectToken"];
export type PluggySyncInput = RouterInputs["pluggy"]["syncTransactions"];
export type PluggyDeleteItemInput = RouterInputs["pluggy"]["deleteItem"];

function invalidatePluggyQueries() {
	return queryClient.invalidateQueries(trpc.pluggy.listItems.queryFilter());
}

export const pluggySdk = {
	listItemsOptions() {
		return trpc.pluggy.listItems.queryOptions();
	},
};

export function usePluggyItems() {
	return useQuery({
		...pluggySdk.listItemsOptions(),
		staleTime: 1000 * 60 * 5,
	});
}

export function usePluggyConnectToken() {
	return useMutation({
		mutationFn: () => trpcClient.pluggy.connectToken.mutate(void 0),
		onSuccess: () => {
			toast.success("Token gerado com sucesso");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function usePluggySync(input: PluggySyncInput) {
	return useMutation({
		mutationFn: () => trpcClient.pluggy.syncTransactions.mutate(input),
		onSuccess: async () => {
			await invalidatePluggyQueries();
			toast.success("Transações sincronizadas");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});
}

export function usePluggyDeleteItem() {
	return async (input: PluggyDeleteItemInput) => {
		await trpcClient.pluggy.deleteItem.mutate(input);
		await invalidatePluggyQueries();
		toast.success("Item removido");
	};
}

export function usePluggyTransactions(limit = 20) {
	return useQuery({
		...trpc.pluggy.listTransactions.queryOptions({ limit }),
		staleTime: 1000 * 60 * 5,
	});
}
