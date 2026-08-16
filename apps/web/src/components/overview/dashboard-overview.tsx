"use client";

import { DailySpendBarCard } from "@/components/overview/daily-spend-bar/daily-spend-bar-card";
import { useDashboardOverview } from "@/components/overview/hooks/use-dashboard-overview";
import { MonthlySpendingGoalCard } from "@/components/monthly-spending-goal-card";
import { MonthlyBillCard } from "@/components/overview/monthly-bill/monthly-bill-card";
import { OrderSourceMixCard } from "@/components/overview/order-source-mix/order-source-mix-card";
import { PartialResultCard } from "@/components/overview/partial-result/partial-result-card";
import { OverviewMonthSelect } from "@/components/overview/shared/overview-month-select";

export function DashboardOverview() {
	const { firstName, monthOptions, selectedMonth, setSelectedMonth } =
		useDashboardOverview();

	return (
		<div className="grid min-w-0 grid-cols-1 gap-3 overflow-x-clip pt-3 sm:gap-4 sm:pt-6 md:overflow-x-visible">
			<div className="mb-2 flex min-w-0 flex-col items-start justify-between gap-2 sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
				<h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-3xl xl:text-4xl">
					Bem-vindo de volta{firstName ? `, ${firstName}!` : "!"} 👋
				</h2>
				<div className="min-w-0 w-full sm:w-auto">
					<OverviewMonthSelect
						onValueChange={setSelectedMonth}
						options={monthOptions}
						value={selectedMonth}
					/>
				</div>
			</div>
			<div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 xl:h-118 xl:grid-cols-[2fr_1fr]">
				<OrderSourceMixCard month={selectedMonth} />
				<MonthlyBillCard month={selectedMonth} />
			</div>
			<div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-10">
				<div className="flex min-h-0 min-w-0 flex-col gap-4 xl:col-span-4 xl:h-full">
					<div className="min-h-0 min-w-0 xl:flex-1">
						<PartialResultCard
							className="min-h-0 sm:min-h-0 xl:min-h-0"
							month={selectedMonth}
						/>
					</div>
					<div className="min-h-0 min-w-0 xl:flex-1">
						<MonthlySpendingGoalCard month={selectedMonth} />
					</div>
				</div>
				<div className="min-w-0 xl:col-span-6">
					<DailySpendBarCard month={selectedMonth} />
				</div>
			</div>
		</div>
	);
}
