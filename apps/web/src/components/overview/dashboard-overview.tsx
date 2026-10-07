"use client";

import { DailySpendBarCard } from "@/components/overview/daily-spend-bar/daily-spend-bar-card";
import { useDashboardOverview } from "@/components/overview/hooks/use-dashboard-overview";
import { MonthlyBillCard } from "@/components/overview/monthly-bill/monthly-bill-card";
import { OrderSourceMixCard } from "@/components/overview/order-source-mix/order-source-mix-card";
import { OverviewMonthSelect } from "@/components/overview/shared/overview-month-select";
import { DashboardMonthTotals, DashboardSummary } from "./dashboard-summary";

export function DashboardOverview() {
	const { firstName, monthOptions, selectedMonth, setSelectedMonth } = useDashboardOverview();
	return (
		<div className="grid min-w-0 gap-4 py-4 sm:py-6">
			<div className="grid min-w-0 gap-4 xl:grid-cols-[3fr_2fr]">
				<section className="flex min-w-0 flex-col gap-6 rounded-2xl bg-muted/20 p-5 sm:p-8" aria-label="Resumo do mês">
					<div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Suas finanças</p><OverviewMonthSelect onValueChange={setSelectedMonth} options={monthOptions} value={selectedMonth} /></div>
					<div className="space-y-4">
						<h1 className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl xl:text-4xl">Bem-vindo{firstName ? `, ${firstName}!` : "!"}</h1>
						<p className="text-sm text-muted-foreground">Acompanhe suas finanças do mês.</p>
					</div>
					<DashboardMonthTotals month={selectedMonth} />
				</section>
				<DashboardSummary month={selectedMonth} />
			</div>
			<div className="dashboard-analyses grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 [&_[data-slot=card]]:md:min-h-[480px]">
				<div className="min-w-0 md:col-span-2 xl:col-span-1"><DailySpendBarCard month={selectedMonth} /></div>
				<div className="min-w-0"><MonthlyBillCard month={selectedMonth} /></div>
				<div className="min-w-0"><OrderSourceMixCard month={selectedMonth} /></div>
			</div>
		</div>
	);
}
