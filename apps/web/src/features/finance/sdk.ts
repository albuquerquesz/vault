import { type QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCachedData, setCachedData } from "@/features/finance/cache";
import { apiFetch, queryClient } from "@/utils/api";

// --- Types ---

export interface FinanceExpense {
	id: string;
	userId: string;
	expenseDate: string;
	amount: number;
	category: string;
	note: string | null;
	source: string;
	sourceExternalId?: string | null;
	sourceItemId?: string | null;
	sourceProvider?: string | null;
	sourceAccountName?: string | null;
	sourceAccountType?: string | null;
	sourceAccountSubtype?: string | null;
	sourceAccountBrand?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface FinanceMonthlyOverview {
	month: string;
	income: number;
	spent: number;
	spentPercentage: number;
	remainingBudget: number;
	remainingDays: number;
	dailyCap: number;
}

export interface FinanceMonthlyBill {
	id: string;
	userId: string;
	month: string;
	totalBill: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface FinanceMonthlyBillItem {
	id: string;
	monthlyBillId: string;
	name: string;
	paidAmount: number;
	totalAmount: number;
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface FinanceMonthlyBills {
	bills: FinanceMonthlyBill[];
	items: FinanceMonthlyBillItem[];
}

export interface Goal {
	id: string;
	userId: string;
	name: string;
	url: string | null;
	targetAmount: number;
	currentAmount: number;
	currency: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateExpenseInput {
	date: string;
	amount: number;
	category: string;
	note?: string;
}

export interface UpsertBudgetInput {
	month: string;
	income: number;
}

export interface CreateGoalInput {
	name: string;
	targetAmount: number;
	currentAmount?: number;
	url?: string | null;
}

export interface UpdateGoalInput {
	id: string;
	name?: string;
	targetAmount?: number;
	currentAmount?: number;
	url?: string | null;
}

export interface SavingsTarget {
	month: string;
	savingsPercentage: number | null;
}

export interface UpsertSavingsTargetInput {
	month: string;
	savingsPercentage: number;
}

// --- Helpers ---

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
		client.invalidateQueries({ queryKey: ["expenses", month] }),
		client.invalidateQueries({ queryKey: ["overview", month, today] }),
	]);
}

// --- SDK ---

export const financeSdk = {
	listExpensesOptions(month = getMonthValue()) {
		return {
			queryKey: ["expenses", month],
			queryFn: () =>
				apiFetch<FinanceExpense[]>(
					`/api/finance/expenses?month=${encodeURIComponent(month)}`,
				),
		} as const;
	},

	listMonthlyBillsOptions(month = getMonthValue()) {
		return {
			queryKey: ["monthlyBills", month],
			queryFn: () =>
				apiFetch<FinanceMonthlyBills>(
					`/api/finance/monthly-bills?month=${encodeURIComponent(month)}`,
				),
		} as const;
	},

	monthlyOverviewOptions(month = getMonthValue(), today = getTodayValue()) {
		return {
			queryKey: ["overview", month, today],
			queryFn: () =>
				apiFetch<FinanceMonthlyOverview>(
					`/api/finance/overview?month=${encodeURIComponent(month)}&today=${encodeURIComponent(today)}`,
				),
		} as const;
	},

	createExpenseMutationOptions(
		month = getMonthValue(),
		client: QueryClient = queryClient,
		today = getTodayValue(),
	) {
		return {
			mutationFn: (input: CreateExpenseInput) =>
				apiFetch<FinanceExpense>("/api/finance/expenses", {
					method: "POST",
					body: input,
				}),
			onSuccess: async () => {
				await invalidateFinanceMonthQueries(client, month, today);
			},
		} as const;
	},

	upsertMonthlyBudgetMutationOptions(
		month = getMonthValue(),
		client: QueryClient = queryClient,
		today = getTodayValue(),
	) {
		return {
			mutationFn: (input: UpsertBudgetInput) =>
				apiFetch<unknown>("/api/finance/budget", {
					method: "POST",
					body: input,
				}),
			onSuccess: async () => {
				await invalidateFinanceMonthQueries(client, month, today);
			},
		} as const;
	},
};

// --- Hooks ---

export function useFinanceExpenses(month = getMonthValue()) {
	const cached = getCachedData<FinanceExpense[]>("listExpenses", month);

	const query = useQuery({
		...financeSdk.listExpensesOptions(month),
		initialData: cached ?? undefined,
	});

	useEffect(() => {
		if (query.data) {
			setCachedData("listExpenses", month, query.data);
		}
	}, [query.data, month]);

	return query;
}

export function useFinanceMonthlyOverview(
	month = getMonthValue(),
	today = getTodayValue(),
) {
	const cached = getCachedData<FinanceMonthlyOverview>(
		"getMonthlyOverview",
		`${month}:${today}`,
	);

	const query = useQuery({
		...financeSdk.monthlyOverviewOptions(month, today),
		initialData: cached ?? undefined,
	});

	useEffect(() => {
		if (query.data) {
			setCachedData("getMonthlyOverview", `${month}:${today}`, query.data);
		}
	}, [query.data, month, today]);

	return query;
}

export function useFinanceMonthlyBills(month = getMonthValue()) {
	return useQuery(financeSdk.listMonthlyBillsOptions(month));
}

export function useCreateExpense(
	month = getMonthValue(),
	today = getTodayValue(),
) {
	return useMutation(
		financeSdk.createExpenseMutationOptions(month, queryClient, today),
	);
}

export function useUpsertMonthlyBudget(
	month = getMonthValue(),
	today = getTodayValue(),
) {
	return useMutation(
		financeSdk.upsertMonthlyBudgetMutationOptions(month, queryClient, today),
	);
}

// --- Goals ---

export const goalsSdk = {
	listGoalsOptions: () =>
		({
			queryKey: ["goals"],
			queryFn: () => apiFetch<Goal[]>("/api/finance/goals"),
		}) as const,

	createGoalMutationOptions: (client: QueryClient = queryClient) =>
		({
			mutationFn: (input: CreateGoalInput) =>
				apiFetch<Goal>("/api/finance/goals", {
					method: "POST",
					body: input,
				}),
			onSuccess: () => client.invalidateQueries({ queryKey: ["goals"] }),
		}) as const,

	updateGoalMutationOptions: (client: QueryClient = queryClient) =>
		({
			mutationFn: ({ id, ...body }: UpdateGoalInput) =>
				apiFetch<Goal>(`/api/finance/goals/${id}`, {
					method: "PATCH",
					body,
				}),
			onSuccess: () => client.invalidateQueries({ queryKey: ["goals"] }),
		}) as const,

	deleteGoalMutationOptions: (client: QueryClient = queryClient) =>
		({
			mutationFn: (id: string) =>
				apiFetch<void>(`/api/finance/goals/${id}`, {
					method: "DELETE",
				}),
			onSuccess: () => client.invalidateQueries({ queryKey: ["goals"] }),
		}) as const,
};

export function useGoals() {
	return useQuery(goalsSdk.listGoalsOptions());
}

export function useCreateGoal() {
	return useMutation(goalsSdk.createGoalMutationOptions());
}

export function useUpdateGoal() {
	return useMutation(goalsSdk.updateGoalMutationOptions());
}

export function useDeleteGoal() {
	return useMutation(goalsSdk.deleteGoalMutationOptions());
}

export const savingsTargetSdk = {
	queryKey: (month: string) => ["finance", "savings-target", month] as const,
	queryOptions: (month: string) => ({
		queryKey: savingsTargetSdk.queryKey(month),
		queryFn: async () => {
			const res = await apiFetch<SavingsTarget>(
				`/finance/savings-target?month=${month}`,
			);
			return res;
		},
	}),
	mutationOptions: () => ({
		mutationFn: async (input: UpsertSavingsTargetInput) => {
			const res = await apiFetch<SavingsTarget>("/finance/savings-target", {
				method: "POST",
				body: JSON.stringify(input),
			});
			return res;
		},
	}),
};

export function useSavingsTarget(month = getMonthValue()) {
	return useQuery(savingsTargetSdk.queryOptions(month));
}

export function useUpsertSavingsTarget() {
	return useMutation(savingsTargetSdk.mutationOptions());
}
