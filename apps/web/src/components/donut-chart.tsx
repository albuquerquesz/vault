"use client";

import { type ChartConfig, ChartContainer } from "@vault/ui/components/chart";
import { cn } from "@vault/ui/lib/utils";
import { Cell, Pie, PieChart as RechartsPieChart, Text } from "recharts";
import { slicePalette } from "@/components/pie-chart";

const chartConfig = {
	orders: {
		label: "Pedidos",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

type DonutChartProps = {
	data: readonly { source: string; orders: number }[];
	totalValue: string;
	className?: string;
};

export function DonutChart({ data, totalValue, className }: DonutChartProps) {
	return (
		<div className={cn("relative h-[28rem] w-full lg:h-[24rem]", className)}>
			<ChartContainer config={chartConfig}>
				<RechartsPieChart accessibilityLayer>
					<Pie
						cx="50%"
						cy="50%"
						data={data}
						dataKey="orders"
						innerRadius={60}
						nameKey="source"
						outerRadius={90}
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
					<Text
						x="50%"
						y="50%"
						textAnchor="middle"
						dominantBaseline="central"
						fill="var(--foreground)"
						fontSize={24}
						fontWeight={600}
					>
						{totalValue}
					</Text>
				</RechartsPieChart>
			</ChartContainer>
		</div>
	);
}
