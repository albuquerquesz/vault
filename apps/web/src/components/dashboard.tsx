import { MonthlyBillsCard } from "@/components/monthly-bills-card";
import { OrderSourceMixChart } from "@/components/order-source-mix-chart";
import { SalesByHourHeatmap } from "@/components/sales-by-hour-heatmap";
import { TopOverviewSection } from "@/components/top-overview-section";
import { TrafficSourcesCard } from "@/components/traffic-sources-card";

export function Dashboard() {
	return (
		<div className="grid grid-cols-1 gap-6">
			<TopOverviewSection />
			<div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
				<div className="h-full">
					<MonthlyBillsCard />
				</div>
				<div className="h-full">
					<OrderSourceMixChart totalNetWorth={1842} />
				</div>
			</div>
			<div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
				<div className="h-full">
					<TrafficSourcesCard />
				</div>
				<div className="h-full">
					<SalesByHourHeatmap />
				</div>
			</div>
		</div>
	);
}
