"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { CreditCardIcon } from "lucide-react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { useMonthlyBillCard } from "@/components/overview/monthly-bill/hooks/use-monthly-bill-card";
import { MonthlyBillContent } from "@/components/overview/monthly-bill/monthly-bill-content";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import { OverviewCardEmptyState, OverviewCardErrorState, OverviewCardLoadingState, } from "@/components/overview/shared/overview-card-state";
export function MonthlyBillCard({ month }) {
    const { bill, isError, isLoading, items } = useMonthlyBillCard(month);
    if (isLoading) {
        return (_jsx(OverviewCardLoadingState, { fallback: _jsx(HomeCardSkeleton, { variant: "bills" }) }));
    }
    return (_jsx(OverviewCardShell, { title: "Cart\u00F5es", icon: _jsx(CreditCardIcon, { className: "size-4 text-muted-foreground" }), tooltip: "Saldos dos cart\u00F5es de cr\u00E9dito conectados via Open Finance", contentClassName: "flex flex-1 flex-col", children: isError ? (_jsx(OverviewCardErrorState, { message: "N\u00E3o foi poss\u00EDvel carregar os cart\u00F5es." })) : !bill || items.length === 0 ? (_jsx(OverviewCardEmptyState, { message: "Nenhum cart\u00E3o conectado." })) : (_jsx(MonthlyBillContent, { totalBill: bill.totalBill, items: items })) }));
}
