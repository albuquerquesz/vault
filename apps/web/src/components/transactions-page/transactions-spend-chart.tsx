"use client";

import {
	Area,
	AreaChart,
	ChartTooltip,
	Grid,
	XAxis,
} from "@/components/area-chart";
import type { TransactionsDailyChartPoint } from "./build-daily-chart-data";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

const SERIES_COLOR = "var(--chart-1)";

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
			<AreaChart
				aspectRatio="3.5 / 1"
				className="w-full max-h-44 sm:max-h-52"
				data={data}
				margin={{ top: 8, right: 12, bottom: 40, left: 12 }}
				xDataKey="date"
			>
				<Grid horizontal />
				<Area
					dataKey="amount"
					fill={SERIES_COLOR}
					fillOpacity={0.3}
					stroke={SERIES_COLOR}
					strokeWidth={2}
				/>
				<XAxis />
				<ChartTooltip
					rows={(point) => {
						const amount = typeof point.amount === "number" ? point.amount : 0;
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
								label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
								value: brlFormatter.format(amount),
							},
						];
					}}
				/>
			</AreaChart>
		</div>
	);
}
