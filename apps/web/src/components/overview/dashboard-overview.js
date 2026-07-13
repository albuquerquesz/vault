"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { DailySpendBarCard } from "@/components/overview/daily-spend-bar/daily-spend-bar-card";
import { GoalsCard } from "@/components/overview/goals/goals-card";
import { useDashboardOverview } from "@/components/overview/hooks/use-dashboard-overview";
import { MonthlyBillCard } from "@/components/overview/monthly-bill/monthly-bill-card";
import { OrderSourceMixCard } from "@/components/overview/order-source-mix/order-source-mix-card";
import { OverviewMonthSelect } from "@/components/overview/shared/overview-month-select";
export function DashboardOverview() {
    const { firstName, monthOptions, selectedMonth, setSelectedMonth } = useDashboardOverview();
    return (_jsxs("div", { className: "grid grid-cols-1 gap-4 pt-6", children: [_jsxs("div", { className: "mb-2 flex flex-col items-start justify-between gap-4 sm:mb-6 sm:flex-row sm:items-center", children: [_jsxs("h2", { className: "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl xl:text-4xl", children: ["Bem-vindo de volta", firstName ? `, ${firstName}!` : "!", " \uD83D\uDC4B"] }), _jsx(OverviewMonthSelect, { onValueChange: setSelectedMonth, options: monthOptions, value: selectedMonth })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 h-118 xl:grid-cols-[2fr_1fr]", children: [_jsx(OrderSourceMixCard, { month: selectedMonth }), _jsx(MonthlyBillCard, { month: selectedMonth })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 mb-4 xl:grid-cols-10", children: [_jsx("div", { className: "xl:col-span-4", children: _jsx(GoalsCard, {}) }), _jsx("div", { className: "xl:col-span-6", children: _jsx(DailySpendBarCard, { month: selectedMonth }) })] })] }));
}
