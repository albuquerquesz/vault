"use client";

import { authClient } from "@/lib/auth-client";
import { dashboardDetailDefinitions } from "@/components/dashboard-detail-definitions";
import { LastTransactionsTable } from "@/components/last-transactions-table";
import { MonthlyBillCard } from "@/components/monthly-bill-card";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { SalesByHourHeatmap } from "@/components/sales-by-hour-heatmap";
import { TrafficSourcesCard } from "@/components/traffic-sources-card";

export function Dashboard() {
	const { data: session } = authClient.useSession();
	const firstName = session?.user.name?.split(" ")[0] ?? "";

	return (
		<div className="grid grid-cols-1 gap-4">
			<h2 className="text-4xl font-semibold tracking-tight text-foreground">
				Bem-vindo de volta{firstName ? `, ${firstName}!` : "!"} 👋
			</h2>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-[70%_30%]">
				<OrderSourceMixChart
					detailHref={dashboardDetailDefinitions.expenseDistribution.path}
					totalNetWorth={1842}
				/>
				<MonthlyBillCard />
			</div>
			<div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
				<div className="h-full">
					<LastTransactionsTable />
				</div>
				<div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
					<div className="h-full">
						<TrafficSourcesCard
							detailHref={dashboardDetailDefinitions.trafficSources.path}
						/>
					</div>
					<div className="h-full">
						<SalesByHourHeatmap
							detailHref={dashboardDetailDefinitions.dailyExpenses.path}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
