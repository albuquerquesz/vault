import {
	useMutation,
	useQuery,
	type QueryClient,
} from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@vault/api/routers/index";
import { queryClient, trpc } from "@/utils/trpc";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type FinanceListExpensesInput = RouterInputs["finance"]["listExpenses"];
export type FinanceCreateExpenseInput = RouterInputs["finance"]["createExpense"];
export type FinanceUpsertMonthlyBudgetInput =
	RouterInputs["finance"]["upsertMonthlyBudget"];
export type FinanceMonthlyOverviewInput =
	RouterInputs["finance"]["getMonthlyOverview"];
export type FinanceExpense = RouterOutputs["finance"]["listExpenses"][number];
export type FinanceMonthlyOverview =
	RouterOutputs["finance"]["getMonthlyOverview"];

export function getMonthValue(date = new Date()) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getTodayValue(date = new Date()) {
	return date.toISOString().slice(0, 10);
}

function invalidateFinanceMonthQueries(
	client: QueryClient,
	month: string,
	today = getTodayValue(),
) {
	return Promise.all([
		client.invalidateQueries(trpc.finance.listExpenses.queryFilter({ month })),
		client.invalidateQueries(
			trpc.finance.getMonthlyOverview.queryFilter({ month, today }),
		),
	]);
}

export const financeSdk = {
	listExpensesOptions(month = getMonthValue()) {
		return trpc.finance.listExpenses.queryOptions({ month });
	},
	monthlyOverviewOptions(month = getMonthValue(), today = getTodayValue()) {
		return trpc.finance.getMonthlyOverview.queryOptions({ month, today });
	},
	createExpenseMutationOptions(
		month = getMonthValue(),
		client: QueryClient = queryClient,
		today = getTodayValue(),
	) {
		return trpc.finance.createExpense.mutationOptions({
			onSuccess: async () => {
				await invalidateFinanceMonthQueries(client, month, today);
			},
		});
	},
	upsertMonthlyBudgetMutationOptions(
		month = getMonthValue(),
		client: QueryClient = queryClient,
		today = getTodayValue(),
	) {
		return trpc.finance.upsertMonthlyBudget.mutationOptions({
			onSuccess: async () => {
				await invalidateFinanceMonthQueries(client, month, today);
			},
		});
	},
};

export function useFinanceExpenses(month = getMonthValue()) {
	return useQuery(financeSdk.listExpensesOptions(month));
}

export function useFinanceMonthlyOverview(
	month = getMonthValue(),
	today = getTodayValue(),
) {
	return useQuery(financeSdk.monthlyOverviewOptions(month, today));
}

export function useCreateExpense(
	month = getMonthValue(),
	today = getTodayValue(),
) {
	return useMutation(financeSdk.createExpenseMutationOptions(month, queryClient, today));
}

export function useUpsertMonthlyBudget(
	month = getMonthValue(),
	today = getTodayValue(),
) {
	return useMutation(
		financeSdk.upsertMonthlyBudgetMutationOptions(month, queryClient, today),
	);
}
