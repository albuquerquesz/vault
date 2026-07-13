import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCachedData, setCachedData } from "@/features/finance/cache";
import { apiFetch, queryClient } from "@/utils/api";
// --- Helpers ---
export function getMonthValue(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
export function getTodayValue(date = new Date()) {
    return date.toISOString().slice(0, 10);
}
function invalidateFinanceMonthQueries(client, month, today = getTodayValue()) {
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
            queryFn: () => apiFetch(`/api/finance/expenses?month=${encodeURIComponent(month)}`),
        };
    },
    listMonthlyBillsOptions(month = getMonthValue()) {
        return {
            queryKey: ["monthlyBills", month],
            queryFn: () => apiFetch(`/api/finance/monthly-bills?month=${encodeURIComponent(month)}`),
        };
    },
    monthlyOverviewOptions(month = getMonthValue(), today = getTodayValue()) {
        return {
            queryKey: ["overview", month, today],
            queryFn: () => apiFetch(`/api/finance/overview?month=${encodeURIComponent(month)}&today=${encodeURIComponent(today)}`),
        };
    },
    createExpenseMutationOptions(month = getMonthValue(), client = queryClient, today = getTodayValue()) {
        return {
            mutationFn: (input) => apiFetch("/api/finance/expenses", {
                method: "POST",
                body: input,
            }),
            onSuccess: async () => {
                await invalidateFinanceMonthQueries(client, month, today);
            },
        };
    },
    upsertMonthlyBudgetMutationOptions(month = getMonthValue(), client = queryClient, today = getTodayValue()) {
        return {
            mutationFn: (input) => apiFetch("/api/finance/budget", {
                method: "POST",
                body: input,
            }),
            onSuccess: async () => {
                await invalidateFinanceMonthQueries(client, month, today);
            },
        };
    },
    deleteExpensesMutationOptions(month = getMonthValue(), client = queryClient, today = getTodayValue()) {
        return {
            mutationFn: (ids) => apiFetch("/api/finance/expenses", {
                method: "DELETE",
                body: { ids },
            }),
            onSuccess: async () => {
                await invalidateFinanceMonthQueries(client, month, today);
            },
        };
    },
};
// --- Hooks ---
export function useFinanceExpenses(month = getMonthValue()) {
    const cached = getCachedData("listExpenses", month);
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
export function useFinanceMonthlyOverview(month = getMonthValue(), today = getTodayValue()) {
    const cached = getCachedData("getMonthlyOverview", `${month}:${today}`);
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
export function useCreateExpense(month = getMonthValue(), today = getTodayValue()) {
    return useMutation(financeSdk.createExpenseMutationOptions(month, queryClient, today));
}
export function useDeleteExpenses(month = getMonthValue(), today = getTodayValue()) {
    return useMutation(financeSdk.deleteExpensesMutationOptions(month, queryClient, today));
}
export function useUpsertMonthlyBudget(month = getMonthValue(), today = getTodayValue()) {
    return useMutation(financeSdk.upsertMonthlyBudgetMutationOptions(month, queryClient, today));
}
// --- Goals ---
export const goalsSdk = {
    listGoalsOptions: () => ({
        queryKey: ["goals"],
        queryFn: () => apiFetch("/api/finance/goals"),
    }),
    createGoalMutationOptions: (client = queryClient) => ({
        mutationFn: (input) => apiFetch("/api/finance/goals", {
            method: "POST",
            body: input,
        }),
        onSuccess: () => client.invalidateQueries({ queryKey: ["goals"] }),
    }),
    updateGoalMutationOptions: (client = queryClient) => ({
        mutationFn: ({ id, ...body }) => apiFetch(`/api/finance/goals/${id}`, {
            method: "PATCH",
            body,
        }),
        onSuccess: () => client.invalidateQueries({ queryKey: ["goals"] }),
    }),
    deleteGoalMutationOptions: (client = queryClient) => ({
        mutationFn: (id) => apiFetch(`/api/finance/goals/${id}`, {
            method: "DELETE",
        }),
        onSuccess: () => client.invalidateQueries({ queryKey: ["goals"] }),
    }),
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
    queryKey: (month) => ["finance", "savings-target", month],
    queryOptions: (month) => ({
        queryKey: savingsTargetSdk.queryKey(month),
        queryFn: async () => {
            const res = await apiFetch(`/finance/savings-target?month=${month}`);
            return res;
        },
    }),
    mutationOptions: () => ({
        mutationFn: async (input) => {
            const res = await apiFetch("/finance/savings-target", {
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
