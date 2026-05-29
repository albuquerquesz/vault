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
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";

type MonthOverMonthTrend = "up" | "down" | "neutral";

export type OrderSourceDatum = {
	source: string;
	amount: number;
	orders: number;
	monthOverMonthTrend: MonthOverMonthTrend;
};

type OrderSourceMixChartProps = {
	data?: OrderSourceDatum[];
	totalOrders?: number;
	totalNetWorth: number;
	periodLabel?: string;
	deltaPct?: number;
};

const defaultData: OrderSourceDatum[] = [
	{ source: "Busca orgânica", amount: 698, orders: 698, monthOverMonthTrend: "up" },
	{ source: "Direto", amount: 516, orders: 516, monthOverMonthTrend: "neutral" },
	{ source: "Referência", amount: 276, orders: 276, monthOverMonthTrend: "up" },
	{ source: "Social pago", amount: 221, orders: 221, monthOverMonthTrend: "down" },
	{ source: "Outros", amount: 131, orders: 131, monthOverMonthTrend: "down" },
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

function TrendIcon({ trend }: { trend: MonthOverMonthTrend }) {
	if (trend === "up") {
		return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" aria-label="Melhor que mês passado" />;
	}

	if (trend === "down") {
		return <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" aria-label="Pior que mês passado" />;
	}

	return <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="Sem variação em relação ao mês passado" />;
}

export function OrderSourceMixChart({
	data = defaultData,
	totalOrders,
	totalNetWorth,
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

					<ul className="w-full" aria-label="Detalhamento das origens de pedidos">
						{safeData.map((row, index) => (
							<li
								key={row.source}
								className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-3 border-border border-b py-2.5 last:pb-1"
							>
								<span
									className="h-2.5 w-2.5 rounded-none"
									style={{
										backgroundColor: slicePalette[index % slicePalette.length],
									}}
								/>
								<span className="min-w-0 truncate text-sm">{row.source}</span>
								<span className="text-muted-foreground text-sm tabular-nums">
									{totalNetWorth > 0
										? `${((row.amount / totalNetWorth) * 100).toFixed(1)}%`
										: "0%"}
								</span>
								<span className="text-sm tabular-nums">
									{new Intl.NumberFormat("pt-BR", {
										style: "currency",
										currency: "BRL",
										maximumFractionDigits: 0,
									}).format(row.amount)}
								</span>
								<TrendIcon trend={row.monthOverMonthTrend} />
							</li>
						))}
					</ul>
				</div>
			</CardContent>
		</Card>
	);
}
