"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader } from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import { ArrowDownCircleIcon, ArrowUpCircleIcon, CreditCardIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon, } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
const summaryCards = [
    {
        title: "Entradas",
        value: 8_500,
        description: "5.2% vs mês anterior",
        change: 5.2,
        icon: _jsx(ArrowUpCircleIcon, { className: "size-3.5" }),
        format: (value) => new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
        }).format(value),
        bars: [6, 8, 7, 9, 8, 10, 9],
        isMonetary: true,
    },
    {
        title: "Saídas",
        value: 5_820,
        description: "3.1% vs mês anterior",
        change: 3.1,
        icon: _jsx(ArrowDownCircleIcon, { className: "size-3.5" }),
        format: (value) => new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
        }).format(value),
        bars: [7, 6, 8, 5, 7, 6, 8],
        isMonetary: true,
    },
    {
        title: "Percentual gasto",
        value: 68.4,
        description: "2.1% vs mês anterior",
        change: -2.1,
        icon: _jsx(CreditCardIcon, { className: "size-3.5" }),
        format: (value) => `${value.toFixed(1)}%`,
        bars: [8, 7, 9, 6, 8, 7, 6],
    },
    {
        title: "Distribuição dos gastos",
        value: 5,
        description: "5 categorias ativas",
        change: 0,
        icon: _jsx(WalletIcon, { className: "size-3.5" }),
        format: (value) => `${value} categorias`,
        bars: [5, 5, 5, 5, 5, 5, 5],
    },
];
const distributionItems = [
    { label: "Alimentação", value: 25, color: "bg-white/88" },
    { label: "Moradia", value: 30, color: "bg-white/60" },
    { label: "Transporte", value: 15, color: "bg-white/40" },
    { label: "Lazer", value: 20, color: "bg-white/24" },
    { label: "Outros", value: 10, color: "bg-white/12" },
];
function TrendLabel({ change, description, }) {
    const positive = change >= 0;
    return (_jsxs("div", { className: cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm", positive ? "text-emerald-400" : "text-rose-400"), children: [positive ? (_jsx(TrendingUpIcon, { className: "size-3.5" })) : (_jsx(TrendingDownIcon, { className: "size-3.5" })), _jsx("span", { className: "font-medium", children: description })] }));
}
function OverviewColumnSegment({ status, className, }) {
    return (_jsx("div", { className: cn("shrink-0 rounded-[2px]", status === "primary" ? "bg-white/88" : "bg-white/24", className) }));
}
function OverviewSegmentedColumn({ segments, height, gapClassName = "gap-[3px]", widthClassName = "w-full", segmentClassName, className, }) {
    return (_jsx("div", { className: cn("shrink-0 flex flex-col justify-end", widthClassName, gapClassName, className), style: { height }, children: segments.map((segment, index) => (_jsx(OverviewColumnSegment, { status: segment.status, className: segmentClassName }, `${segment.status}-${index}`))) }));
}
function MiniBars({ bars }) {
    const targetColumnCount = Math.min(5, bars.length);
    const groupedBars = Array.from({ length: targetColumnCount }, (_, groupIndex) => {
        const start = Math.floor((groupIndex * bars.length) / targetColumnCount);
        const end = Math.floor(((groupIndex + 1) * bars.length) / targetColumnCount);
        const slice = bars.slice(start, Math.max(start + 1, end));
        return Math.max(...slice, 1);
    });
    const max = Math.max(...groupedBars, 1);
    const highlightedColumnIndex = groupedBars.indexOf(max);
    return (_jsx("div", { className: "flex h-[5.5rem] shrink-0 items-end gap-[4px]", children: groupedBars.map((bar, index) => (_jsx(OverviewSegmentedColumn, { segments: Array.from({ length: bar }, () => ({
                status: index === highlightedColumnIndex
                    ? "primary"
                    : "secondary",
            })), height: `${(bar / max) * 100}%`, widthClassName: "w-[10px]", gapClassName: "gap-[2px]", segmentClassName: "h-[8px] rounded-none" }, `mini-bar-${index}`))) }));
}
function SummaryCardComponent({ title, value, description, change, icon, format, bars, isMonetary = false, }) {
    return (_jsxs(Card, { className: "financial-panel-border !pt-0 !pb-0 gap-0 p-0 ring-0", children: [_jsx(CardHeader, { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx("span", { className: "opacity-80", children: icon }), _jsx("span", { children: title })] }) }), _jsxs(CardContent, { className: "flex items-end justify-between gap-4 px-4 py-4", children: [_jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [_jsx("div", { className: "text-[2rem] leading-none whitespace-nowrap font-semibold tracking-tight text-foreground", children: isMonetary ? (_jsx(MaskedMonetaryValue, { animated: true, format: format, value: value })) : (_jsx(AnimatedNumber, { value: value, format: format })) }), _jsx(TrendLabel, { change: change, description: description })] }), _jsx(MiniBars, { bars: bars })] })] }));
}
function DistributionList() {
    return (_jsx("div", { className: "space-y-3", children: distributionItems.map((item) => (_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn("size-2.5 rounded-full", item.color) }), _jsx("span", { className: "text-sm text-muted-foreground", children: item.label })] }), _jsxs("span", { className: "text-sm font-medium tabular-nums", children: [item.value, "%"] })] }, item.label))) }));
}
export function PersonalFinanceSummary() {
    return (_jsx("div", { className: "grid grid-cols-1 gap-px bg-border p-px md:grid-cols-2 lg:grid-cols-4", children: summaryCards.map((card) => (_jsx(SummaryCardComponent, { ...card }, card.title))) }));
}
export function ExpenseDistribution() {
    return (_jsxs(Card, { className: "financial-panel-border ring-0", children: [_jsx(CardHeader, { className: "px-4 py-3", children: _jsx("div", { className: "text-sm text-muted-foreground", children: "Distribui\u00E7\u00E3o dos gastos" }) }), _jsx(CardContent, { className: "px-4 py-4", children: _jsx(DistributionList, {}) })] }));
}
