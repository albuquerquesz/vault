"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@vault/ui/components/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@vault/ui/components/tooltip";
import {
	ArrowDownRight,
	ArrowRight,
	ArrowUpRight,
	Info,
	PieChartIcon,
} from "lucide-react";
import { useMemo } from "react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { DonutChart } from "@/components/donut-chart";
import { slicePalette } from "@/components/pie-chart";

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
	loading = false,
	detailHref,
}: OrderSourceMixChartProps) {
	if (loading) {
		return <HomeCardSkeleton variant="mix" />;
	}

	const safeData = data.length > 0 ? data : defaultData;
	const _resolvedTotalOrders = useMemo(
		() => totalOrders ?? safeData.reduce((sum, row) => sum + row.orders, 0),
		[safeData, totalOrders],
	);

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="border-b gap-4 pb-2">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<PieChartIcon className="size-4 text-muted-foreground" />
						<CardDescription className="text-base">{title}</CardDescription>
					</div>
					<Tooltip>
						<TooltipTrigger render={<Info className="size-4 text-muted-foreground" />} />
						<TooltipContent>Mostra a distribuição dos seus gastos por categoria</TooltipContent>
					</Tooltip>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
					<DonutChart
						data={safeData}
						totalValue={new Intl.NumberFormat("pt-BR", {
							style: "currency",
							currency: "BRL",
							maximumFractionDigits: 0,
						}).format(totalNetWorth)}
					/>

					<div className="flex items-center">
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
											backgroundColor:
												slicePalette[index % slicePalette.length],
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
				</div>
			</CardContent>
		</Card>
	);
}
