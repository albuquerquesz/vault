"use client";

import { useQueries } from "@tanstack/react-query";
import { Skeleton } from "@vault/ui/components/skeleton";
import {
	Bar,
	BarChart,
	BarXAxis,
	ChartTooltip,
} from "@/components/bar-chart";
import {
	MaskedMonetaryText,
	MaskedMonetaryValue,
	maskMonetaryText,
	useMonetaryVisibility,
} from "@/components/monetary-visibility";
import { financeSdk, useMonthlySpendingGoal } from "@/features/finance/sdk";
import { usePartialResult } from "./partial-result/hooks/use-partial-result";
import { OverviewMonthSelect } from "./shared/overview-month-select";

const currency = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});
const money = (value: number) => (
	<MaskedMonetaryValue
		value={value}
		format={(amount) => currency.format(amount)}
	/>
);
const monthLabels = [
	"Jan",
	"Fev",
	"Mar",
	"Abr",
	"Mai",
	"Jun",
	"Jul",
	"Ago",
	"Set",
	"Out",
	"Nov",
	"Dez",
];

export function DashboardSummary({
	month,
	monthOptions,
	onMonthChange,
}: {
	month: string;
	monthOptions: { value: string; label: string }[];
	onMonthChange: (month: string) => void;
}) {
	const { metrics, isLoading, isError } = usePartialResult(month);
	const goal = useMonthlySpendingGoal(month);
	const { isVisible } = useMonetaryVisibility();
	const [year, selectedMonth] = month.split("-").map(Number);
	const history = useQueries({
		queries: Array.from({ length: selectedMonth ?? 1 }, (_, index) =>
			financeSdk.partialResultOptions(
				`${year}-${String(index + 1).padStart(2, "0")}`,
			),
		),
	});
	const historyLoading = history.some((query) => query.isPending);
	const historyError = history.some((query) => query.isError);
	const monthlyData = history.map((query, index) => ({
		name: monthLabels[index],
		balance:
			query.isError || query.isPending ? null : (query.data?.result ?? 0),
		selected: index === (selectedMonth ?? 1) - 1,
	}));
	const values = monthlyData.flatMap((point) =>
		typeof point.balance === "number" ? [point.balance] : [],
	);
	const highestBalance = values.length > 0 ? Math.max(...values) : null;
	const chartData = monthlyData.map((point) => ({
		...point,
		highest: point.balance !== null && point.balance === highestBalance,
	}));
	const low = Math.min(0, ...values);
	const high = Math.max(0, ...values);
	const domain: [number, number] =
		low === 0 && high === 0 ? [0, 1] : [low * 1.1, high * 1.1];
	const total = values.reduce((sum, value) => sum + value, 0);
	const target = goal.isError ? null : goal.data?.targetAmount;
	const dailyLimit =
		target == null || goal.isError ? null : goal.data?.dailyLimit;
	const stats = [
		{
			label: "Recebido",
			dotClassName: "bg-sky-400",
			loading: isLoading,
			value: isError ? null : (metrics?.income ?? 0),
		},
		{
			label: "Gasto",
			dotClassName: "bg-amber-500",
			loading: isLoading,
			value: isError ? null : (metrics?.spent ?? 0),
		},
		{
			label: "Limite diário",
			dotClassName: "bg-red-500",
			loading: goal.isPending,
			value: dailyLimit,
		},
	];

	return (
		<section
			aria-label="Resumo do mês"
			className="grid min-w-0 gap-6 rounded-[18px] bg-muted/40 p-6 xl:min-h-[360px] xl:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]"
		>
			<div className="flex min-w-0 flex-col gap-6 rounded-xl bg-background/70 p-6 dark:bg-secondary/70">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h1 className="text-base font-medium">Saldo do mês</h1>
					<OverviewMonthSelect
						value={month}
						options={monthOptions}
						onValueChange={onMonthChange}
					/>
				</div>
				<div className="space-y-3">
					{isLoading ? (
						<Skeleton className="h-14 w-3/4" />
					) : (
						<p className="break-words text-4xl font-sans font-medium leading-tight tracking-tight tabular-nums sm:text-5xl">
							{money(isError ? 0 : (metrics?.result ?? 0))}
						</p>
					)}
					{isLoading ? (
						<Skeleton className="h-4 w-2/3" />
					) : isError ? null : (
						<p className="text-sm text-muted-foreground">
							{metrics?.changePercent != null && (
								<>
									<MaskedMonetaryText prefix="">{`${metrics.changePercent > 0 ? "+" : ""}${metrics.changePercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}</MaskedMonetaryText>{" "}
									vs. mês anterior ·{" "}
								</>
							)}
							Saldo anterior: {money(metrics?.previousResult ?? 0)}
						</p>
					)}
				</div>
				<div className="mt-auto grid min-w-0 grid-cols-1 gap-4 border-t border-border/60 pt-4 sm:grid-cols-3 sm:gap-0">
					{stats.map((stat) => (
						<div
							key={stat.label}
							className="min-w-0 space-y-2 border-border/60 not-first:border-t not-first:pt-4 sm:not-first:border-t-0 sm:not-first:border-l sm:not-first:pt-0 sm:not-first:pl-2 sm:not-last:pr-2"
						>
							<p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
								<span
									aria-hidden="true"
									className={`size-1.5 shrink-0 rounded-full ${stat.dotClassName}`}
								/>
								{stat.label}
							</p>
							{stat.loading ? (
								<Skeleton className="h-6 w-24" />
							) : (
								<p className="break-words text-2xl font-sans font-medium leading-tight tracking-tight tabular-nums sm:text-base xl:text-sm 2xl:text-2xl">
									{money(stat.value ?? 0)}
								</p>
							)}
						</div>
					))}
				</div>
			</div>
			<div className="flex min-w-0 flex-col gap-3 py-2 xl:pl-2">
				<h2 className="text-sm font-medium text-muted-foreground">
					Saldo acumulado em {year}
				</h2>
				{historyLoading ? (
					<Skeleton className="h-9 w-48" />
				) : (
					<p className="break-words text-3xl font-sans font-medium tracking-tight tabular-nums">
						{money(historyError ? 0 : total)}
					</p>
				)}
				<BarChart
					data={chartData}
					valueDomain={domain}
					xDataKey="name"
					className="h-52 min-w-0 flex-1"
					aspectRatio="auto"
					margin={{ top: 12, right: 8, bottom: 42, left: 8 }}
					status={historyLoading ? "loading" : "ready"}
					barGap={0.35}
				>
					<Bar
						dataKey="balance"
						lineCap={6}
						animate={false}
						fill="var(--chart-3)"
						fillAccessor={(point) =>
							point.highest
								? "var(--foreground)"
								: "var(--chart-3)"
						}
					/>
					<BarXAxis labelClassName="text-sm" maxLabels={12} />
					<ChartTooltip
						rows={(point) => [
							{
								label: `${point.name}${point.highest ? " · maior saldo" : ""}`,
								color: point.highest
									? "var(--foreground)"
									: "var(--chart-3)",
								value:
									typeof point.balance === "number"
										? maskMonetaryText(
												currency.format(point.balance),
												isVisible,
											)
										: "Indisponível",
							},
						]}
						showDatePill={false}
						showCrosshair={false}
						showDots={false}
					/>
				</BarChart>
			</div>
		</section>
	);
}
