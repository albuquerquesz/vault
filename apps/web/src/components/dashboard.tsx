import { CategoryRankChart } from "@/components/category-rank-chart";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { RefundReturnRateChart } from "@/components/refund-return-rate-chart";

export function Dashboard() {
	return (
		<div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-10">
			<div className="h-full md:col-span-4">
				<RefundReturnRateChart />
			</div>
			<div className="h-full md:col-span-6">
				<OrderSourceMixChart totalNetWorth={1842} />
			</div>
			<div className="md:col-span-10">
				<CategoryRankChart />
			</div>
		</div>
	);
}
