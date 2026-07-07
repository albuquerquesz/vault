"use client";

import { DailySpendingLimitCard } from "@/components/daily-spending-limit-card";
import { MonthlyBillCard } from "@/components/monthly-bill-card";
import { GoalsCard } from "@/components/goals-card";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { RecentTransactionsTable } from "@/components/recent-transactions-table";
import { SalesByHourHeatmap } from "@/components/sales-by-hour-heatmap";
import { authClient } from "@/lib/auth-client";

export function Dashboard() {
	const { data: session } = authClient.useSession();
	const firstName = session?.user.name?.split(" ")[0] ?? "";

	return (
		<div className="grid grid-cols-1 gap-4 pt-6">
			<h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:mb-6 sm:text-3xl xl:text-4xl">
				Bem-vindo de volta{firstName ? `, ${firstName}!` : "!"} 👋
			</h2>
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
				<OrderSourceMixChart />
				<MonthlyBillCard />
			</div>
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-10">
				<div className="xl:col-span-3">
					<SalesByHourHeatmap />
				</div>
				<div className="xl:col-span-3">
					<GoalsCard />
				</div>
				<div className="xl:col-span-4">
					<RecentTransactionsTable />
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-10">
				<div className="xl:col-span-3">
					<DailySpendingLimitCard />
				</div>
			</div>
		</div>
	);
}
