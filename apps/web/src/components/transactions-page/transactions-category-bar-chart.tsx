"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@vault/ui/components/chart";
import { type ReactNode, useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	LabelList,
	XAxis,
	YAxis,
} from "recharts";
import {
	maskMonetaryText,
	useMonetaryVisibility,
} from "@/components/monetary-visibility";
import type { FinanceTransaction } from "@/features/finance/sdk";
import { useIsMobile } from "@/hooks/use-mobile";
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

const LABEL_FOREGROUND_FILL = "var(--foreground)";
const LABEL_INVERSE_FILL = "var(--background)";

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

function normalizeHex(hex: string) {
	const value = hex.trim().replace(/^#/, "");
	if (value.length === 3) {
		return value
			.split("")
			.map((char) => char.repeat(2))
			.join("");
	}
	return value;
}

function getCategoryLabelFill(fill: string) {
	const hex = normalizeHex(fill);
	if (!/^[\da-fA-F]{6}$/.test(hex)) {
		return LABEL_INVERSE_FILL;
	}

	const r = Number.parseInt(hex.slice(0, 2), 16);
	const g = Number.parseInt(hex.slice(2, 4), 16);
	const b = Number.parseInt(hex.slice(4, 6), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	return luminance > 0.62 ? LABEL_FOREGROUND_FILL : LABEL_INVERSE_FILL;
}

/**
 * Pins every amount to the right edge of the plot (justify-between with
 * category labels on the left inside the bar).
 */
function AmountEdgeLabel(props: BarLabelProps) {
	const { isVisible } = useMonetaryVisibility();
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
			dominantBaseline="middle"
			fill={LABEL_FOREGROUND_FILL}
			fontSize={14}
			style={LABEL_STYLE}
			textAnchor="end"
			x={rightX}
			y={cy}
		>
			{maskMonetaryText(formatBRL(amount), isVisible)}
		</text>
	);
}

function CategoryInsideLabel(
	props: BarLabelProps & { payload?: CategorySpendRow },
) {
	const x = toNumber(props.x);
	const y = toNumber(props.y);
	const height = toNumber(props.height);
	const row = props.payload;

	if (!row?.label) {
		return null;
	}

	return (
		<text
			dominantBaseline="middle"
			fill={getCategoryLabelFill(row.fill)}
			fontSize={12}
			style={LABEL_STYLE}
			textAnchor="start"
			x={x + 8}
			y={y + height / 2}
		>
			{row.label}
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
	headerAction?: ReactNode;
};

export function TransactionsCategoryBarChart({
	transactions,
	headerAction,
}: TransactionsCategoryBarChartProps) {
	const chartData = useMemo(
		() => buildCategorySpendRows(transactions),
		[transactions],
	);
	const isMobile = useIsMobile();
	const { isVisible } = useMonetaryVisibility();

	const categoryCount = chartData.length;

	if (chartData.length === 0) {
		return (
			<div className="flex w-full flex-col gap-8 p-4 sm:p-5">
				<ChartHeader action={headerAction} />
				<p className="text-center text-sm text-muted-foreground">Nenhuma despesa neste período.</p>
			</div>
		);
	}

	return (
		<div className="flex w-full min-w-0 flex-col gap-3 p-4 sm:p-5">
			<ChartHeader action={headerAction} />

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
					margin={{
						right: isMobile ? 56 : 88,
						left: isMobile ? 0 : 4,
						top: 4,
						bottom: 4,
					}}
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
								formatter={(value) =>
									maskMonetaryText(formatBRL(Number(value) || 0), isVisible)
								}
								indicator="line"
								labelKey="category"
								nameKey="category"
							/>
						}
						cursor={false}
						labelFormatter={(_, payload) => {
							const row = payload?.[0]?.payload as CategorySpendRow | undefined;
							return row?.category ?? "";
						}}
					/>
					<Bar
						barSize={BAR_SIZE}
						dataKey="total"
						fill="var(--color-total)"
						radius={3}
					>
						{chartData.map((row) => (
							<Cell key={row.category} fill={row.fill} />
						))}
						<LabelList
							content={(props) => (
								<CategoryInsideLabel
									{...(props as BarLabelProps & { payload?: CategorySpendRow })}
								/>
							)}
							dataKey="label"
							position="insideLeft"
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

function ChartHeader({ action }: { action?: ReactNode }) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-3">
			<div>
				<p className="text-lg font-medium tracking-tight">Gastos por categoria</p>
			</div>
			{action}
		</div>
	);
}
