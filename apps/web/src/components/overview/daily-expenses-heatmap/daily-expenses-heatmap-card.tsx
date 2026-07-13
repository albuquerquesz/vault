"use client";

import { Clock3Icon } from "lucide-react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import {
	DailyExpensesHeatmapContent,
} from "@/components/overview/daily-expenses-heatmap/daily-expenses-heatmap-content";
import { useDailyExpensesHeatmap } from "@/components/overview/daily-expenses-heatmap/use-daily-expenses-heatmap";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
	OverviewCardLoadingState,
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
	const { heatmapData, isError, isLoading, metrics, mobileRows, resolvedPeriodLabel } =
		useDailyExpensesHeatmap(month, locale);

	if (isLoading) {
		return (
			<OverviewCardLoadingState fallback={<HomeCardSkeleton variant="heatmap" />} />
		);
	}

	return (
		<OverviewCardShell
			title={title}
			icon={<Clock3Icon className="size-4 text-muted-foreground" />}
			tooltip="Mapa de calor das despesas por dia e hora"
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
					metrics={metrics}
					mobileRows={mobileRows}
					periodLabel={periodLabel ?? resolvedPeriodLabel}
				/>
			)}
		</OverviewCardShell>
	);
}
