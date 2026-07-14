"use client";

import { curveLinear } from "@visx/curve";
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
