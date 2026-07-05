"use client";

import { type ChartConfig, ChartContainer } from "@vault/ui/components/chart";
import { cn } from "@vault/ui/lib/utils";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { AnimatedNumber } from "@/components/animated-number";
import { slicePalette } from "@/components/pie-chart";

const currencyFmt = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
	maximumFractionDigits: 0,
});

const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "long" });

const chartConfig = {
	orders: {
		label: "Pedidos",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

type DonutChartProps = {
	data: readonly { source: string; orders: number }[];
	totalValue: number;
	className?: string;
};

export function DonutChart({ data, totalValue, className }: DonutChartProps) {
	const month = monthFmt.format(new Date()).replace(/^\w/, (c) => c.toUpperCase());

	return (
		<div className={cn("relative flex items-center justify-center w-full", className)}>
			<ChartContainer config={chartConfig} className="h-[28rem] max-h-[28rem] w-full lg:h-[24rem] lg:max-h-[24rem]">
				<RechartsPieChart
					width={400}
					height={400}
					accessibilityLayer
				>
					<Pie
						cx="50%"
						cy="50%"
						data={data}
						dataKey="orders"
						innerRadius={70}
						nameKey="source"
						outerRadius={120}
						paddingAngle={0}
						stroke="var(--background)"
						strokeWidth={1}
					>
						{data.map((entry, index) => (
							<Cell
								key={entry.source}
								fill={slicePalette[index % slicePalette.length]}
							/>
						))}
					</Pie>
				</RechartsPieChart>
			</ChartContainer>
			<div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
				<span className="text-sm text-muted-foreground capitalize">{month}</span>
				<AnimatedNumber
					value={totalValue}
					format={(v) => currencyFmt.format(v)}
					className="text-2xl font-semibold text-foreground"
				/>
			</div>
		</div>
	);
}
