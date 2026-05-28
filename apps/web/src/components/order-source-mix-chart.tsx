"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import {
	type ChartConfig,
	ChartContainer,
} from "@vault/ui/components/chart";
import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";

export type OrderSourceDatum = {
	source: string;
	percent: number;
	orders: number;
};

type OrderSourceMixChartProps = {
	data?: OrderSourceDatum[];
	totalOrders?: number;
	periodLabel?: string;
	deltaPct?: number;
};

const defaultData: OrderSourceDatum[] = [
	{ source: "Busca orgânica", percent: 37.9, orders: 698 },
	{ source: "Direto", percent: 28.0, orders: 516 },
	{ source: "Referência", percent: 15.0, orders: 276 },
	{ source: "Social pago", percent: 12.0, orders: 221 },
	{ source: "Outros", percent: 7.1, orders: 131 },
];

const slicePalette = [
	"color-mix(in oklab, var(--foreground) 35%, transparent)",
	"color-mix(in oklab, var(--foreground) 28%, transparent)",
	"color-mix(in oklab, var(--foreground) 22%, transparent)",
	"color-mix(in oklab, var(--foreground) 16%, transparent)",
	"color-mix(in oklab, var(--foreground) 10%, transparent)",
] as const;

const chartConfig = {
	orders: {
		label: "Pedidos",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

function formatSignedPercent(value: number): string {
	const sign = value > 0 ? "+" : "";
	return `${sign}${value.toFixed(1)}%`;
}

export function OrderSourceMixChart({
	data = defaultData,
	totalOrders,
	periodLabel = "últimos 30 dias",
	deltaPct = 0.5,
}: OrderSourceMixChartProps) {
	const safeData = data.length > 0 ? data : defaultData;
	const resolvedTotalOrders = useMemo(
		() => totalOrders ?? safeData.reduce((sum, row) => sum + row.orders, 0),
		[safeData, totalOrders],
	);

	return (
		<Card className="financial-panel-border ring-0 md:col-span-2">
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div className="space-y-1">
					<CardTitle>{resolvedTotalOrders.toLocaleString()}</CardTitle>
					<CardDescription>Total de pedidos em {periodLabel}</CardDescription>
				</div>
				<div className="space-y-1 text-right">
					<CardTitle className="text-sm">{formatSignedPercent(deltaPct)}</CardTitle>
					<CardDescription>vs 30 dias anteriores</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
					<ChartContainer className="h-56 w-full" config={chartConfig}>
						<PieChart accessibilityLayer>
							<Pie
								cx="50%"
								cy="50%"
								data={safeData}
								dataKey="orders"
								innerRadius={0}
								nameKey="source"
								outerRadius="86%"
								paddingAngle={0}
								stroke="var(--background)"
								strokeWidth={1}
							>
								{safeData.map((entry, index) => (
									<Cell
										key={entry.source}
										fill={slicePalette[index % slicePalette.length]}
									/>
								))}
							</Pie>
						</PieChart>
					</ChartContainer>

					<ul className="space-y-3" aria-label="Detalhamento das origens de pedidos">
						{safeData.map((row, index) => (
							<li
								key={row.source}
								className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3"
							>
								<span
									className="h-2.5 w-2.5 rounded-none"
									style={{
										backgroundColor: slicePalette[index % slicePalette.length],
									}}
								/>
								<span className="min-w-0 truncate text-sm">{row.source}</span>
								<span className="text-muted-foreground text-sm tabular-nums">
									{row.percent.toFixed(1)}%
								</span>
								<span className="text-muted-foreground text-sm tabular-nums">
									{row.orders.toLocaleString()}
								</span>
							</li>
						))}
					</ul>
				</div>
			</CardContent>
		</Card>
	);
}
