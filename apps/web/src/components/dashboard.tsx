import { CategoryRankChart } from "@/components/category-rank-chart";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { RefundReturnRateChart } from "@/components/refund-return-rate-chart";
import { RevenueChart } from "@/components/revenue-chart";

export function Dashboard() {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<RevenueChart />
			<RefundReturnRateChart />
			<CategoryRankChart />
			<OrderSourceMixChart />
		</div>
	);
}
