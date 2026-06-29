import { CategoryRankChart } from "@/components/category-rank-chart";
import { MonthlyBillsCard } from "@/components/monthly-bills-card";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { RefundReturnRateChart } from "@/components/refund-return-rate-chart";
import { SalesByHourHeatmap } from "@/components/sales-by-hour-heatmap";

export function Dashboard() {
	return (
		<div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-10">
			<div className="h-full md:col-span-4">
				<RefundReturnRateChart />
			</div>
			<div className="h-full md:col-span-6">
				<OrderSourceMixChart totalNetWorth={1842} />
			</div>
			<div className="grid grid-cols-1 gap-6 md:col-span-10 lg:grid-cols-3">
				<div className="h-full">
					<SalesByHourHeatmap />
				</div>
				<div className="h-full">
					<MonthlyBillsCard />
				</div>
				<div className="h-full">
					<CategoryRankChart />
				</div>
			</div>
		</div>
	);
}
