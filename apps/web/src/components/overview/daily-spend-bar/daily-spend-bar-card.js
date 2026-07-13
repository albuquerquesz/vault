"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Skeleton } from "@vault/ui/components/skeleton";
import { ChartColumn } from "lucide-react";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import { OverviewCardEmptyState, OverviewCardErrorState, OverviewCardLoadingState, } from "@/components/overview/shared/overview-card-state";
import { DailySpendBarContent } from "./daily-spend-bar-content";
import { useDailySpendBar } from "./hooks/use-daily-spend-bar";
function DailySpendBarLoadingSkeleton() {
    return (_jsx(OverviewCardShell, { title: "Gastos por dia", icon: _jsx(ChartColumn, { className: "size-4 text-muted-foreground" }), tooltip: "Total gasto em cada dia do m\u00EAs selecionado", contentClassName: "flex flex-1 flex-col p-4", children: _jsxs("div", { className: "flex h-full min-h-55 flex-1 flex-col justify-end gap-2", children: [_jsx("div", { className: "flex h-45 items-end gap-1", children: Array.from({ length: 18 }).map((_, index) => (_jsx(Skeleton, { className: "w-full rounded-sm", style: { height: `${30 + ((index * 17) % 70)}%` } }, `daily-spend-skel-${index}`))) }), _jsxs("div", { className: "flex justify-between px-1", children: [_jsx(Skeleton, { className: "h-3 w-6" }), _jsx(Skeleton, { className: "h-3 w-6" }), _jsx(Skeleton, { className: "h-3 w-6" }), _jsx(Skeleton, { className: "h-3 w-6" })] })] }) }));
}
export function DailySpendBarCard({ month, title = "Gastos por dia", }) {
    const { chartData, totalSpent, peakDay, isLoading, isError } = useDailySpendBar(month);
    if (isLoading) {
        return (_jsx(OverviewCardLoadingState, { fallback: _jsx(DailySpendBarLoadingSkeleton, {}) }));
    }
    return (_jsx(OverviewCardShell, { title: title, icon: _jsx(ChartColumn, { className: "size-4 text-muted-foreground" }), tooltip: "Total gasto em cada dia do m\u00EAs selecionado", contentClassName: "flex flex-1 flex-col p-4", children: isError ? (_jsx(OverviewCardErrorState, { message: "N\u00E3o foi poss\u00EDvel carregar os gastos di\u00E1rios." })) : totalSpent <= 0 ? (_jsx(OverviewCardEmptyState, { message: "Nenhuma despesa neste m\u00EAs" })) : (_jsx(DailySpendBarContent, { chartData: chartData, peakDay: peakDay })) }));
}
