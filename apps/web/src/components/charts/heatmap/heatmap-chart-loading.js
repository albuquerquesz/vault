"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { generateHeatmapSkeletonFromTarget } from "./generate-heatmap-skeleton-data";
import { HeatmapCells } from "./heatmap-cells";
import { HeatmapChart } from "./heatmap-chart";
import { HeatmapXAxis } from "./heatmap-x-axis";
import { HeatmapYAxis } from "./heatmap-y-axis";
export function HeatmapChartLoading({ data, xDomain, margin, binSize = 0, gap = 2, cornerRadius = 2, label = "Loading", className = "", }) {
    const skeletonData = useMemo(() => generateHeatmapSkeletonFromTarget(data), [data]);
    return (_jsxs(HeatmapChart, { binSize: binSize, className: className, data: skeletonData, gap: gap, loadingLabel: label, margin: margin, status: "loading", xDomain: xDomain, children: [_jsx(HeatmapCells, { cornerRadius: cornerRadius, interactive: false }), _jsx(HeatmapXAxis, {}), _jsx(HeatmapYAxis, {})] }));
}
export default HeatmapChartLoading;
