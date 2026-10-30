"use client";

import { DailySpendBarCard } from "@/components/overview/daily-spend-bar/daily-spend-bar-card";
import { GoalsCard } from "@/components/overview/goals/goals-card";
import { useDashboardOverview } from "@/components/overview/hooks/use-dashboard-overview";
import { MonthlyBillCard } from "@/components/overview/monthly-bill/monthly-bill-card";
import { OrderSourceMixCard } from "@/components/overview/order-source-mix/order-source-mix-card";
import { DashboardSummary } from "./dashboard-summary";

export function DashboardOverview() {
	const { monthOptions, selectedMonth, setSelectedMonth } =
		useDashboardOverview();
	return (
		<div className="grid min-w-0 gap-6 py-4 sm:py-6">
			<DashboardSummary
				month={selectedMonth}
				monthOptions={monthOptions}
				onMonthChange={setSelectedMonth}
			/>
			<div className="dashboard-analyses grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				<div className="min-h-0 min-w-0">
					<OrderSourceMixCard month={selectedMonth} />
				</div>
				<div className="min-h-0 min-w-0">
					<MonthlyBillCard month={selectedMonth} />
				</div>
				<div className="min-h-0 min-w-0">
					<GoalsCard />
				</div>
				<div className="min-w-0 md:col-span-2 xl:col-span-3">
					<DailySpendBarCard month={selectedMonth} />
				</div>
			</div>
		</div>
	);
}
