"use client";

import { Clock3Icon } from "lucide-react";
import { HeatmapChartLoading } from "@/components/charts/heatmap";
import {
	DailyExpensesHeatmapContent,
} from "@/components/overview/daily-expenses-heatmap/daily-expenses-heatmap-content";
import { useDailyExpensesHeatmap } from "@/components/overview/daily-expenses-heatmap/use-daily-expenses-heatmap";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
} from "@/components/overview/shared/overview-card-state";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";

type DailyExpensesHeatmapCardProps = {
	title?: string;
	periodLabel?: string;
	currency?: string;
	locale?: string;
	month: string;
};

export function DailyExpensesHeatmapCard({
	title = "Despesas diárias",
	periodLabel,
	currency = "BRL",
	locale = "pt-BR",
	month,
}: DailyExpensesHeatmapCardProps) {
	const { heatmapData, total, isError, isLoading, resolvedPeriodLabel } =
		useDailyExpensesHeatmap(month, locale);

	if (isLoading) {
		return (
			<OverviewCardShell
				title={title}
				icon={<Clock3Icon className="size-4 text-muted-foreground" />}
				tooltip="Mapa de calor das despesas por dia"
				className="min-h-96"
				contentClassName="flex flex-1 flex-col"
			>
				<HeatmapChartLoading
					data={heatmapData}
					gap={3}
					label="Carregando despesas"
				/>
			</OverviewCardShell>
		);
	}

	return (
		<OverviewCardShell
			title={title}
			icon={<Clock3Icon className="size-4 text-muted-foreground" />}
			tooltip="Mapa de calor das despesas por dia"
			className="min-h-96"
			contentClassName="flex flex-1 flex-col"
		>
			{isError ? (
				<OverviewCardErrorState message="Não foi possível carregar as despesas do mês." />
			) : heatmapData.length === 0 ? (
				<OverviewCardEmptyState message="Nenhuma despesa registrada" />
			) : (
				<DailyExpensesHeatmapContent
					currency={currency}
					heatmapData={heatmapData}
					locale={locale}
					periodLabel={periodLabel ?? resolvedPeriodLabel}
					total={total}
				/>
			)}
		</OverviewCardShell>
	);
}
