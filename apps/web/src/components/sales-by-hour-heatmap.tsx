"use client";

import { getMonthValue } from "@/features/finance/sdk";
import { DailyExpensesHeatmapCard } from "@/components/overview/daily-expenses-heatmap/daily-expenses-heatmap-card";

type SalesByHourHeatmapProps = {
	title?: string;
	periodLabel?: string;
	currency?: string;
	locale?: string;
	month?: string;
};

export function SalesByHourHeatmap({
	title,
	periodLabel,
	currency,
	locale,
	month,
}: SalesByHourHeatmapProps) {
	return (
		<DailyExpensesHeatmapCard
			currency={currency}
			locale={locale}
			month={month ?? getMonthValue()}
			periodLabel={periodLabel}
			title={title}
		/>
	);
}
