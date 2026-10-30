"use client";

import { type ReactNode, useMemo } from "react";
import {
	Area,
	AreaChart,
	ChartTooltip,
	Grid,
	XAxis,
} from "@/components/area-chart";
import {
	maskMonetaryText,
	useMonetaryVisibility,
} from "@/components/monetary-visibility";
import type { FinanceTransaction } from "@/features/finance/sdk";
import { formatBRL, isExpenseTransaction } from "./utils";

type DailySpendDatum = {
	date: Date;
	amount: number;
};

const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
	day: "numeric",
	month: "short",
});

function getVisibleDays(month: string, today = new Date()) {
	const [year, monthNumber] = month.split("-").map(Number);
	if (!year || !monthNumber) {
		return 0;
	}

	const daysInMonth = new Date(year, monthNumber, 0).getDate();
	const isCurrentMonth =
		year === today.getFullYear() && monthNumber === today.getMonth() + 1;

	return isCurrentMonth ? Math.min(today.getDate(), daysInMonth) : daysInMonth;
}

/** Aggregates monthly expenses and adds zero-value days for a continuous series. */
export function buildDailySpendRows(
	transactions: FinanceTransaction[],
	month: string,
	today = new Date(),
): DailySpendDatum[] {
	const [year, monthNumber] = month.split("-").map(Number);
	const visibleDays = getVisibleDays(month, today);
	if (!year || !monthNumber || visibleDays === 0) {
		return [];
	}

	const totals = new Array<number>(visibleDays).fill(0);
	for (const transaction of transactions) {
		if (!isExpenseTransaction(transaction)) {
			continue;
		}

		const dateKey = transaction.date.slice(0, 10);
		if (!dateKey.startsWith(`${month}-`)) {
			continue;
		}

		const day = Number(dateKey.slice(8, 10));
		if (!Number.isInteger(day) || day < 1 || day > visibleDays) {
			continue;
		}

		totals[day - 1] =
			(totals[day - 1] ?? 0) + Math.abs(Number(transaction.amount) || 0);
	}

	return totals.map((amount, index) => ({
		amount,
		date: new Date(year, monthNumber - 1, index + 1, 12),
	}));
}

type TransactionsDailySpendAreaChartProps = {
	transactions: FinanceTransaction[];
	month: string;
	headerAction?: ReactNode;
};

export function TransactionsDailySpendAreaChart({
	transactions,
	month,
	headerAction,
}: TransactionsDailySpendAreaChartProps) {
	const chartData = useMemo(
		() => buildDailySpendRows(transactions, month),
		[month, transactions],
	);
	const { isVisible } = useMonetaryVisibility();
	const hasExpenses = chartData.some((row) => row.amount > 0);

	return (
		<div className="flex w-full min-w-0 flex-col gap-5 p-4 sm:p-5">
			<ChartHeader action={headerAction} />
			{hasExpenses ? (
				<AreaChart
					aspectRatio="auto"
					className="h-96 sm:h-[28rem]"
					data={chartData}
					margin={{ top: 12, right: 16, bottom: 40, left: 12 }}
					xDataKey="date"
				>
					<Grid hideHorizontalEdgeLines numTicksRows={4} />
					<Area
						dataKey="amount"
						fill="var(--chart-2)"
						fillOpacity={0.36}
						gradientToOpacity={0.03}
						stroke="var(--chart-2)"
						strokeWidth={2.5}
					/>
					<XAxis formatTick={(date) => dayFormatter.format(date)} numTicks={6} />
					<ChartTooltip
						rows={(point) => {
							const date = point.date;
							const amount =
								typeof point.amount === "number" ? point.amount : 0;

							return [
								{
									color: "var(--chart-2)",
									label:
										date instanceof Date
											? dateFormatter.format(date)
											: "Gasto diário",
									value: maskMonetaryText(formatBRL(amount), isVisible),
								},
							];
						}}
						showDatePill={false}
					/>
				</AreaChart>
			) : (
				<div className="flex h-72 items-center justify-center text-center text-sm text-muted-foreground sm:h-80">
					Nenhuma despesa neste período.
				</div>
			)}
		</div>
	);
}

function ChartHeader({ action }: { action?: ReactNode }) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-3">
			<div className="space-y-1">
				<p className="text-xl font-medium tracking-tight">Gastos ao longo do mês</p>
				<p className="text-sm text-muted-foreground">
					Acompanhe as despesas diárias do período.
				</p>
			</div>
			{action}
		</div>
	);
}
