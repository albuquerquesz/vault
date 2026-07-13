"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import { TrendingUpIcon } from "lucide-react";
import { DashboardCardLinkButton } from "@/components/dashboard-card-link-button";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { MaskedMonetaryValue, MonetaryMask, useMonetaryVisibility, } from "@/components/monetary-visibility";
import { PercentageBadge } from "@/components/percentage-badge";
const DEFAULT_DATA = [
    { month: "Jan", investedTotal: 118_000, returnPct: 1.2 },
    { month: "Fev", investedTotal: 123_500, returnPct: 1.8 },
    { month: "Mar", investedTotal: 129_900, returnPct: 1.4 },
    { month: "Abr", investedTotal: 136_200, returnPct: 2.1 },
    { month: "Mai", investedTotal: 142_800, returnPct: 2.6 },
    { month: "Jun", investedTotal: 149_400, returnPct: 3.2 },
];
function formatCurrency(value, locale = "pt-BR", currency = "BRL") {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}
function _formatCompactCurrency(value, _locale = "pt-BR", currency = "BRL") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}
function formatAxisCurrency(value) {
    if (value === 0) {
        return "R$ 0";
    }
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 0,
    }).format(value);
}
function getChartMaxWithHeadroom(maxValue, minimumMax, headroomRatio, absolutePadding = 0) {
    return Math.max(minimumMax, Math.ceil(maxValue * headroomRatio), maxValue + absolutePadding, 1);
}
function OverviewColumnSegment({ className }) {
    return (_jsx("div", { className: cn("shrink-0 rounded-[2px] bg-white/24", className) }));
}
function SegmentedInvestmentBar({ segments, height, className, }) {
    return (_jsx("div", { className: cn("flex w-full max-w-[1.8rem] flex-col justify-end gap-[3px]", className), style: { height }, children: Array.from({ length: segments }, (_, index) => (_jsx(OverviewColumnSegment, { className: "h-[14px] rounded-[2px]" }, index))) }));
}
function InvestmentsSegmentedChart({ data, isVisible, }) {
    const maxBarValue = Math.max(...data.map((item) => item.investedTotal), 1);
    const chartMax = getChartMaxWithHeadroom(maxBarValue, 160_000, 1.06);
    const yTicks = [0, 40_000, 80_000, 120_000, 160_000];
    const maxSegments = 13;
    return (_jsxs("div", { className: "mt-2", children: [_jsxs("div", { className: "relative h-[15rem]", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-2 left-0 w-12", children: yTicks.map((tick) => {
                            const bottom = chartMax <= 0 ? 0 : (tick / chartMax) * 100;
                            return (_jsx("span", { className: "absolute left-0 -translate-y-1/2 text-xs font-medium tracking-[0.02em] text-white/42", style: { bottom: `${bottom}%` }, children: isVisible ? (formatAxisCurrency(tick)) : tick === 0 ? (_jsx(MonetaryMask, { className: "text-[12px]" })) : (_jsx(MonetaryMask, { className: "text-[12px]", prefix: null })) }, tick));
                        }) }), _jsxs("div", { className: "absolute inset-y-0 right-0 left-12 grid items-end gap-5", style: {
                            gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
                        }, children: [_jsx("div", { className: "pointer-events-none absolute inset-0 rounded-[0.45rem] border border-white/[0.04] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:100%_25%]" }), yTicks.map((tick) => {
                                const bottom = chartMax <= 0 ? 0 : (tick / chartMax) * 100;
                                return (_jsx("div", { className: "pointer-events-none absolute inset-x-0 border-t border-white/[0.03]", style: { bottom: `${bottom}%` } }, `investments-grid-${tick}`));
                            }), data.map((item) => {
                                const segments = Math.max(4, Math.round((item.investedTotal / chartMax) * maxSegments));
                                return (_jsx("div", { className: "relative z-10 flex h-full items-end justify-center", children: _jsx(SegmentedInvestmentBar, { height: `${(item.investedTotal / chartMax) * 100}%`, segments: segments }) }, item.month));
                            })] })] }), _jsx("div", { className: "mt-2 pl-12 pr-1", children: _jsx("div", { className: "grid gap-5 text-[0.82rem] text-muted-foreground", style: {
                        gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
                    }, children: data.map((item) => (_jsx("span", { className: "text-center", children: item.month }, `month-${item.month}`))) }) })] }));
}
export function InvestmentsCard({ title = "Investimentos", totalInvested = 149_400, returnPct = 3.2, data = DEFAULT_DATA, loading = false, detailHref, }) {
    if (loading) {
        return _jsx(HomeCardSkeleton, { variant: "investment" });
    }
    const { isVisible } = useMonetaryVisibility();
    return (_jsxs(Card, { className: "financial-panel-border h-full min-h-[22rem] ring-0", children: [_jsx(CardHeader, { className: "gap-4 px-3", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TrendingUpIcon, { className: "size-4 text-muted-foreground" }), _jsx(CardDescription, { className: "text-base", children: title })] }), _jsxs("div", { className: "flex flex-wrap items-end gap-x-3 gap-y-2", children: [_jsx(CardTitle, { className: "text-4xl", children: _jsx(MaskedMonetaryValue, { format: formatCurrency, value: totalInvested }) }), _jsx(PercentageBadge, { value: returnPct, className: "mb-1" })] })] }), detailHref ? (_jsx(DashboardCardLinkButton, { label: `Abrir ${title}`, to: detailHref })) : null] }) }), _jsxs(CardContent, { className: "flex h-full flex-col px-3", children: [_jsx("div", { className: "mb-3 text-sm text-muted-foreground" }), _jsx(InvestmentsSegmentedChart, { data: data, isVisible: isVisible })] })] }));
}
