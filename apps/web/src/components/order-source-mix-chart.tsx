"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { type ChartConfig, ChartContainer } from "@vault/ui/components/chart";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { DashboardCardLinkButton } from "@/components/dashboard-card-link-button";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";

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
	loading?: boolean;
	title?: string;
	detailHref?: string;
};

const defaultData: OrderSourceDatum[] = [
	{
		source: "Busca orgânica",
		amount: 698,
		orders: 698,
		monthOverMonthTrend: "up",
	},
	{
		source: "Direto",
		amount: 516,
		orders: 516,
		monthOverMonthTrend: "neutral",
	},
	{ source: "Referência", amount: 276, orders: 276, monthOverMonthTrend: "up" },
	{
		source: "Social pago",
		amount: 221,
		orders: 221,
		monthOverMonthTrend: "down",
	},
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
		return (
			<ArrowUpRight
				className="h-4.5 w-4.5 text-emerald-500"
				aria-label="Melhor que mês passado"
			/>
		);
	}

	if (trend === "down") {
		return (
			<ArrowDownRight
				className="h-4.5 w-4.5 text-rose-500"
				aria-label="Pior que mês passado"
			/>
		);
	}

	return (
		<ArrowRight
			className="h-4.5 w-4.5 text-muted-foreground"
			aria-label="Sem variação em relação ao mês passado"
		/>
	);
}

export function OrderSourceMixChart({
	data = defaultData,
	totalOrders,
	totalNetWorth,
	title = "Distribuição dos gastos",
	periodLabel = "últimos 30 dias",
	deltaPct = 0.5,
	loading = false,
	detailHref,
}: OrderSourceMixChartProps) {
	if (loading) {
		return <HomeCardSkeleton variant="mix" />;
	}

	const safeData = data.length > 0 ? data : defaultData;
	const resolvedTotalOrders = useMemo(
		() => totalOrders ?? safeData.reduce((sum, row) => sum + row.orders, 0),
		[safeData, totalOrders],
	);

	return (
		<Card className="financial-panel-border h-full min-h-[32rem] ring-0 md:col-span-2">
			<CardHeader className="gap-4">
				<div className="flex items-start justify-between gap-4">
					<CardDescription className="text-base">{title}</CardDescription>
					{detailHref ? (
						<DashboardCardLinkButton
							label={`Abrir ${title}`}
							to={detailHref}
						/>
					) : null}
				</div>

				<div className="flex flex-row items-start justify-between gap-4">
					<div className="space-y-1">
						<CardTitle className="text-4xl">
							{resolvedTotalOrders.toLocaleString()}
						</CardTitle>
						<CardDescription className="text-lg">
							Total de despesas em {periodLabel}
						</CardDescription>
					</div>
					<div className="space-y-1 text-right">
						<CardTitle className="text-3xl">
							{formatSignedPercent(deltaPct)}
						</CardTitle>
						<CardDescription className="text-lg">
							vs 30 dias anteriores
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
					<ChartContainer className="h-80 w-full lg:h-72" config={chartConfig}>
						<PieChart accessibilityLayer>
							<Pie
								cx="50%"
								cy="50%"
								data={safeData}
								dataKey="orders"
								innerRadius={0}
								nameKey="source"
								outerRadius="90%"
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

					<ul
						className="w-full"
						aria-label="Detalhamento das origens de pedidos"
					>
						{safeData.map((row, index) => (
							<li
								key={row.source}
								className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4 py-3 last:pb-1"
							>
								<span
									className="h-3 w-3 rounded-none"
									style={{
										backgroundColor: slicePalette[index % slicePalette.length],
									}}
								/>
								<span className="min-w-0 truncate text-lg">{row.source}</span>
								<span className="text-muted-foreground text-lg tabular-nums">
									{totalNetWorth > 0
										? `${((row.amount / totalNetWorth) * 100).toFixed(1)}%`
										: "0%"}
								</span>
								<span className="text-lg tabular-nums">
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
