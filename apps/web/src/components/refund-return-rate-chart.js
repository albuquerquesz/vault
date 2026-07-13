"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, } from "@vault/ui/components/chart";
import { ArrowRightIcon } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
const returnDaily7 = [
    { day: "Mon", returnRate: 2.2 },
    { day: "Tue", returnRate: 1.5 },
    { day: "Wed", returnRate: 3.1 },
    { day: "Thu", returnRate: 4.8 },
    { day: "Fri", returnRate: 2.4 },
    { day: "Sat", returnRate: 3.2 },
    { day: "Sun", returnRate: 3.9 },
];
const REFUNDED_SHARE_OF_ORDERS_PCT = 2.6;
const chartConfig = {
    returnRate: {
        label: "Devolução %",
        color: "var(--chart-1)",
    },
};
export function RefundReturnRateChart() {
    const first = returnDaily7[0];
    const lastW = returnDaily7.at(-1) ?? first;
    const returnTrendPct = first.returnRate > 0
        ? ((lastW.returnRate - first.returnRate) / first.returnRate) * 100
        : 0;
    return (_jsxs(Card, { className: "financial-panel-border h-full min-h-[32rem] ring-0 md:col-span-2", children: [_jsxs(CardHeader, { className: "flex flex-col sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(CardTitle, { children: "Taxa de devolu\u00E7\u00E3o" }), _jsx(CardDescription, { children: "\u00DAltimos 7 dias" })] }), _jsxs("div", { className: "space-y-1 sm:text-right", children: [_jsxs(CardTitle, { className: "text-right", children: [REFUNDED_SHARE_OF_ORDERS_PCT, "%"] }), _jsx(CardDescription, { children: "dos pedidos reembolsados" })] })] }), _jsx(CardContent, { className: "mt-auto", children: _jsx(ChartContainer, { className: "aspect-auto h-64 w-full", config: chartConfig, children: _jsxs(LineChart, { accessibilityLayer: true, data: returnDaily7, margin: { left: 12, right: 12, top: 12, bottom: 0 }, children: [_jsx(CartesianGrid, { horizontal: false, strokeDasharray: "3 3" }), _jsx(XAxis, { axisLine: false, dataKey: "day", interval: 1, minTickGap: 8, tickLine: false, tickMargin: 8 }), _jsx(ChartTooltip, { content: _jsx(ChartTooltipContent, { indicator: "line" }) }), _jsx(Line, { dataKey: "returnRate", dot: false, stroke: "var(--color-returnRate)", strokeWidth: 2.5, type: "monotone" })] }) }) }), _jsxs(CardFooter, { children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-1 text-muted-foreground text-xs", children: [_jsxs(Delta, { value: returnTrendPct, children: [_jsx(DeltaIcon, {}), _jsx(DeltaValue, {})] }), _jsx("span", { className: "inline-flex min-w-0 text-pretty", children: "vs primeiro dia (\u00FAltimos 7 dias)" })] }), _jsxs(Button, { className: "text-muted-foreground", size: "xs", variant: "ghost", render: _jsx("a", { href: "#/orders/returns" }), nativeButton: false, children: ["Central de devolu\u00E7\u00F5es", _jsx(ArrowRightIcon, { "aria-hidden": "true", "data-icon": "inline-end" })] })] })] }));
}
