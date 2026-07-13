"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { DonutChart } from "@/components/donut-chart";
import { slicePalette } from "@/components/pie-chart";
import type { OrderSourceDatum } from "./use-order-source-mix";

function TrendIcon({
	trend,
}: {
	trend: OrderSourceDatum["monthOverMonthTrend"];
}) {
	if (trend === "up") {
		return (
			<ArrowUpRight
				className="h-4.5 w-4.5 text-emerald-500"
				aria-label="Melhor que mês passado"
			/>
		);
	}

	if (trend === "down") {
		return (
			<ArrowDownRight
				className="h-4.5 w-4.5 text-rose-500"
				aria-label="Pior que mês passado"
			/>
		);
	}

	return (
		<ArrowRight
			className="h-4.5 w-4.5 text-muted-foreground"
			aria-label="Sem variação em relação ao mês passado"
		/>
	);
}

export function OrderSourceMixContent({
	sourceData,
}: {
	sourceData: OrderSourceDatum[];
}) {
	return (
		<div className="flex flex-1 items-center justify-center gap-8">
			<div className="relative h-[180px] w-[180px] shrink-0">
				<DonutChart
					data={sourceData.map((datum) => ({
						source: datum.source,
						orders: datum.orders,
					}))}
					totalValue={sourceData.reduce((sum, datum) => sum + datum.orders, 0)}
					className="h-[180px] w-[180px]"
				/>
			</div>

			<div className="flex h-[180px] flex-col justify-evenly">
				{sourceData.map((datum, index) => (
					<div key={datum.source} className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<span
								className="size-3 rounded-full"
								style={{
									backgroundColor: slicePalette[index % slicePalette.length],
								}}
							/>
							<span className="text-sm text-muted-foreground">{datum.source}</span>
						</div>
						<div className="ml-auto flex items-center gap-2">
							<span className="text-sm font-medium tabular-nums">
								{datum.percentage.toFixed(1)}%
							</span>
							<TrendIcon trend={datum.monthOverMonthTrend} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
