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
import { useFinanceExpenses } from "@/features/finance/sdk";

type MonthOverMonthTrend = "up" | "down" | "neutral";

export type OrderSourceDatum = {
	source: string;
	amount: number;
	orders: number;
	monthOverMonthTrend: MonthOverMonthTrend;
};

type OrderSourceMixChartProps = {
	title?: string;
};

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
	title = "Distribuição dos gastos",
}: OrderSourceMixChartProps) {
	const { data: expenses, isLoading } = useFinanceExpenses();

	const sourceData = useMemo(() => {
		if (!expenses || expenses.length === 0) return [] as OrderSourceDatum[];
		const grouped = new Map<string, { amount: number; count: number }>();

		for (const expense of expenses) {
			const existing = grouped.get(expense.category) ?? {
				amount: 0,
				count: 0,
			};
			existing.amount += expense.amount;
			existing.count += 1;
			grouped.set(expense.category, existing);
		}

		return Array.from(grouped.entries())
			.map(([source, { amount, count }]) => ({
				source,
				amount,
				orders: count,
				monthOverMonthTrend: "neutral" as const,
			}))
			.sort((a, b) => b.amount - a.amount);
	}, [expenses]);

	if (isLoading) {
		return <HomeCardSkeleton variant="mix" />;
	}

	if (!sourceData.length) {
		return (
			<Card className="financial-panel-border ring-0">
				<CardHeader className="border-b">
					<div className="flex items-center justify-between gap-2">
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
				<CardContent>
					<p className="text-sm text-muted-foreground">Nenhuma despesa registrada</p>
				</CardContent>
			</Card>
		);
	}

	const totalNetWorth = useMemo(
		() => sourceData.reduce((sum, row) => sum + row.amount, 0),
		[sourceData],
	);

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="border-b">
				<div className="flex items-center justify-between gap-2">
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
			<CardContent className="space-y-6">
				<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
					<DonutChart
						data={sourceData}
						totalValue={totalNetWorth}
					/>

					<div className="flex min-w-0 items-center">
						<ul
							className="w-full min-w-0"
							aria-label="Detalhamento das origens de pedidos"
						>
							{sourceData.map((row, index) => (
								<li
									key={row.source}
									className="flex flex-col gap-2 py-3 last:pb-1 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-x-4"
								>
									<div className="flex items-center gap-3 sm:contents">
										<span
											className="h-3 w-3 rounded-none"
											style={{
												backgroundColor:
													slicePalette[index % slicePalette.length],
											}}
										/>
										<span className="min-w-0 truncate text-base sm:text-lg">
											{row.source}
										</span>
									</div>
									<span className="text-sm text-muted-foreground tabular-nums sm:text-lg">
										{totalNetWorth > 0
											? `${((row.amount / totalNetWorth) * 100).toFixed(1)}%`
											: "0%"}
									</span>
									<span className="text-sm tabular-nums sm:text-lg">
										{new Intl.NumberFormat("pt-BR", {
											style: "currency",
											currency: "BRL",
											maximumFractionDigits: 0,
										}).format(row.amount)}
									</span>
									<div className="sm:justify-self-end">
										<TrendIcon trend={row.monthOverMonthTrend} />
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
