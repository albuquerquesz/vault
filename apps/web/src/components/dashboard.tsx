import { CategoryRankChart } from "@/components/category-rank-chart";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { RefundReturnRateChart } from "@/components/refund-return-rate-chart";

export function Dashboard() {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-10">
			<div className="md:col-span-3">
				<RefundReturnRateChart />
			</div>
			<div className="md:col-span-7">
				<OrderSourceMixChart totalNetWorth={1842} />
			</div>
			<div className="md:col-span-10">
				<CategoryRankChart />
			</div>
		</div>
	);
}
