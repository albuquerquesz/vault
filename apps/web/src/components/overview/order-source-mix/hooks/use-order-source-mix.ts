"use client";

import { useMemo } from "react";
import { useFinanceExpenses } from "@/features/finance/sdk";

type MonthOverMonthTrend = "up" | "down" | "neutral";

export type OrderSourceDatum = {
	source: string;
	amount: number;
	orders: number;
	percentage: number;
	monthOverMonthTrend: MonthOverMonthTrend;
};

function resolveTrend(percentage: number): MonthOverMonthTrend {
	if (percentage > 50) {
		return "up";
	}

	if (percentage < 30) {
		return "down";
	}

	return "neutral";
}

export function useOrderSourceMix(month: string) {
	const expensesQuery = useFinanceExpenses(month);

	const sourceData = useMemo(() => {
		const expenses = expensesQuery.data;
		if (!expenses?.length) {
			return [] as OrderSourceDatum[];
		}

		const grouped = new Map<string, { amount: number; count: number }>();

		for (const expense of expenses) {
			const existing = grouped.get(expense.category) ?? { amount: 0, count: 0 };
			existing.amount += expense.amount;
			existing.count += 1;
			grouped.set(expense.category, existing);
		}

		const totalAmount = Array.from(grouped.values()).reduce(
			(sum, value) => sum + value.amount,
			0,
		);

		return Array.from(grouped.entries())
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
	}, [expensesQuery.data]);

	return {
		sourceData,
		isLoading: expensesQuery.isPending,
		isError: expensesQuery.isError,
	};
}
