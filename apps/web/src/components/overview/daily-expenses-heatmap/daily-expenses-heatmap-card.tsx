"use client";

import { Clock3Icon } from "lucide-react";
import { HeatmapChartLoading } from "@/components/charts/heatmap";
import { DailyExpensesHeatmapContent } from "@/components/overview/daily-expenses-heatmap/daily-expenses-heatmap-content";
import { useDailyExpensesHeatmap } from "@/components/overview/daily-expenses-heatmap/use-daily-expenses-heatmap";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import {
  OverviewCardEmptyState,
  OverviewCardErrorState,
} from "@/components/overview/shared/overview-card-state";

type DailyExpensesHeatmapCardProps = {
  title?: string;
  currency?: string;
  locale?: string;
  month: string;
};

export function DailyExpensesHeatmapCard({
  title = "Despesas diárias",
  currency = "BRL",
  locale = "pt-BR",
  month,
}: DailyExpensesHeatmapCardProps) {
  const { heatmapData, total, isError, isLoading } =
    useDailyExpensesHeatmap(month);

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
          binSize={16}
          data={heatmapData}
          gap={3}
          label="Carregando despesas"
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
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
          total={total}
        />
      )}
    </OverviewCardShell>
  );
}
