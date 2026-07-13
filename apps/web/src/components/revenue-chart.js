"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, } from "@vault/ui/components/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@vault/ui/components/select";
import { ArrowRightIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { formatChartAxisTick, formatChartTooltipDate, } from "@/components/formater";
import { revenueChartDemo } from "@/components/revenue-chart-data";
// Recharts XAxis: `interval` is tick skip index (0 = all, 1 = every other, …).
const xAxisIntervalByPeriod = {
    7: 0,
    14: 1,
    30: 3,
    60: 4,
    90: 6,
};
const chartConfig = {
    revenue: {
        label: "Receita",
        color: "var(--chart-1)",
    },
};
export function RevenueChart() {
    const chartUid = useId().replace(/:/g, "");
    const idAreaGradient = `revenue-area-grad-${chartUid}`;
    const [periodDays, setPeriodDays] = useState(60);
    const chartRows = useMemo(() => revenueChartDemo.slice(-periodDays), [periodDays]);
    // Footer delta: first → last point in the active series (not calendar MoM).
    const growthPct = useMemo(() => {
        const first = chartRows[0]?.revenue ?? 0;
        const last = chartRows.at(-1)?.revenue ?? first;
        if (!first) {
            return 0;
        }
        return ((last - first) / first) * 100;
    }, [chartRows]);
    // Extra spacing so long ranges don’t collide; pairs with `interval` above.
    const xAxisMinTickGap = periodDays <= 7
        ? undefined
        : Math.max(8, Math.min(52, Math.floor(periodDays / 2)));
    return (_jsxs(Card, { className: "financial-panel-border ring-0 md:col-span-2 lg:col-span-4", children: [_jsxs(CardHeader, { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsx(CardTitle, { className: "text-balance", children: "Receita" }), _jsxs(Select, { onValueChange: (v) => {
                            setPeriodDays(Number(v));
                        }, value: String(periodDays), children: [_jsx(SelectTrigger, { "aria-label": "Intervalo de tempo da receita", className: "w-full min-w-36 sm:w-fit", size: "sm", children: _jsx(SelectValue, { placeholder: "Per\u00EDodo" }) }), _jsxs(SelectContent, { align: "end", children: [_jsx(SelectItem, { value: "7", children: "\u00DAltimos 7 dias" }), _jsx(SelectItem, { value: "14", children: "\u00DAltimos 14 dias" }), _jsx(SelectItem, { value: "30", children: "\u00DAltimos 30 dias" }), _jsx(SelectItem, { value: "60", children: "\u00DAltimos 60 dias" }), _jsx(SelectItem, { value: "90", children: "\u00DAltimos 90 dias" })] })] })] }), _jsx(CardContent, { children: _jsx(ChartContainer, { className: "aspect-auto h-60 w-full p-0", config: chartConfig, children: _jsxs(AreaChart, { accessibilityLayer: true, 
                        // Copy so Recharts always sees a mutable array reference.
                        data: [...chartRows], margin: { left: 24, right: 8, top: 8, bottom: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: idAreaGradient, x1: "0", x2: "0", y1: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "var(--color-revenue)", stopOpacity: 0.2 }), _jsx("stop", { offset: "100%", stopColor: "var(--color-revenue)", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { horizontal: false, strokeDasharray: "2 2" }), _jsx(XAxis, { axisLine: false, dataKey: "date", interval: xAxisIntervalByPeriod[periodDays], minTickGap: xAxisMinTickGap, tickFormatter: (value) => formatChartAxisTick(String(value), periodDays), tickLine: false, tickMargin: 8 }), _jsx(ChartTooltip, { content: _jsx(ChartTooltipContent, { className: "min-w-36", indicator: "line", labelFormatter: (_, payload) => {
                                        const row = payload?.[0]?.payload;
                                        if (!row?.date) {
                                            return "";
                                        }
                                        return formatChartTooltipDate(row.date, "short");
                                    } }) }), _jsx(Area, { dataKey: "revenue", dot: false, fill: `url(#${idAreaGradient})`, stroke: "var(--color-revenue)", strokeWidth: 2, type: "monotone" })] }) }) }), _jsxs(CardFooter, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1 text-muted-foreground text-xs", children: [_jsxs(Delta, { value: growthPct, children: [_jsx(DeltaIcon, {}), _jsx(DeltaValue, {})] }), _jsxs("p", { className: "inline-flex text-pretty", children: ["vs primeiro dia nos \u00FAltimos ", periodDays, " dias."] })] }), _jsxs(Button, { className: "text-muted-foreground", size: "xs", variant: "ghost", render: _jsx("a", { href: "#/reports" }), nativeButton: false, children: ["Ver relat\u00F3rio", _jsx(ArrowRightIcon, { "aria-hidden": "true", "data-icon": "inline-end" })] })] })] }));
}
