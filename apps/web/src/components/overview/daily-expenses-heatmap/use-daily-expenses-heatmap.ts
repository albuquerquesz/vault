"use client";

import dayjs from "dayjs";
import { useMemo } from "react";
import { useFinanceExpenses } from "@/features/finance/sdk";
import type { HeatmapColumn } from "@/components/charts/heatmap";
import "dayjs/locale/pt-br";

function buildHeatmapSkeleton(month: string): HeatmapColumn[] {
	const [year, monthNum] = month.split("-").map(Number);
	if (!year || !monthNum) return [];

	const firstDay = new Date(year, monthNum - 1, 1);
	const lastDay = new Date(year, monthNum, 0);

	const startDate = new Date(firstDay);
	startDate.setDate(startDate.getDate() - startDate.getDay());

	const endDate = new Date(lastDay);
	if (endDate.getDay() !== 6) {
		endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
	}

	const columns: HeatmapColumn[] = [];
	const current = new Date(startDate);
	let colIndex = 0;

	while (current <= endDate) {
		const bins = [];
		for (let dow = 0; dow < 7; dow++) {
			bins.push({
				bin: dow,
				count: 0,
				date: new Date(current),
			});
			current.setDate(current.getDate() + 1);
		}
		columns.push({ bin: colIndex, bins });
		colIndex++;
	}

	return columns;
}

function formatPeriodLabel(month: string, locale: string) {
	const [year, monthValue] = month.split("-").map(Number);
	if (!year || !monthValue) {
		return month;
	}

	const label = dayjs(new Date(year, monthValue - 1, 1))
		.locale(locale.toLowerCase() === "pt-br" ? "pt-br" : locale.toLowerCase())
		.format("MMMM [de] YYYY");

	return label.charAt(0).toUpperCase() + label.slice(1);
}

export function useDailyExpensesHeatmap(month: string, locale = "pt-BR") {
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
		resolvedPeriodLabel: formatPeriodLabel(month, locale),
		isLoading: expensesQuery.isPending,
		isError: expensesQuery.isError,
	};
}
