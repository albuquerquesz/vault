"use client";

import { curveLinear } from "@visx/curve";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ClipboardListIcon,
} from "lucide-react";
import {
	ChartTooltip,
	Grid,
	Line,
	LineChart,
	XAxis,
} from "@/components/line-chart";
import type { TransactionsDailyChartPoint } from "./build-daily-chart-data";

const SERIES_COLOR = "var(--chart-1)";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

export type TransactionsChartStats = {
	/** Number of transactions in the chart range (year, filtered). */
	count: number;
	/** Total outflows / expenses. */
	totalOut: number;
	/** Total inflows if available (0 when unknown). */
	totalIn: number;
};

export function TransactionsSpendChart({
	data,
}: {
	data: TransactionsDailyChartPoint[];
}) {
	if (data.length === 0) {
		return null;
	}

	return (
		<div className="w-full min-w-0">
			<LineChart
				aspectRatio="3 / 1"
				className="w-full max-h-52 sm:max-h-60"
				data={data}
				margin={{ top: 16, right: 24, bottom: 42, left: 24 }}
				xDataKey="date"
			>
				<Grid horizontal />
				<Line
					curve={curveLinear}
					dataKey="amount"
					fadeEdges={false}
					markers={{ radius: 4, strokeWidth: 2, fadeOnHover: false }}
					showMarkers
					stroke={SERIES_COLOR}
					strokeWidth={2}
				/>
				{/* data-aligned ticks only — avoids domain tail "Dec Dec Dec 21" stacking */}
				<XAxis tickMode="data" />
				<ChartTooltip
					rows={(point) => {
						const amount =
							typeof point.amount === "number" ? point.amount : 0;
						const rawDate = point.date;
						const monthLabel =
							rawDate instanceof Date
								? rawDate.toLocaleDateString("pt-BR", {
										month: "long",
										year: "numeric",
									})
								: "Gastos";
						return [
							{
								color: SERIES_COLOR,
								label:
									monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
								value: brlFormatter.format(amount),
							},
						];
					}}
				/>
			</LineChart>
		</div>
	);
}

/** Pinned to the card's bottom-right border (use inside a `relative` card). */
export function TransactionsChartStatsBar({
	stats,
}: {
	stats: TransactionsChartStats;
}) {
	return (
		<div className="pointer-events-none absolute right-2 bottom-1.5 z-10 flex flex-wrap items-center justify-end gap-4 sm:right-3 sm:bottom-2 sm:gap-5">
			<div className="flex items-center gap-1.5 text-base tabular-nums sm:text-lg">
				<ClipboardListIcon
					className="size-4 shrink-0 text-muted-foreground sm:size-4.5"
					aria-hidden
				/>
				<span className="font-medium text-white">{stats.count}</span>
			</div>

			<div
				className="flex items-center gap-1 text-base font-medium tabular-nums sm:text-lg"
				title="Total de saídas no ano"
			>
				<ArrowDownIcon
					className="size-4 shrink-0 text-emerald-500 sm:size-4.5"
					aria-hidden
				/>
				<span className="text-white">
					{brlFormatter.format(stats.totalOut)}
				</span>
			</div>

			<div
				className="flex items-center gap-1 text-base font-medium tabular-nums sm:text-lg"
				title="Total de entradas no ano"
			>
				<ArrowUpIcon
					className="size-4 shrink-0 text-red-500 sm:size-4.5"
					aria-hidden
				/>
				<span className="text-white">{brlFormatter.format(stats.totalIn)}</span>
			</div>
		</div>
	);
}
