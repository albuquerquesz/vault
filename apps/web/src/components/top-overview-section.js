"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card, CardContent, CardHeader } from "@vault/ui/components/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@vault/ui/components/select";
import { cn } from "@vault/ui/lib/utils";
import { CalendarIcon, CreditCardIcon, ReceiptTextIcon, ScaleIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon, } from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { DashboardCardLinkButton } from "@/components/dashboard-card-link-button";
import { MaskedMonetaryText, MaskedMonetaryValue, } from "@/components/monetary-visibility";
import { getMonthValue } from "@/features/finance/sdk";
const _summaryCards = [
    {
        title: "Saídas do mês",
        value: 284_920,
        description: "8.2% vs últimos 30 dias",
        change: 8.2,
        icon: _jsx(WalletIcon, { className: "size-3.5" }),
        format: formatCompactCurrency,
        bars: [5, 8, 11, 14, 10, 12, 9],
        isMonetary: true,
    },
    {
        title: "Lançamentos",
        value: 1_842,
        description: "4.1% vs últimos 30 dias",
        change: 4.1,
        icon: _jsx(ReceiptTextIcon, { className: "size-3.5" }),
        format: formatInteger,
        bars: [7, 10, 13, 11, 12, 14, 10],
    },
    {
        title: "Porcentagem gasta",
        value: 68.4,
        description: "2.1% vs últimos 30 dias",
        change: -2.1,
        icon: _jsx(CreditCardIcon, { className: "size-3.5" }),
        format: (value) => `${value.toFixed(1)}%`,
        bars: [11, 12, 10, 9, 13, 8, 6],
    },
    {
        title: "Taxa de economia",
        value: 3.06,
        description: "0.6% vs últimos 30 dias",
        change: 0.6,
        icon: _jsx(ScaleIcon, { className: "size-3.5" }),
        format: (value) => `${value.toFixed(2)}%`,
        bars: [6, 7, 9, 8, 10, 11, 9],
    },
];
const monthlyCampaignBars = [
    18, 42, 27, 33, 21, 38, 25, 44, 31, 27, 39, 34,
];
const defaultMainFlowYTicks = [
    { value: 0, label: "0k" },
    { value: 5, label: "5k" },
    { value: 10, label: "10k" },
    { value: 15, label: "15k" },
    { value: 20, label: "20k" },
];
function generateMonthOptions(count = 6) {
    const now = new Date();
    const options = [];
    for (let i = 0; i < count; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = getMonthValue(d);
        const label = d.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
        });
        options.push({
            value,
            label: label.charAt(0).toUpperCase() + label.slice(1),
        });
    }
    return options;
}
const mainFlowData = {
    "2026-07": {
        total: 413_000,
        description: "Total movimentado em julho de 2026",
        change: 1.5,
        legend: ["Essenciais", "Não essenciais"],
        bars: [
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 7, naoEssenciais: 8 },
            { essenciais: 4, naoEssenciais: 6 },
            { essenciais: 3, naoEssenciais: 6 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 7, naoEssenciais: 8 },
            { essenciais: 7, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 5 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 8, naoEssenciais: 10 },
            { essenciais: 7, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 8, naoEssenciais: 10 },
            { essenciais: 8, naoEssenciais: 9 },
            { essenciais: 7, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 5 },
            { essenciais: 6, naoEssenciais: 8 },
        ],
        xLabels: [
            { label: "1 Jul", index: 0 },
            { label: "5 Jul", index: 5 },
            { label: "10 Jul", index: 9 },
            { label: "15 Jul", index: 14 },
            { label: "20 Jul", index: 19 },
            { label: "25 Jul", index: 24 },
            { label: "30 Jul", index: 29 },
        ],
        yTicks: defaultMainFlowYTicks,
    },
    "2026-06": {
        total: 387_000,
        description: "Total movimentado em junho de 2026",
        change: -2.3,
        legend: ["Essenciais", "Não essenciais"],
        bars: [
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 3, naoEssenciais: 5 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 4, naoEssenciais: 4 },
            { essenciais: 3, naoEssenciais: 4 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 3, naoEssenciais: 4 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 7, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 6 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 4, naoEssenciais: 4 },
            { essenciais: 5, naoEssenciais: 7 },
        ],
        xLabels: [
            { label: "1 Jun", index: 0 },
            { label: "5 Jun", index: 5 },
            { label: "10 Jun", index: 9 },
            { label: "15 Jun", index: 14 },
            { label: "20 Jun", index: 19 },
            { label: "25 Jun", index: 24 },
            { label: "29 Jun", index: 28 },
        ],
        yTicks: defaultMainFlowYTicks,
    },
    "2026-05": {
        total: 425_000,
        description: "Total movimentado em maio de 2026",
        change: 3.1,
        legend: ["Essenciais", "Não essenciais"],
        bars: [
            { essenciais: 6, naoEssenciais: 9 },
            { essenciais: 7, naoEssenciais: 10 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 9 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 4, naoEssenciais: 7 },
            { essenciais: 3, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 9 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 4, naoEssenciais: 6 },
            { essenciais: 8, naoEssenciais: 11 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 7, naoEssenciais: 10 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 4, naoEssenciais: 6 },
            { essenciais: 8, naoEssenciais: 11 },
            { essenciais: 8, naoEssenciais: 10 },
            { essenciais: 7, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 7, naoEssenciais: 10 },
            { essenciais: 6, naoEssenciais: 9 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 6, naoEssenciais: 9 },
        ],
        xLabels: [
            { label: "1 Mai", index: 0 },
            { label: "5 Mai", index: 5 },
            { label: "10 Mai", index: 9 },
            { label: "15 Mai", index: 14 },
            { label: "20 Mai", index: 19 },
            { label: "25 Mai", index: 24 },
            { label: "30 Mai", index: 29 },
        ],
        yTicks: defaultMainFlowYTicks,
    },
    "2026-04": {
        total: 398_000,
        description: "Total movimentado em abril de 2026",
        change: 0.8,
        legend: ["Essenciais", "Não essenciais"],
        bars: [
            { essenciais: 5, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 9 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 4, naoEssenciais: 6 },
            { essenciais: 5, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 4, naoEssenciais: 6 },
            { essenciais: 3, naoEssenciais: 6 },
            { essenciais: 5, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 4, naoEssenciais: 6 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 5 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 9 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 7, naoEssenciais: 9 },
            { essenciais: 7, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 9 },
            { essenciais: 5, naoEssenciais: 8 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 5, naoEssenciais: 8 },
        ],
        xLabels: [
            { label: "1 Abr", index: 0 },
            { label: "5 Abr", index: 5 },
            { label: "10 Abr", index: 9 },
            { label: "15 Abr", index: 14 },
            { label: "20 Abr", index: 19 },
            { label: "25 Abr", index: 24 },
            { label: "29 Abr", index: 28 },
        ],
        yTicks: defaultMainFlowYTicks,
    },
    "2026-03": {
        total: 372_000,
        description: "Total movimentado em março de 2026",
        change: -1.2,
        legend: ["Essenciais", "Não essenciais"],
        bars: [
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 3, naoEssenciais: 5 },
            { essenciais: 3, naoEssenciais: 5 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 4, naoEssenciais: 4 },
            { essenciais: 3, naoEssenciais: 4 },
            { essenciais: 7, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 3, naoEssenciais: 4 },
            { essenciais: 7, naoEssenciais: 8 },
            { essenciais: 7, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 6 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 4, naoEssenciais: 4 },
            { essenciais: 5, naoEssenciais: 7 },
        ],
        xLabels: [
            { label: "1 Mar", index: 0 },
            { label: "5 Mar", index: 5 },
            { label: "10 Mar", index: 9 },
            { label: "15 Mar", index: 14 },
            { label: "20 Mar", index: 19 },
            { label: "25 Mar", index: 24 },
            { label: "30 Mar", index: 29 },
        ],
        yTicks: defaultMainFlowYTicks,
    },
    "2026-02": {
        total: 356_000,
        description: "Total movimentado em fevereiro de 2026",
        change: 2.4,
        legend: ["Essenciais", "Não essenciais"],
        bars: [
            { essenciais: 4, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 3, naoEssenciais: 5 },
            { essenciais: 3, naoEssenciais: 5 },
            { essenciais: 5, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 4, naoEssenciais: 5 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 4, naoEssenciais: 4 },
            { essenciais: 3, naoEssenciais: 4 },
            { essenciais: 7, naoEssenciais: 8 },
            { essenciais: 6, naoEssenciais: 7 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 6, naoEssenciais: 8 },
            { essenciais: 5, naoEssenciais: 6 },
            { essenciais: 3, naoEssenciais: 4 },
        ],
        xLabels: [
            { label: "1 Fev", index: 0 },
            { label: "4 Fev", index: 4 },
            { label: "8 Fev", index: 7 },
            { label: "12 Fev", index: 11 },
            { label: "16 Fev", index: 15 },
            { label: "20 Fev", index: 19 },
            { label: "24 Fev", index: 21 },
        ],
        yTicks: defaultMainFlowYTicks,
    },
};
const defaultSecondaryFlow = {
    total: 92_500,
    description: "Reservado para metas em agosto",
    change: 5.2,
    bars: monthlyCampaignBars,
    xLabels: [
        { label: "Jan", index: 0 },
        { label: "Mar", index: 2 },
        { label: "Mai", index: 4 },
        { label: "Jul", index: 6 },
        { label: "Set", index: 8 },
        { label: "Nov", index: 10 },
    ],
    highlightedIndex: 7,
    highlightedValueLabel: "R$ 93K",
};
function _formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}
function formatCompactCurrency(value) {
    const absoluteValue = Math.abs(value);
    if (absoluteValue >= 1_000_000) {
        return `R$ ${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    }
    if (absoluteValue >= 1_000) {
        return `R$ ${(value / 1_000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
    }).format(value);
}
function formatInteger(value) {
    return new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: 0,
    }).format(value);
}
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
function _SummaryCard({ title, value, description, change, icon, format, bars, isMonetary = false, detailHref, }) {
    return (_jsxs(Card, { className: "financial-panel-border !pt-0 !pb-0 gap-0 p-0 ring-0", children: [_jsx(CardHeader, { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-between gap-3 text-sm text-muted-foreground", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "opacity-80", children: icon }), _jsx("span", { children: title })] }), detailHref ? (_jsx(DashboardCardLinkButton, { className: "size-7 text-muted-foreground/80", label: `Abrir ${title}`, to: detailHref })) : null] }) }), _jsxs(CardContent, { className: "flex items-end justify-between gap-4 px-4 py-4", children: [_jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [_jsx("div", { className: "text-[2rem] leading-none whitespace-nowrap font-semibold tracking-tight text-foreground", children: isMonetary ? (_jsx(MaskedMonetaryValue, { animated: true, format: format, value: value })) : (_jsx(AnimatedNumber, { value: value, format: format })) }), _jsx(TrendLabel, { change: change, description: description })] }), _jsx(MiniBars, { bars: bars })] })] }));
}
function MonthSelect({ value, options, onChange, }) {
    return (_jsxs(Select, { value: value, onValueChange: (v) => v && onChange(v), children: [_jsxs(SelectTrigger, { className: "h-9 w-[160px] border-white/10 bg-transparent text-sm", children: [_jsx(CalendarIcon, { className: "mr-2 size-3.5 text-muted-foreground" }), _jsx(SelectValue, {})] }), _jsx(SelectContent, { children: options.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] }));
}
function AxisLabels({ barCount, labels, offsetLeft = 0, offsetRight = 0, className, denseLabelClassName, }) {
    const denseMode = labels.length === barCount;
    if (denseMode) {
        const labelByIndex = new Map(labels.map((item) => [item.index, item.label]));
        return (_jsx("div", { className: cn("mt-3 text-sm text-muted-foreground", className), style: { paddingLeft: offsetLeft, paddingRight: offsetRight }, children: _jsx("div", { className: "grid", style: { gridTemplateColumns: `repeat(${barCount}, minmax(0, 1fr))` }, children: Array.from({ length: barCount }, (_, index) => (_jsx("span", { className: cn("min-w-0 text-center text-[0.6rem] leading-none whitespace-nowrap text-muted-foreground/95", denseLabelClassName), children: labelByIndex.get(index) ?? "" }, `dense-axis-${index}`))) }) }));
    }
    return (_jsx("div", { className: cn("relative mt-3 h-5 text-sm text-muted-foreground", className), children: labels.map((item) => {
            const ratio = barCount <= 1 ? 0 : item.index / (barCount - 1);
            const left = `calc(${offsetLeft}px + (${ratio} * (100% - ${offsetLeft + offsetRight}px)))`;
            const alignClassName = item.index === 0
                ? "-translate-x-0 text-left"
                : item.index === barCount - 1
                    ? "-translate-x-full text-right"
                    : "-translate-x-1/2 text-center";
            return (_jsx("span", { className: cn("absolute top-0 whitespace-nowrap", alignClassName), style: { left }, children: item.label }, `${item.label}-${item.index}`));
        }) }));
}
function getChartMaxWithHeadroom(maxValue, minimumMax, headroomRatio, absolutePadding = 0) {
    return Math.max(minimumMax, Math.ceil(maxValue * headroomRatio), maxValue + absolutePadding, 1);
}
function LargeBarChart({ bars, xLabels, yTicks, }) {
    const maxBarValue = Math.max(...bars.map((bar) => bar.essenciais + bar.naoEssenciais), 1);
    const maxTickValue = Math.max(...yTicks.map((tick) => tick.value), 1);
    const chartMax = getChartMaxWithHeadroom(maxBarValue, maxTickValue, 1.08);
    const axisWidth = 44;
    return (_jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "relative h-[18rem]", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-2 left-0 w-11", children: yTicks.map((tick) => {
                            const bottom = chartMax <= 0 ? 0 : (tick.value / chartMax) * 100;
                            return (_jsx("span", { className: "absolute left-0 -translate-y-1/2 text-xs font-medium tracking-[0.02em] text-white/42", style: { bottom: `${bottom}%` }, children: tick.label }, tick.label));
                        }) }), _jsxs("div", { className: "absolute inset-y-0 right-0 left-11 grid items-end gap-1.5", style: {
                            gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`,
                        }, children: [_jsx("div", { className: "pointer-events-none absolute inset-0 rounded-[0.45rem] border border-white/[0.04] bg-[linear-gradient(to_right,rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:calc(100%/30)_100%,100%_25%]" }), yTicks.map((tick) => {
                                const bottom = chartMax <= 0 ? 0 : (tick.value / chartMax) * 100;
                                return (_jsx("div", { className: "pointer-events-none absolute inset-x-0 border-t border-white/[0.02]", style: { bottom: `${bottom}%` } }, `main-grid-${tick.label}`));
                            }), bars.map((bar, index) => (_jsx("div", { className: "relative z-10 flex h-full items-end justify-center", children: _jsx(OverviewSegmentedColumn, { segments: [
                                        ...Array.from({ length: bar.naoEssenciais }, () => ({
                                            status: "secondary",
                                        })),
                                        ...Array.from({ length: bar.essenciais }, () => ({
                                            status: "primary",
                                        })),
                                    ], height: `${((bar.essenciais + bar.naoEssenciais) / chartMax) * 100}%`, widthClassName: "w-full max-w-[1.15rem]", segmentClassName: "h-[7px]" }) }, `daily-bar-${index}`)))] })] }), _jsx(AxisLabels, { barCount: bars.length, labels: xLabels, offsetLeft: axisWidth, offsetRight: 8, className: "mt-2", denseLabelClassName: "text-[0.52rem] md:text-[0.58rem]" })] }));
}
function MonthlyBarChart({ bars, xLabels, highlightedIndex = 0, highlightedValueLabel, }) {
    const max = Math.max(...bars, 1);
    const chartMax = getChartMaxWithHeadroom(max, 1, 1.12, 2);
    const highlightedLeft = bars.length <= 1
        ? "0%"
        : `calc(${(highlightedIndex / (bars.length - 1)) * 100}% - 0px)`;
    return (_jsxs("div", { className: "mt-6", children: [_jsxs("div", { className: "relative h-[16rem]", children: [_jsx("div", { className: "pointer-events-none absolute inset-0 rounded-[0.45rem] border border-white/[0.04] bg-[linear-gradient(to_right,rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:calc(100%/12)_100%,100%_25%]" }), highlightedValueLabel ? (_jsx("span", { className: "pointer-events-none absolute top-2 z-20 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-foreground", style: { left: highlightedLeft }, children: highlightedValueLabel })) : null, _jsx("div", { className: "absolute inset-x-0 bottom-0 top-8 grid items-end gap-3 px-px", style: {
                            gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`,
                        }, children: bars.map((bar, index) => (_jsx("div", { className: "relative z-10 flex h-full items-end justify-center", children: _jsx(OverviewSegmentedColumn, { segments: Array.from({ length: bar }, () => ({
                                    status: index === highlightedIndex
                                        ? "primary"
                                        : "secondary",
                                })), height: `${(bar / chartMax) * 100}%`, widthClassName: "w-full max-w-[0.95rem]", segmentClassName: cn("h-[6px]", index === highlightedIndex && "bg-white/88", index !== highlightedIndex && "bg-white/24") }) }, `month-bar-${index}`))) })] }), _jsx(AxisLabels, { barCount: bars.length, labels: xLabels, offsetRight: 4, className: "mt-2 h-4" })] }));
}
function MainFlowCard({ data, initialMonth, }) {
    const currentMonth = getMonthValue();
    const [selectedMonth, setSelectedMonth] = useState(initialMonth ?? currentMonth);
    const monthOptions = useMemo(() => generateMonthOptions(6), []);
    const currentData = data[selectedMonth];
    const legend = currentData?.legend ?? ["Essenciais", "Não essenciais"];
    if (!currentData) {
        return (_jsx(Card, { className: "financial-panel-border top-overview-card gap-0 p-0 ring-0", children: _jsx(CardContent, { className: "px-5 pt-4 pb-5", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "Sem dados para este m\u00EAs." }) }) }));
    }
    return (_jsx(Card, { className: "financial-panel-border top-overview-card gap-0 p-0 ring-0", children: _jsx(CardContent, { className: "px-5 pt-4 pb-5", children: _jsxs("div", { className: "flex flex-col gap-6", children: [_jsxs("div", { className: "flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "text-[2.25rem] leading-none font-semibold tracking-tight", children: _jsx(MaskedMonetaryValue, { animated: true, format: formatCompactCurrency, value: currentData.total }) }), _jsx("p", { className: "text-sm text-muted-foreground", children: currentData.description }), _jsxs("div", { className: "flex items-center gap-5 text-sm text-muted-foreground", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "size-2 rounded-full bg-white/88" }), _jsx("span", { children: legend[0] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "size-2 rounded-full bg-white/32" }), _jsx("span", { children: legend[1] })] })] })] }), _jsxs("div", { className: "flex flex-col items-start gap-3 lg:items-end", children: [_jsx(MonthSelect, { value: selectedMonth, options: monthOptions, onChange: setSelectedMonth }), _jsx(TrendLabel, { change: currentData.change, description: `${currentData.change.toFixed(1)}% vs mês anterior` })] })] }), _jsx(LargeBarChart, { bars: currentData.bars, xLabels: currentData.xLabels, yTicks: currentData.yTicks })] }) }) }));
}
function SecondaryFlowCard({ data }) {
    return (_jsx(Card, { className: "financial-panel-border top-overview-card gap-0 p-0 ring-0", children: _jsxs(CardContent, { className: "px-5 pt-4 pb-5", children: [_jsx("div", { className: "flex items-start justify-between gap-4", children: _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "text-[2.25rem] leading-none font-semibold tracking-tight", children: _jsx(MaskedMonetaryValue, { animated: true, format: formatCompactCurrency, value: data.total }) }), _jsx(TrendLabel, { change: data.change, description: `${data.change.toFixed(1)}% vs período anterior` }), _jsx("p", { className: "text-sm text-muted-foreground", children: data.description })] }) }), _jsx(MonthlyBarChart, { bars: data.bars, xLabels: data.xLabels, highlightedIndex: data.highlightedIndex, highlightedValueLabel: data.highlightedValueLabel ? (_jsx(MaskedMonetaryText, { children: data.highlightedValueLabel })) : undefined })] }) }));
}
export function TopOverviewSection({ title = "Bem-vindo de volta, Victor.", mainFlowData: mainFlow = mainFlowData, secondaryFlow, rightContent, extraRightContent, initialMonth, showMainFlow = true, }) {
    const hasCustomSidePanels = rightContent || extraRightContent;
    const hasTwoTopCards = rightContent && extraRightContent;
    return (_jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-4xl font-semibold tracking-tight text-foreground", children: title }), hasCustomSidePanels ? (_jsxs(_Fragment, { children: [hasTwoTopCards ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]", children: [_jsx("div", { className: "h-full", children: extraRightContent }), _jsx("div", { className: "h-full", children: rightContent })] }), showMainFlow ? (_jsx(MainFlowCard, { data: mainFlow, initialMonth: initialMonth })) : null] })) : (_jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-4", children: [showMainFlow ? (_jsx("div", { className: "xl:col-span-2", children: _jsx(MainFlowCard, { data: mainFlow, initialMonth: initialMonth }) })) : null, rightContent ? (_jsx("div", { className: "h-full", children: rightContent })) : null, extraRightContent ? (_jsx("div", { className: "h-full", children: extraRightContent })) : null] })), secondaryFlow ? _jsx(SecondaryFlowCard, { data: secondaryFlow }) : null] })) : showMainFlow ? (_jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]", children: [_jsx(MainFlowCard, { data: mainFlow, initialMonth: initialMonth }), _jsx(SecondaryFlowCard, { data: secondaryFlow ?? defaultSecondaryFlow })] })) : secondaryFlow ? (_jsx(SecondaryFlowCard, { data: secondaryFlow })) : null] }));
}
