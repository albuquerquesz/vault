"use client";

import {
	HeatmapChart,
	HeatmapCells,
	HeatmapLegend,
	HeatmapTooltip,
} from "@/components/charts/heatmap";
import type { HeatmapColumn } from "@/components/charts/heatmap";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";

type DailyExpensesHeatmapContentProps = {
	heatmapData: HeatmapColumn[];
	total: number;
	currency: string;
	locale: string;
};

function formatCurrency(
	value: number,
	currency: string,
	maximumFractionDigits = 1,
) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		notation: "compact",
		maximumFractionDigits,
	}).format(value);
}

export function DailyExpensesHeatmapContent({
	heatmapData,
	total,
	currency,
	locale,
}: DailyExpensesHeatmapContentProps) {
	return (
		<div className="flex flex-1 flex-col space-y-6">
			<div className="flex flex-col gap-3">
				<p className="text-3xl font-semibold tracking-tight sm:text-4xl">
					<MaskedMonetaryValue
						format={(value) => formatCurrency(value, currency)}
						value={total}
					/>
				</p>
			</div>

			<HeatmapChart
				binSize={16}
				data={heatmapData}
				gap={3}
				margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
				status="ready"
			>
				<HeatmapCells cornerRadius={3} />
				<HeatmapTooltip
					showDelay={300}
					formatLabel={(count: number, date: Date) =>
						`${new Intl.NumberFormat(locale, {
							style: "currency",
							currency,
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						}).format(count)} em despesas`
					}
				/>
			</HeatmapChart>

			<div className="flex justify-start md:justify-end">
				<HeatmapLegend lessLabel="Menor" moreLabel="Maior" cellSize={8} />
			</div>
		</div>
	);
}
