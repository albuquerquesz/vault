"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bar, BarChart, BarDepthBack, BarDepthFront, BarLineIndicator, BarPulse, BarXAxis, ChartTooltip, Grid, } from "@/components/bar-chart";
const brlFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});
const brlWholeFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});
/**
 * Vault inverts the bklit chart scale: `--chart-1` is near-white (oklch 0.92)
 * and `--chart-5` is charcoal (oklch 0.34). The Studio "3D Depth" demo paints
 * bars with a dark base (~0.32), so we use the dark end of our palette.
 */
const BAR_COLOR = "var(--chart-5)";
/** Lighter step so the peak day reads clearly without leaving the palette. */
const PEAK_BAR_COLOR = "var(--chart-3)";
function formatBrl(value) {
    return brlFormatter.format(value);
}
function formatBrlWhole(value) {
    return brlWholeFormatter.format(value);
}
function isPeakDay(datum, peakDay) {
    if (!peakDay) {
        return false;
    }
    return datum.dayNumber === peakDay.dayNumber;
}
export function DailySpendBarContent({ chartData, peakDay, }) {
    const peakIndex = peakDay != null ? peakDay.dayNumber - 1 : undefined;
    const colorFor = (datum, _index) => isPeakDay(datum, peakDay) ? PEAK_BAR_COLOR : BAR_COLOR;
    return (_jsxs("div", { className: "flex h-full min-h-55 w-full flex-1 flex-col gap-2", children: [peakDay ? (_jsx("p", { className: "shrink-0 self-start text-4xl mb-8 font-semibold tracking-tight tabular-nums text-foreground", children: formatBrlWhole(peakDay.amount) })) : null, _jsxs(BarChart, { className: "h-full min-h-50 flex-1", data: chartData, margin: { top: 8, right: 8, bottom: 40, left: 8 }, xDataKey: "day", children: [_jsx(Grid, { horizontal: true }), _jsx(BarDepthBack, { color: BAR_COLOR, colorAccessor: colorFor, dataKey: "amount" }), _jsx(Bar, { dataKey: "amount", fill: BAR_COLOR, fillAccessor: colorFor, perspective: true }), _jsx(BarDepthFront, { dataKey: "amount" }), peakIndex != null && peakIndex >= 0 ? (_jsx(BarPulse, { activeIndex: peakIndex, dataKey: "amount" })) : null, _jsx(BarXAxis, { maxLabels: 12 }), _jsx(ChartTooltip, { rows: (point) => {
                            const amount = typeof point.amount === "number" ? point.amount : 0;
                            const day = typeof point.day === "string"
                                ? point.day
                                : String(point.day ?? "");
                            const isPeak = peakDay != null && Number(point.dayNumber) === peakDay.dayNumber;
                            return [
                                {
                                    color: isPeak ? PEAK_BAR_COLOR : BAR_COLOR,
                                    label: isPeak ? `Dia ${day} · pico` : `Dia ${day}`,
                                    value: formatBrl(amount),
                                },
                            ];
                        }, showCrosshair: false, showDatePill: false, showDots: false }), _jsx(BarLineIndicator, { data: chartData, valueKey: "amount", xKey: "day" })] })] }));
}
