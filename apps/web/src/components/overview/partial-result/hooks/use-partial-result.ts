"use client";

import { useMemo } from "react";
import { useFinanceMonthlyOverview } from "@/features/finance/sdk";

function previousMonthValue(month: string): string {
	const [year, monthNumber] = month.split("-").map(Number);
	if (!year || !monthNumber) {
		return month;
	}

	const date = new Date(year, monthNumber - 2, 1);
	const previousYear = date.getFullYear();
	const previousMonth = String(date.getMonth() + 1).padStart(2, "0");
	return `${previousYear}-${previousMonth}`;
}

export type PartialResultMetrics = {
	income: number;
	spent: number;
	result: number;
	previousResult: number;
	/** Null when previous result is 0 (no meaningful % change). */
	changePercent: number | null;
};

export function usePartialResult(month: string) {
	const previousMonth = previousMonthValue(month);
	const currentQuery = useFinanceMonthlyOverview(month);
	const previousQuery = useFinanceMonthlyOverview(previousMonth);

	const metrics = useMemo<PartialResultMetrics | null>(() => {
		if (!currentQuery.data || !previousQuery.data) {
			return null;
		}

		const income = currentQuery.data.income;
		const spent = currentQuery.data.spent;
		const result = income - spent;
		const previousResult =
			previousQuery.data.income - previousQuery.data.spent;
		const changePercent =
			previousResult === 0
				? null
				: ((result - previousResult) / Math.abs(previousResult)) * 100;

		return {
			income,
			spent,
			result,
			previousResult,
			changePercent,
		};
	}, [currentQuery.data, previousQuery.data]);

	return {
		metrics,
		isLoading: currentQuery.isPending || previousQuery.isPending,
		isError: currentQuery.isError || previousQuery.isError,
	};
}
