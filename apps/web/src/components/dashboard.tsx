import { CategoryRankChart } from "@/components/category-rank-chart";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { RefundReturnRateChart } from "@/components/refund-return-rate-chart";

export function Dashboard() {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<RefundReturnRateChart />
			<OrderSourceMixChart totalNetWorth={1842} />
			<CategoryRankChart />
		</div>
	);
}
