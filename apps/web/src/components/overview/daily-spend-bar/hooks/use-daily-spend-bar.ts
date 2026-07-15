"use client";

import { useMemo } from "react";
import { useFinanceExpenses } from "@/features/finance/sdk";

export type DailySpendDatum = {
	/** Label on the X axis (no leading zero), e.g. "1" … "31". */
	day: string;
	dayNumber: number;
	/** Total spent that calendar day (BRL). */
	amount: number;
};

function daysInMonth(month: string): number {
	const [year, monthNumber] = month.split("-").map(Number);
	if (!year || !monthNumber) {
		return 0;
	}
	// Day 0 of next month = last day of current month (local calendar).
	return new Date(year, monthNumber, 0).getDate();
}

function dayNumberFromExpenseDate(expenseDate: string): number | null {
	// Treat YYYY-MM-DD as a calendar date — never parse via local Date.
	const dayPart = expenseDate.slice(8, 10);
	const dayNumber = Number(dayPart);
	if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > 31) {
		return null;
	}
	return dayNumber;
}

export function useDailySpendBar(month: string) {
	const expensesQuery = useFinanceExpenses(month);

	const { chartData, totalSpent, peakDay } = useMemo(() => {
		const totalDays = daysInMonth(month);
		const amounts = new Array<number>(totalDays).fill(0);
		const expenses = expensesQuery.data ?? [];

		for (const expense of expenses) {
			const dayNumber = dayNumberFromExpenseDate(expense.expenseDate);
			if (dayNumber === null || dayNumber > totalDays) {
				continue;
			}
			amounts[dayNumber - 1] = (amounts[dayNumber - 1] ?? 0) + expense.amount;
		}

		const chartData: DailySpendDatum[] = amounts.map((amount, index) => {
			const dayNumber = index + 1;
			return {
				day: String(dayNumber),
				dayNumber,
				amount,
			};
		});

		const totalSpent = amounts.reduce((sum, value) => sum + value, 0);

		let peakDay: DailySpendDatum | null = null;
		for (const datum of chartData) {
			if (!peakDay || datum.amount > peakDay.amount) {
				peakDay = datum;
			}
		}
		if (peakDay && peakDay.amount <= 0) {
			peakDay = null;
		}

		return { chartData, totalSpent, peakDay };
	}, [expensesQuery.data, month]);

	return {
		chartData,
		totalSpent,
		peakDay,
		isLoading: expensesQuery.isPending,
		isError: expensesQuery.isError,
	};
}
