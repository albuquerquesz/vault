"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { CardContent, CardDescription, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, } from "@vault/ui/components/chart";
import { Bar, BarChart, XAxis } from "recharts";
import { DashboardCard } from "@/components/dashboard-card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
/** Demo: last 7 days. */
const salesDaily7 = [
    { day: "Mon", sales: 3200 },
    { day: "Tue", sales: 3001 },
    { day: "Wed", sales: 3780 },
    { day: "Thu", sales: 4100 },
    { day: "Fri", sales: 4520 },
    { day: "Sat", sales: 4004 },
    { day: "Sun", sales: 5340 },
];
const chartRows = salesDaily7.map((row) => ({ ...row }));
const firstDay = salesDaily7[0].sales;
const lastDay = salesDaily7.at(-1)?.sales ?? firstDay;
const growthPct = (((lastDay - firstDay) / firstDay) * 100).toFixed(1);
const chartConfig = {
    sales: {
        label: "Sales",
        color: "var(--chart-2)",
    },
};
function CustomGradientBar(props) {
    const { fill, x = 0, y = 0, width = 0, height = 0, dataKey = "sales", index = 0, } = props;
    const gid = `gradient-bar-${String(dataKey)}-${index}`;
    return (_jsxs(_Fragment, { children: [_jsx("rect", { fill: `url(#${gid})`, height: height, stroke: "none", width: width, x: x, y: y }), _jsx("rect", { fill: fill, height: 2, stroke: "none", width: width, x: x, y: y }), _jsx("defs", { children: _jsxs("linearGradient", { id: gid, x1: "0", x2: "0", y1: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: fill, stopOpacity: 0.5 }), _jsx("stop", { offset: "100%", stopColor: fill, stopOpacity: 0 })] }) })] }));
}
export function NetRevenueChart() {
    return (_jsxs(DashboardCard, { className: "gap-0 md:col-span-2", children: [_jsxs(CardHeader, { className: "gap-2", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(CardTitle, { children: "Net revenue" }), _jsxs(Delta, { value: Number(growthPct), variant: "badge", children: [_jsx(DeltaIcon, { variant: "trend" }), _jsx(DeltaValue, {})] })] }), _jsx(CardDescription, { children: "Daily net sales, last 7 days." })] }), _jsx(CardContent, { children: _jsx(ChartContainer, { className: "aspect-auto h-60 w-full md:h-80", config: chartConfig, children: _jsxs(BarChart, { accessibilityLayer: true, data: chartRows, children: [_jsx(XAxis, { axisLine: false, dataKey: "day", interval: 0, tickFormatter: (value) => String(value), tickLine: false, tickMargin: 10 }), _jsx(ChartTooltip, { content: _jsx(ChartTooltipContent, { hideLabel: true }), cursor: false }), _jsx(Bar, { dataKey: "sales", fill: "var(--color-sales)", shape: _jsx(CustomGradientBar, {}) })] }) }) })] }));
}
