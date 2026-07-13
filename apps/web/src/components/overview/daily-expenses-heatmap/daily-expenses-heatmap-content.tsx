"use client";

import {
	HeatmapChart,
	HeatmapCells,
	HeatmapXAxis,
	HeatmapYAxis,
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
	periodLabel: string;
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
	periodLabel,
}: DailyExpensesHeatmapContentProps) {
	return (
		<div className="flex flex-1 flex-col space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
				<div className="space-y-2">
					<p className="text-3xl font-semibold tracking-tight sm:text-4xl">
						<MaskedMonetaryValue
							format={(value) => formatCurrency(value, currency)}
							value={total}
						/>
					</p>
					<p className="text-sm text-muted-foreground sm:pt-1">
						{periodLabel}
					</p>
				</div>
			</div>

			<HeatmapChart data={heatmapData} gap={3} status="ready">
				<HeatmapCells cornerRadius={3} />
				<HeatmapXAxis />
				<HeatmapYAxis labelFormat="initial" tickFilter="odd" />
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
				<HeatmapLegend lessLabel="Menor" moreLabel="Maior" cellSize={10} />
			</div>
		</div>
	);
}
