"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@vault/ui/components/chart";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import type { FinanceExpense } from "@/features/finance/sdk";
import { formatBRL } from "./utils";

const MAX_NAMED_CATEGORIES = 6;

const chartConfig = {
	total: {
		label: "Gasto",
		color: "var(--chart-2)",
	},
	label: {
		color: "var(--background)",
	},
} satisfies ChartConfig;

type CategorySpendRow = {
	category: string;
	/** Short label for bar (truncated if long). */
	label: string;
	total: number;
};

function truncateCategory(name: string, max = 18) {
	const trimmed = name.trim() || "Outros";
	if (trimmed.length <= max) {
		return trimmed;
	}
	return `${trimmed.slice(0, max - 1)}…`;
}

/**
 * Aggregate expense amounts by category, keep top N, roll the rest into "Outros".
 */
export function buildCategorySpendRows(
	expenses: FinanceExpense[],
	maxNamed = MAX_NAMED_CATEGORIES,
): CategorySpendRow[] {
	const totals = new Map<string, number>();

	for (const expense of expenses) {
		const key = expense.category.trim() || "Outros";
		totals.set(key, (totals.get(key) ?? 0) + (Number(expense.amount) || 0));
	}

	const sorted = [...totals.entries()]
		.map(([category, total]) => ({ category, total }))
		.sort((left, right) => right.total - left.total);

	if (sorted.length === 0) {
		return [];
	}

	if (sorted.length <= maxNamed) {
		return sorted.map((row) => ({
			...row,
			label: truncateCategory(row.category),
		}));
	}

	const head = sorted.slice(0, maxNamed);
	const tailTotal = sorted
		.slice(maxNamed)
		.reduce((sum, row) => sum + row.total, 0);

	return [
		...head.map((row) => ({
			...row,
			label: truncateCategory(row.category),
		})),
		{
			category: "Outros",
			label: "Outros",
			total: tailTotal,
		},
	];
}

type TransactionsCategoryBarChartProps = {
	expenses: FinanceExpense[];
	/** e.g. "julho de 2026" */
	periodLabel?: string;
};

export function TransactionsCategoryBarChart({
	expenses,
	periodLabel,
}: TransactionsCategoryBarChartProps) {
	const chartData = useMemo(
		() => buildCategorySpendRows(expenses),
		[expenses],
	);

	const categoryCount = chartData.length;

	if (chartData.length === 0) {
		return (
			<div className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-1 p-4 text-center sm:p-5">
				<p className="text-sm font-medium">Gastos por categoria</p>
				<p className="text-sm text-muted-foreground">
					Nenhuma despesa neste período.
				</p>
			</div>
		);
	}

	return (
		<div className="flex h-full w-full flex-col gap-4 p-4 sm:p-5">
			<div className="space-y-1">
				<p className="text-base font-medium tracking-tight">
					Gastos por categoria
				</p>
				<p className="text-sm text-muted-foreground">
					{periodLabel
						? periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)
						: "Período atual"}
				</p>
			</div>

			<ChartContainer
				className="aspect-auto min-h-48 w-full flex-1"
				config={chartConfig}
				style={{ minHeight: Math.max(192, categoryCount * 36) }}
			>
				<BarChart
					accessibilityLayer
					data={chartData}
					layout="vertical"
					margin={{ right: 72, left: 4 }}
				>
					<CartesianGrid horizontal={false} />
					<YAxis
						axisLine={false}
						dataKey="label"
						hide
						tickLine={false}
						tickMargin={10}
						type="category"
					/>
					<XAxis dataKey="total" hide type="number" />
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value) => formatBRL(Number(value) || 0)}
								indicator="line"
								labelKey="category"
								nameKey="category"
							/>
						}
						cursor={false}
						labelFormatter={(_, payload) => {
							const row = payload?.[0]?.payload as
								| CategorySpendRow
								| undefined;
							return row?.category ?? "";
						}}
					/>
					<Bar dataKey="total" fill="var(--color-total)" radius={4}>
						<LabelList
							className="fill-(--color-label)"
							dataKey="label"
							fontSize={12}
							offset={8}
							position="insideLeft"
						/>
						<LabelList
							className="fill-foreground"
							dataKey="total"
							fontSize={12}
							formatter={(value) => formatBRL(Number(value) || 0)}
							offset={8}
							position="right"
						/>
					</Bar>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
