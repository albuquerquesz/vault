"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useHeatmap } from "./heatmap-context";
import { getHeatmapColumnMonthAnchor } from "./heatmap-utils";
const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
export const HeatmapXAxis = memo(function HeatmapXAxis({ className, }) {
    const { containerRef, data, margin, xScale } = useHeatmap();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const labels = useMemo(() => {
        const ticks = [];
        let lastMonthKey = "";
        for (let columnIndex = 0; columnIndex < data.length; columnIndex++) {
            const column = data[columnIndex];
            if (!column) {
                continue;
            }
            const monthAnchor = getHeatmapColumnMonthAnchor(column);
            if (!monthAnchor) {
                continue;
            }
            const monthKey = `${monthAnchor.getFullYear()}-${monthAnchor.getMonth()}`;
            if (monthKey === lastMonthKey) {
                continue;
            }
            ticks.push({
                label: monthFmt.format(monthAnchor),
                x: margin.left + xScale(columnIndex),
                key: monthKey,
            });
            lastMonthKey = monthKey;
        }
        return ticks;
    }, [data, margin.left, xScale]);
    const container = containerRef.current;
    if (!(mounted && container)) {
        return null;
    }
    return createPortal(labels.map((tick) => (_jsx("div", { className: "pointer-events-none absolute", style: {
            top: 0,
            left: tick.x,
            width: 0,
            display: "flex",
            justifyContent: "flex-start",
        }, children: _jsx("span", { className: cn("whitespace-nowrap text-chart-label text-xs", className), children: tick.label }) }, tick.key))), container);
});
HeatmapXAxis.displayName = "HeatmapXAxis";
export default HeatmapXAxis;
