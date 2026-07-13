"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { HeatmapCells, HeatmapChart, HeatmapLegend, HeatmapTooltip, } from "@/components/charts/heatmap";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
function formatCurrency(value, currency, maximumFractionDigits = 1) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits,
    }).format(value);
}
export function DailyExpensesHeatmapContent({ heatmapData, total, currency, locale, }) {
    return (_jsxs("div", { className: "flex flex-1 flex-col space-y-6", children: [_jsx("div", { className: "flex flex-col gap-3", children: _jsx("p", { className: "text-3xl font-semibold tracking-tight sm:text-4xl", children: _jsx(MaskedMonetaryValue, { format: (value) => formatCurrency(value, currency), value: total }) }) }), _jsxs(HeatmapChart, { binSize: 16, data: heatmapData, gap: 3, margin: { top: 4, right: 0, bottom: 0, left: 0 }, status: "ready", children: [_jsx(HeatmapCells, { cornerRadius: 3 }), _jsx(HeatmapTooltip, { showDelay: 300, formatLabel: (count, _date) => `${new Intl.NumberFormat(locale, {
                            style: "currency",
                            currency,
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }).format(count)} em despesas` })] }), _jsx("div", { className: "flex justify-start md:justify-end", children: _jsx(HeatmapLegend, { lessLabel: "Menor", moreLabel: "Maior", cellSize: 8 }) })] }));
}
