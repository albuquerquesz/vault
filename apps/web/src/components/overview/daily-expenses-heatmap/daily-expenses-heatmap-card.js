"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Clock3Icon } from "lucide-react";
import { HeatmapChartLoading } from "@/components/charts/heatmap";
import { DailyExpensesHeatmapContent } from "@/components/overview/daily-expenses-heatmap/daily-expenses-heatmap-content";
import { useDailyExpensesHeatmap } from "@/components/overview/daily-expenses-heatmap/use-daily-expenses-heatmap";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import { OverviewCardEmptyState, OverviewCardErrorState, } from "@/components/overview/shared/overview-card-state";
export function DailyExpensesHeatmapCard({ title = "Despesas diárias", currency = "BRL", locale = "pt-BR", month, }) {
    const { heatmapData, total, isError, isLoading } = useDailyExpensesHeatmap(month);
    if (isLoading) {
        return (_jsx(OverviewCardShell, { title: title, icon: _jsx(Clock3Icon, { className: "size-4 text-muted-foreground" }), tooltip: "Mapa de calor das despesas por dia", className: "min-h-96", contentClassName: "flex flex-1 flex-col", children: _jsx(HeatmapChartLoading, { binSize: 16, data: heatmapData, gap: 3, label: "Carregando despesas", margin: { top: 4, right: 0, bottom: 0, left: 0 } }) }));
    }
    return (_jsx(OverviewCardShell, { title: title, icon: _jsx(Clock3Icon, { className: "size-4 text-muted-foreground" }), tooltip: "Mapa de calor das despesas por dia", className: "min-h-96", contentClassName: "flex flex-1 flex-col", children: isError ? (_jsx(OverviewCardErrorState, { message: "N\u00E3o foi poss\u00EDvel carregar as despesas do m\u00EAs." })) : heatmapData.length === 0 ? (_jsx(OverviewCardEmptyState, { message: "Nenhuma despesa registrada" })) : (_jsx(DailyExpensesHeatmapContent, { currency: currency, heatmapData: heatmapData, locale: locale, total: total })) }));
}
