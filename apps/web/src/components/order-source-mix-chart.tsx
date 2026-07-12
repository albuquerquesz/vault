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
import { DonutChart } from "@/components/donut-chart";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
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

		const total = Array.from(grouped.values()).reduce(
			(sum, v) => sum + v.amount,
			0,
		);

		return Array.from(grouped.entries())
			.map(([source, { amount, count }]) => ({
				source,
				amount,
				orders: count,
				monthOverMonthTrend:
					amount / total > 0.5
						? "up"
						: amount / total < 0.3
							? "down"
							: "neutral",
			}))
			.sort((a, b) => b.amount - a.amount) as OrderSourceDatum[];
	}, [expenses]);

	if (isLoading) {
		return <HomeCardSkeleton variant="mix" />;
	}

	const header = (
		<div className="flex items-center justify-between gap-2">
			<div className="flex items-center gap-2">
				<PieChartIcon className="size-4 text-muted-foreground" />
				<CardDescription className="text-base">{title}</CardDescription>
			</div>
			<Tooltip>
				<TooltipTrigger
					render={() => <Info className="size-4 text-muted-foreground" />}
				/>
				<TooltipContent>
					Resumo da distribuicao dos gastos por categoria
				</TooltipContent>
			</Tooltip>
		</div>
	);

	if (!sourceData.length) {
		return (
			<Card className="financial-panel-border flex h-full min-h-[24rem] w-full flex-col ring-0">
				<CardHeader className="border-b">{header}</CardHeader>
				<CardContent className="flex flex-1 items-center justify-center">
					<p className="text-sm text-muted-foreground">
						Nenhuma despesa registrada
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="financial-panel-border flex h-full min-h-[24rem] w-full flex-col ring-0">
			<CardHeader className="border-b">{header}</CardHeader>
			<CardContent className="flex flex-1 items-center justify-center gap-8">
				<div className="relative h-[180px] w-[180px] shrink-0">
					<DonutChart
						data={sourceData.map((d) => ({
							source: d.source,
							orders: d.orders,
						}))}
						totalValue={sourceData.reduce((sum, d) => sum + d.orders, 0)}
						className="h-[180px] w-[180px]"
					/>
				</div>

				<div className="flex h-[180px] flex-col justify-evenly">
					{sourceData.map((d, i) => (
						<div key={d.source} className="flex items-center gap-3">
							<div className="flex items-center gap-2">
								<span
									className="size-3 rounded-full"
									style={{
										backgroundColor: slicePalette[i % slicePalette.length],
									}}
								/>
								<span className="text-sm text-muted-foreground">
									{d.source}
								</span>
							</div>
							<div className="ml-auto flex items-center gap-2">
								<span className="text-sm font-medium tabular-nums">
									{(
										(d.amount / sourceData.reduce((s, v) => s + v.amount, 0)) *
										100
									).toFixed(1)}
									%
								</span>
								<TrendIcon trend={d.monthOverMonthTrend} />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
