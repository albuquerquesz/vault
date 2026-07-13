"use client";

import {
	Bar,
	BarChart,
	BarDepthBack,
	BarDepthFront,
	BarLineIndicator,
	BarXAxis,
	ChartTooltip,
	Grid,
} from "@/components/bar-chart";
import type { DailySpendDatum } from "./hooks/use-daily-spend-bar";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

function formatBrl(value: number) {
	return brlFormatter.format(value);
}

export function DailySpendBarContent({
	chartData,
}: {
	chartData: DailySpendDatum[];
}) {
	return (
		<div className="flex h-full min-h-[220px] w-full flex-1 flex-col">
			<BarChart
				className="h-full min-h-[220px] flex-1"
				data={chartData}
				margin={{ top: 8, right: 8, bottom: 40, left: 8 }}
				xDataKey="day"
			>
				<Grid horizontal />
				<BarDepthBack color="var(--chart-1)" dataKey="amount" />
				<Bar dataKey="amount" fill="var(--chart-1)" perspective />
				<BarDepthFront dataKey="amount" />
				<BarXAxis maxLabels={12} />
				<ChartTooltip
					rows={(point) => {
						const amount =
							typeof point.amount === "number" ? point.amount : 0;
						const day =
							typeof point.day === "string" ? point.day : String(point.day ?? "");

						return [
							{
								color: "var(--chart-1)",
								label: `Dia ${day}`,
								value: formatBrl(amount),
							},
						];
					}}
					showCrosshair={false}
					showDatePill={false}
					showDots={false}
				/>
				<BarLineIndicator data={chartData} valueKey="amount" xKey="day" />
			</BarChart>
		</div>
	);
}
