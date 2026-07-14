"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@vault/ui/components/chart";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	LabelList,
	XAxis,
	YAxis,
} from "recharts";
import type { FinanceTransaction } from "@/features/finance/sdk";
import { formatBRL, getCategoryBarFill, isExpenseTransaction } from "./utils";

const MAX_NAMED_CATEGORIES = 6;
/** Vertical bar thickness (px). */
const BAR_SIZE = 38;
/** Row pitch for chart height (bar + gap). */
const BAR_ROW_HEIGHT = 42;
/** Gap between category bars (px). */
const BAR_CATEGORY_GAP = 4;

const LABEL_STYLE = {
	fontFamily: '"Space Grotesk", sans-serif',
	fontWeight: 500,
} as const;

const chartConfig = {
	total: {
		label: "Gasto",
		color: "var(--chart-2)",
	},
	label: {
		color: "var(--background)",
	},
} satisfies ChartConfig;

type ChartBox = { x?: number; y?: number; width?: number; height?: number };

type BarLabelProps = {
	x?: number | string;
	y?: number | string;
	width?: number | string;
	height?: number | string;
	value?: number | string;
	parentViewBox?: ChartBox;
	viewBox?: ChartBox;
};

function toNumber(value: number | string | undefined, fallback = 0) {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

/**
 * Pins every amount to the right edge of the plot (justify-between with
 * category labels on the left inside the bar).
 */
function AmountEdgeLabel(props: BarLabelProps) {
	const y = toNumber(props.y);
	const height = toNumber(props.height);
	const barX = toNumber(props.x);
	const barWidth = toNumber(props.width);
	const box = props.parentViewBox ?? props.viewBox;

	// Prefer full plot width so all values share one right edge.
	const rightX = box?.width
		? toNumber(box.x) + toNumber(box.width) - 4
		: barX + barWidth + 8;
	const cy = y + height / 2;
	const amount = toNumber(props.value);

	return (
		<text
			className="fill-foreground font-medium"
			dominantBaseline="middle"
			fontSize={14}
			style={LABEL_STYLE}
			textAnchor="end"
			x={rightX}
			y={cy}
		>
			{formatBRL(amount)}
		</text>
	);
}

type CategorySpendRow = {
	category: string;
	/** Short label for bar (truncated if long). */
	label: string;
	total: number;
	fill: string;
};

function truncateCategory(name: string, max = 18) {
	const trimmed = name.trim() || "Outros";
	if (trimmed.length <= max) {
		return trimmed;
	}
	return `${trimmed.slice(0, max - 1)}…`;
}

function toRow(category: string, total: number): CategorySpendRow {
	return {
		category,
		total,
		label: truncateCategory(category),
		fill: getCategoryBarFill(category),
	};
}

/**
 * Aggregate expense amounts by category, keep top N, roll the rest into "Outros".
 */
export function buildCategorySpendRows(
	transactions: FinanceTransaction[],
	maxNamed = MAX_NAMED_CATEGORIES,
): CategorySpendRow[] {
	const totals = new Map<string, number>();

	for (const transaction of transactions) {
		if (!isExpenseTransaction(transaction)) {
			continue;
		}

		const key = transaction.category.trim() || "Outros";
		totals.set(
			key,
			(totals.get(key) ?? 0) + Math.abs(Number(transaction.amount) || 0),
		);
	}

	const sorted = [...totals.entries()]
		.map(([category, total]) => ({ category, total }))
		.sort((left, right) => right.total - left.total);

	if (sorted.length === 0) {
		return [];
	}

	if (sorted.length <= maxNamed) {
		return sorted.map((row) => toRow(row.category, row.total));
	}

	const head = sorted.slice(0, maxNamed);
	const tailTotal = sorted
		.slice(maxNamed)
		.reduce((sum, row) => sum + row.total, 0);

	return [
		...head.map((row) => toRow(row.category, row.total)),
		toRow("Outros", tailTotal),
	];
}

type TransactionsCategoryBarChartProps = {
	transactions: FinanceTransaction[];
	/** e.g. "julho de 2026" */
	periodLabel?: string;
};

export function TransactionsCategoryBarChart({
	transactions,
	periodLabel,
}: TransactionsCategoryBarChartProps) {
	const chartData = useMemo(
		() => buildCategorySpendRows(transactions),
		[transactions],
	);

	const categoryCount = chartData.length;

	if (chartData.length === 0) {
		return (
			<div className="flex w-full flex-col items-center justify-center gap-1 p-4 text-center sm:p-5">
				<p className="text-sm font-medium">Gastos por categoria</p>
				<p className="text-sm text-muted-foreground">
					Nenhuma despesa neste período.
				</p>
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col gap-3 p-4 sm:p-5">
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
				className="aspect-auto w-full"
				config={chartConfig}
				style={{
					height: categoryCount * BAR_ROW_HEIGHT,
				}}
			>
				<BarChart
					accessibilityLayer
					barCategoryGap={BAR_CATEGORY_GAP}
					data={chartData}
					layout="vertical"
					margin={{ right: 88, left: 4, top: 4, bottom: 4 }}
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
					<Bar barSize={BAR_SIZE} dataKey="total" radius={3}>
						{chartData.map((row) => (
							<Cell key={row.category} fill={row.fill} />
						))}
						<LabelList
							className="fill-white font-medium"
							dataKey="label"
							fontSize={12}
							offset={8}
							position="insideLeft"
							style={LABEL_STYLE}
						/>
						<LabelList
							content={(props) => (
								<AmountEdgeLabel {...(props as BarLabelProps)} />
							)}
							dataKey="total"
							position="right"
						/>
					</Bar>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
