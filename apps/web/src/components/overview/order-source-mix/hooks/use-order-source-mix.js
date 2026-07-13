"use client";
import { useMemo } from "react";
import { useFinanceExpenses } from "@/features/finance/sdk";
/** Max named categories in the mix chart; remaining roll into "Outros". */
const MAX_CATEGORIES = 5;
function resolveTrend(percentage) {
    if (percentage > 50) {
        return "up";
    }
    if (percentage < 30) {
        return "down";
    }
    return "neutral";
}
function consolidateTopCategories(sorted, totalAmount) {
    if (sorted.length <= MAX_CATEGORIES) {
        return sorted;
    }
    const top = sorted.slice(0, MAX_CATEGORIES);
    const rest = sorted.slice(MAX_CATEGORIES);
    const outrosAmount = rest.reduce((sum, datum) => sum + datum.amount, 0);
    const outrosOrders = rest.reduce((sum, datum) => sum + datum.orders, 0);
    const outrosPercentage = totalAmount > 0 ? (outrosAmount / totalAmount) * 100 : 0;
    return [
        ...top,
        {
            source: "Outros",
            amount: outrosAmount,
            orders: outrosOrders,
            percentage: outrosPercentage,
            monthOverMonthTrend: resolveTrend(outrosPercentage),
        },
    ];
}
export function useOrderSourceMix(month) {
    const expensesQuery = useFinanceExpenses(month);
    const sourceData = useMemo(() => {
        const expenses = expensesQuery.data;
        if (!expenses?.length) {
            return [];
        }
        const grouped = new Map();
        for (const expense of expenses) {
            const existing = grouped.get(expense.category) ?? { amount: 0, count: 0 };
            existing.amount += expense.amount;
            existing.count += 1;
            grouped.set(expense.category, existing);
        }
        const totalAmount = Array.from(grouped.values()).reduce((sum, value) => sum + value.amount, 0);
        const sorted = Array.from(grouped.entries())
            .map(([source, { amount, count }]) => {
            const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            return {
                source,
                amount,
                orders: count,
                percentage,
                monthOverMonthTrend: resolveTrend(percentage),
            };
        })
            .sort((left, right) => right.amount - left.amount);
        return consolidateTopCategories(sorted, totalAmount);
    }, [expensesQuery.data]);
    return {
        sourceData,
        isLoading: expensesQuery.isPending,
        isError: expensesQuery.isError,
    };
}
