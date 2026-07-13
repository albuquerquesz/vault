"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { PieChartIcon } from "lucide-react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import { OverviewCardEmptyState, OverviewCardErrorState, OverviewCardLoadingState, } from "@/components/overview/shared/overview-card-state";
import { useOrderSourceMix } from "./hooks/use-order-source-mix";
import { OrderSourceMixContent } from "./order-source-mix-content";
export function OrderSourceMixCard({ month, title = "Distribuição dos gastos", }) {
    const { sourceData, isLoading, isError } = useOrderSourceMix(month);
    if (isLoading) {
        return (_jsx(OverviewCardLoadingState, { fallback: _jsx(HomeCardSkeleton, { variant: "mix" }) }));
    }
    return (_jsx(OverviewCardShell, { title: title, icon: _jsx(PieChartIcon, { className: "size-4 text-muted-foreground" }), tooltip: "Resumo da distribui\u00E7\u00E3o dos gastos por categoria", contentClassName: "flex flex-1 p-4", children: isError ? (_jsx(OverviewCardErrorState, { message: "N\u00E3o foi poss\u00EDvel carregar as despesas do m\u00EAs." })) : sourceData.length === 0 ? (_jsx(OverviewCardEmptyState, { message: "Nenhuma despesa registrada" })) : (_jsx(OrderSourceMixContent, { month: month, sourceData: sourceData })) }));
}
