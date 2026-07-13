"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { PatternLines, PieCenter, PieChart, PieSlice, slicePalette, } from "@/components/pie-chart";
const PATTERN_PRESETS = [
    { height: 6, width: 6, orientation: ["diagonal"] },
    { height: 6, width: 6, orientation: ["horizontal"] },
    { height: 6, width: 6, orientation: ["vertical"] },
    { height: 8, width: 8, orientation: ["diagonalRightToLeft"] },
];
function patternIdForIndex(index) {
    return `dp-${index + 1}`;
}
function patternFillForIndex(index) {
    // PatternLines registers SVG ids as `pattern-${id}`
    return `url(#pattern-${patternIdForIndex(index)})`;
}
function patternPresetForIndex(index) {
    return PATTERN_PRESETS[index % PATTERN_PRESETS.length];
}
function formatMonthLabel(month) {
    const [year, monthNumber] = month.split("-").map(Number);
    if (!year || !monthNumber) {
        return month;
    }
    const label = new Date(year, monthNumber - 1, 1).toLocaleDateString("pt-BR", {
        month: "long",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
}
function TrendIcon({ trend, }) {
    if (trend === "up") {
        return (_jsx(ArrowUpRight, { className: "h-4.5 w-4.5 text-emerald-500", "aria-label": "Melhor que m\u00EAs passado" }));
    }
    if (trend === "down") {
        return (_jsx(ArrowDownRight, { className: "h-4.5 w-4.5 text-rose-500", "aria-label": "Pior que m\u00EAs passado" }));
    }
    return (_jsx(ArrowRight, { className: "h-4.5 w-4.5 text-muted-foreground", "aria-label": "Sem varia\u00E7\u00E3o em rela\u00E7\u00E3o ao m\u00EAs passado" }));
}
export function OrderSourceMixContent({ month, sourceData, }) {
    const monthLabel = useMemo(() => formatMonthLabel(month), [month]);
    const pieData = useMemo(() => sourceData.map((datum, index) => ({
        label: datum.source,
        value: datum.amount,
        color: slicePalette[index % slicePalette.length],
        fill: patternFillForIndex(index),
    })), [sourceData]);
    return (_jsxs("div", { className: "flex flex-1 items-center gap-12", children: [_jsx("div", { className: "flex min-w-0 flex-[2] items-center justify-center", children: _jsx("div", { className: "relative flex h-[300px] w-[300px] shrink-0 items-center justify-center", children: _jsxs(PieChart, { data: pieData, innerRadius: 82, size: 300, children: [sourceData.map((datum, index) => {
                                const preset = patternPresetForIndex(index);
                                const stroke = slicePalette[index % slicePalette.length] ?? "var(--chart-1)";
                                return (_jsx(PatternLines, { background: "transparent", height: preset.height, id: patternIdForIndex(index), orientation: [...preset.orientation], stroke: stroke, strokeWidth: 1, width: preset.width }, `${datum.source}-pattern`));
                            }), sourceData.map((datum, index) => (_jsx(PieSlice, { fill: patternFillForIndex(index), index: index }, datum.source))), _jsx(PieCenter, { defaultLabel: monthLabel, formatOptions: {
                                    style: "currency",
                                    currency: "BRL",
                                    maximumFractionDigits: 0,
                                } })] }) }) }), _jsx("div", { className: "flex min-w-0 flex-[3] flex-col gap-4 pr-8", children: sourceData.map((datum, index) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "size-3 shrink-0", style: {
                                        backgroundColor: slicePalette[index % slicePalette.length],
                                    } }), _jsx("span", { className: "text-sm text-muted-foreground", children: datum.source })] }), _jsxs("div", { className: "ml-auto flex items-center gap-2", children: [_jsxs("span", { className: "text-sm font-medium tabular-nums", children: [datum.percentage.toFixed(1), "%"] }), _jsx(TrendIcon, { trend: datum.monthOverMonthTrend })] })] }, datum.source))) })] }));
}
