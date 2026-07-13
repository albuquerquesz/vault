"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@vault/ui/components/tooltip";
import { useMemo } from "react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { MaskedMonetaryText, MaskedMonetaryValue, } from "@/components/monetary-visibility";
const DEFAULT_ACTUAL_SERIES = [
    312, 314, 314, 315, 315, 358, 360, 360, 360, 360, 360, 360,
];
const DEFAULT_BASELINE_SERIES = [
    340, 471, 506, 495, 557, 558, 558, 794, 794, 794, 876, 915,
];
const DEFAULT_DAY_LABELS = [
    "01 jun.",
    "03 jun.",
    "05 jun.",
    "08 jun.",
    "10 jun.",
    "13 jun.",
    "15 jun.",
    "18 jun.",
    "21 jun.",
    "24 jun.",
    "27 jun.",
    "29 jun.",
];
function formatCurrency(value, locale = "pt-BR", currency = "BRL") {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Math.abs(value));
}
function buildPath(values, width, height) {
    if (values.length === 0) {
        return "";
    }
    const stepX = values.length > 1 ? width / (values.length - 1) : 0;
    return values
        .map((value, index) => {
        const x = index * stepX;
        const y = height - value;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
        .join(" ");
}
function formatTooltipHeader(label) {
    return `${label} vs. mesmo dia do mes passado`;
}
export function MonthlySavingsInsightCard({ title = "Você gastou", amountSaved = 629, amountSuffix = "a menos este mês", dayLabels = DEFAULT_DAY_LABELS, actualSeries = DEFAULT_ACTUAL_SERIES, baselineSeries = DEFAULT_BASELINE_SERIES, loading = false, }) {
    const chart = useMemo(() => {
        const safeActual = actualSeries.length > 1 ? actualSeries : DEFAULT_ACTUAL_SERIES;
        const safeBaseline = baselineSeries.length > 1 ? baselineSeries : DEFAULT_BASELINE_SERIES;
        const safeLabels = dayLabels.length === safeBaseline.length ? dayLabels : DEFAULT_DAY_LABELS;
        const width = 100;
        const height = 100;
        const maxValue = Math.max(...safeActual, ...safeBaseline, 1);
        const normalize = (value) => (value / maxValue) * 70 + 12;
        const normalizedActual = safeActual.map(normalize);
        const normalizedBaseline = safeBaseline.map(normalize);
        const linePath = buildPath(normalizedActual, width, height);
        const baselinePath = buildPath(normalizedBaseline, width, height);
        const lastIndex = normalizedActual.length - 1;
        const lastX = normalizedActual.length > 1 ? (width / lastIndex) * lastIndex : width;
        const lastY = height - normalizedActual[lastIndex];
        return {
            baselinePath,
            lastX,
            lastY,
            linePath,
            tooltipPoints: normalizedBaseline.map((value, index) => ({
                actualAmount: safeActual[index] ?? 0,
                baselineAmount: safeBaseline[index] ?? 0,
                label: safeLabels[index] ?? `Dia ${index + 1}`,
                x: index * (normalizedBaseline.length > 1 ? width / lastIndex : 0),
                y: height - value,
            })),
        };
    }, [actualSeries, baselineSeries, dayLabels]);
    if (loading) {
        return _jsx(HomeCardSkeleton, { variant: "savings" });
    }
    return (_jsxs(Card, { className: "financial-panel-border h-full min-h-[32rem] ring-0", children: [_jsx(CardHeader, { className: "gap-4", children: _jsxs("div", { className: "space-y-3", children: [_jsx(CardDescription, { className: "text-[1.05rem]", children: title }), _jsxs("div", { className: "flex flex-wrap items-end gap-x-3 gap-y-2", children: [_jsx(CardTitle, { className: "text-4xl", children: _jsx(MaskedMonetaryValue, { format: formatCurrency, value: amountSaved }) }), _jsx("p", { className: "pb-0.5 text-2xl text-muted-foreground", children: amountSuffix })] })] }) }), _jsx(CardContent, { className: "flex h-full flex-col", children: _jsx(TooltipProvider, { delay: 80, children: _jsxs("div", { className: "relative h-56", children: [_jsxs("svg", { className: "h-full w-full", viewBox: "0 0 100 100", preserveAspectRatio: "none", "aria-hidden": "true", children: [_jsx("path", { d: chart.baselinePath, fill: "none", stroke: "rgba(255,255,255,0.32)", strokeDasharray: "2.5 3", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "0.7" }), _jsx("path", { d: chart.linePath, fill: "none", stroke: "#ffffff", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.4" }), _jsx("circle", { cx: chart.lastX, cy: chart.lastY, fill: "#ffffff", r: "1.7" }), _jsx("circle", { cx: chart.lastX, cy: chart.lastY, fill: "#0b0b0b", r: "1.05", stroke: "#ffffff", strokeWidth: "0.55" })] }), _jsx("div", { className: "absolute inset-0", children: chart.tooltipPoints.map((point, index) => (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { className: "absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full outline-hidden", style: {
                                                left: `${point.x}%`,
                                                top: `${point.y}%`,
                                            } }), _jsxs(TooltipContent, { className: "w-56 flex-col items-start gap-2 bg-white px-3 py-3 text-black", side: "top", sideOffset: 10, children: [_jsx("div", { className: "text-[11px] font-medium uppercase tracking-[0.08em] text-black/55", children: formatTooltipHeader(point.label) }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "text-sm font-medium text-black", children: ["Voce gastou", " ", _jsx(MaskedMonetaryText, { children: formatCurrency(point.actualAmount) })] }), _jsxs("div", { className: "text-sm text-black/68", children: ["Mes passado:", " ", _jsx(MaskedMonetaryText, { children: formatCurrency(point.baselineAmount) })] })] })] })] }, `${point.label}-${index}`))) })] }) }) })] }));
}
