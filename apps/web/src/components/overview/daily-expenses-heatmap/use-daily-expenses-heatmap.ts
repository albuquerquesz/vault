"use client";

import dayjs from "dayjs";
import { useMemo } from "react";
import { useFinanceExpenses } from "@/features/finance/sdk";
import type { HeatmapColumn } from "@/components/charts/heatmap";
import "dayjs/locale/pt-br";

const DAILY_EXPENSES_COLUMN_COUNT = 3;

function buildHeatmapSkeleton(month: string): HeatmapColumn[] {
	const [year, monthNum] = month.split("-").map(Number);
	if (!year || !monthNum) return [];

	const firstDay = new Date(year, monthNum - 1, 1);
	const lastDay = new Date(year, monthNum, 0);
	const columns: HeatmapColumn[] = [];
	const daysInMonth = lastDay.getDate();
	const rowsPerColumn = Math.ceil(daysInMonth / DAILY_EXPENSES_COLUMN_COUNT);

	for (let columnIndex = 0; columnIndex < DAILY_EXPENSES_COLUMN_COUNT; columnIndex++) {
		const bins = [];

		for (let rowIndex = 0; rowIndex < rowsPerColumn; rowIndex++) {
			const dayOfMonth = columnIndex * rowsPerColumn + rowIndex + 1;
			if (dayOfMonth > daysInMonth) {
				break;
			}

			bins.push({
				bin: rowIndex,
				count: 0,
				date: new Date(year, monthNum - 1, dayOfMonth),
			});
		}

		columns.push({ bin: columnIndex, bins });
	}

	return columns;
}

export function useDailyExpensesHeatmap(month: string) {
	const expensesQuery = useFinanceExpenses(month);

	const skeletonColumns = useMemo(() => buildHeatmapSkeleton(month), [month]);

	const heatmapData = useMemo((): HeatmapColumn[] => {
		const expenses = expensesQuery.data;
		if (!expenses?.length) return skeletonColumns;

		const dailyTotals = new Map<string, number>();
		for (const expense of expenses) {
			const dateStr = dayjs(expense.expenseDate).format("YYYY-MM-DD");
			dailyTotals.set(
				dateStr,
				(dailyTotals.get(dateStr) ?? 0) + expense.amount,
			);
		}

		return skeletonColumns.map((col) => ({
			...col,
			bins: col.bins.map((bin) => ({
				...bin,
				count: dailyTotals.get(dayjs(bin.date).format("YYYY-MM-DD")) ?? 0,
			})),
		}));
	}, [expensesQuery.data, skeletonColumns]);

	const total = useMemo(
		() =>
			heatmapData.reduce(
				(sum, col) => sum + col.bins.reduce((s, b) => s + b.count, 0),
				0,
			),
		[heatmapData],
	);

	return {
		heatmapData,
		total,
		isLoading: expensesQuery.isPending,
		isError: expensesQuery.isError,
	};
}
