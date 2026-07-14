"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@vault/ui/components/chart";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

const chartData = [
	{ month: "January", desktop: 186, mobile: 80 },
	{ month: "February", desktop: 305, mobile: 200 },
	{ month: "March", desktop: 237, mobile: 120 },
	{ month: "April", desktop: 73, mobile: 190 },
	{ month: "May", desktop: 209, mobile: 130 },
	{ month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-2)",
	},
	mobile: {
		label: "Mobile",
		color: "var(--chart-2)",
	},
	label: {
		color: "var(--background)",
	},
} satisfies ChartConfig;

export function TransactionsCategoryBarChart() {
	return (
		<div className="flex h-full w-full flex-col gap-4 p-4 sm:p-5">
			<div className="space-y-1">
				<p className="text-base font-medium tracking-tight">
					Gastos por período
				</p>
				<p className="text-sm text-muted-foreground">Janeiro – Junho 2024</p>
			</div>

			<ChartContainer
				className="aspect-auto min-h-48 w-full flex-1"
				config={chartConfig}
			>
				<BarChart
					accessibilityLayer
					data={chartData}
					layout="vertical"
					margin={{ right: 16 }}
				>
					<CartesianGrid horizontal={false} />
					<YAxis
						axisLine={false}
						dataKey="month"
						hide
						tickFormatter={(value) => String(value).slice(0, 3)}
						tickLine={false}
						tickMargin={10}
						type="category"
					/>
					<XAxis dataKey="desktop" hide type="number" />
					<ChartTooltip
						content={<ChartTooltipContent indicator="line" />}
						cursor={false}
					/>
					<Bar dataKey="desktop" fill="var(--color-desktop)" radius={4}>
						<LabelList
							className="fill-(--color-label)"
							dataKey="month"
							fontSize={12}
							offset={8}
							position="insideLeft"
						/>
						<LabelList
							className="fill-foreground"
							dataKey="desktop"
							fontSize={12}
							offset={8}
							position="right"
						/>
					</Bar>
				</BarChart>
			</ChartContainer>

			<div className="flex flex-col items-start gap-1.5 text-sm">
				<div className="flex items-center gap-2 font-medium leading-none">
					Tendência de alta de 5,2% neste mês
					<TrendingUp className="size-4" aria-hidden />
				</div>
				<p className="leading-none text-muted-foreground">
					Total de visitantes nos últimos 6 meses
				</p>
			</div>
		</div>
	);
}
