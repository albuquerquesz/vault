"use client";

import { dashboardDetailDefinitions } from "@/components/dashboard-detail-definitions";
import { MonthlyBillCard } from "@/components/monthly-bill-card";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { RecentTransactionsTable } from "@/components/recent-transactions-table";
import { SalesByHourHeatmap } from "@/components/sales-by-hour-heatmap";
import { authClient } from "@/lib/auth-client";

export function Dashboard() {
	const { data: session } = authClient.useSession();
	const firstName = session?.user.name?.split(" ")[0] ?? "";

	return (
		<div className="grid grid-cols-1 gap-4">
			<h2 className="text-4xl font-semibold tracking-tight text-foreground mb-6">
				Bem-vindo de volta{firstName ? `, ${firstName}!` : "!"} 👋
			</h2>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
				<OrderSourceMixChart
					detailHref={dashboardDetailDefinitions.expenseDistribution.path}
					totalNetWorth={1842}
				/>
				<MonthlyBillCard />
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
				<SalesByHourHeatmap
					detailHref={dashboardDetailDefinitions.dailyExpenses.path}
				/>
				<RecentTransactionsTable />
			</div>
		</div>
	);
}
