"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GridColumns, GridRows } from "@visx/grid";
import { motion } from "motion/react";
import { useId } from "react";
import { chartCssVars, useChartStable, useYScale } from "./chart-context";
import { useGridShimmer } from "./use-grid-shimmer";
import { isLoadingChromePhase, isLoadingGridChromePhase, } from "./y-domain-utils";
const DEFAULT_SHIMMER_LENGTH_PX = 140;
const DEFAULT_SHIMMER_SPEED = 1;
const DEFAULT_SHIMMER_STROKE = "color-mix(in oklch, var(--foreground) 68%, transparent)";
function hideEdgeTicks(ticks, hideEdgeLines) {
    if (!hideEdgeLines || ticks.length <= 2) {
        return ticks;
    }
    return ticks.slice(1, -1);
}
function resolveRowTickValues(options) {
    const { hideHorizontalEdgeLines, numTicksRows, rowTickValues, yScale } = options;
    const ticks = rowTickValues ?? (yScale.ticks ? yScale.ticks(numTicksRows) : []);
    const filtered = hideEdgeTicks(ticks, hideHorizontalEdgeLines);
    if (filtered === ticks && !rowTickValues && !hideHorizontalEdgeLines) {
        return undefined;
    }
    return filtered.length > 0 ? filtered : undefined;
}
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: grid fade masks and shimmer share one layer tree
export function Grid({ horizontal = true, vertical = false, numTicksRows = 5, numTicksColumns = 10, rowTickValues, stroke = chartCssVars.grid, loadingStroke, strokeOpacity = 1, strokeWidth = 1, strokeDasharray = "4,4", highlightRowValues, highlightRowStroke = chartCssVars.foregroundMuted, highlightRowStrokeOpacity = 1, highlightRowStrokeWidth = 1, highlightRowStrokeDasharray = "0", fadeHorizontal = true, fadeVertical = false, hideHorizontalEdgeLines = false, hideVerticalEdgeLines = false, yAxisId, shimmer = false, shimmerStroke = DEFAULT_SHIMMER_STROKE, shimmerLength = DEFAULT_SHIMMER_LENGTH_PX, shimmerSpeed = DEFAULT_SHIMMER_SPEED, shimmerSync = false, }) {
    const { xScale, innerWidth, innerHeight, orientation, barScale, chartPhase } = useChartStable();
    const yScale = useYScale(yAxisId);
    const shimmerActive = shimmer && isLoadingChromePhase(chartPhase);
    const gridStroke = isLoadingGridChromePhase(chartPhase) && loadingStroke != null
        ? loadingStroke
        : stroke;
    const { shimmerEnabled, shimmerTransform } = useGridShimmer({
        innerWidth,
        shimmer,
        shimmerLength,
        shimmerSpeed,
        shimmerSync,
        active: shimmerActive,
    });
    // For bar charts, determine which scale to use for grid lines
    // Horizontal bar charts: vertical grid should use yScale (value scale)
    // Vertical bar charts: horizontal grid uses yScale (value scale)
    const isHorizontalBarChart = orientation === "horizontal" && barScale;
    // For vertical grid lines in horizontal bar charts, use yScale (the value scale)
    // For time-based charts, use xScale
    const columnScale = isHorizontalBarChart ? yScale : xScale;
    const rowTickValuesResolved = resolveRowTickValues({
        hideHorizontalEdgeLines,
        numTicksRows,
        rowTickValues,
        yScale,
    });
    const columnTickValuesResolved = vertical &&
        columnScale &&
        typeof columnScale === "function" &&
        hideVerticalEdgeLines
        ? (() => {
            const ticks = columnScale.ticks?.(numTicksColumns) ?? [];
            const filtered = hideEdgeTicks(ticks, true);
            return filtered.length > 0 ? filtered : undefined;
        })()
        : undefined;
    const uniqueId = useId();
    // Horizontal fade mask (for grid rows - fades left/right)
    const hMaskId = `grid-rows-fade-${uniqueId}`;
    const hGradientId = `${hMaskId}-gradient`;
    const shimmerGradientId = `grid-shimmer-${uniqueId}`;
    // Vertical fade mask (for grid columns - fades top/bottom)
    const vMaskId = `grid-cols-fade-${uniqueId}`;
    const vGradientId = `${vMaskId}-gradient`;
    const horizontalFadeMask = fadeHorizontal ? `url(#${hMaskId})` : undefined;
    return (_jsxs("g", { className: "chart-grid", children: [horizontal && fadeHorizontal && (_jsxs("defs", { children: [_jsxs("linearGradient", { id: hGradientId, x1: "0%", x2: "100%", y1: "0%", y2: "0%", children: [_jsx("stop", { offset: "0%", style: { stopColor: "white", stopOpacity: 0 } }), _jsx("stop", { offset: "10%", style: { stopColor: "white", stopOpacity: 1 } }), _jsx("stop", { offset: "90%", style: { stopColor: "white", stopOpacity: 1 } }), _jsx("stop", { offset: "100%", style: { stopColor: "white", stopOpacity: 0 } })] }), _jsx("mask", { id: hMaskId, children: _jsx("rect", { fill: `url(#${hGradientId})`, height: innerHeight, width: innerWidth, x: "0", y: "0" }) })] })), horizontal && shimmerEnabled ? (_jsx("defs", { children: _jsxs(motion.linearGradient, { gradientTransform: shimmerTransform, gradientUnits: "userSpaceOnUse", id: shimmerGradientId, x1: 0, x2: shimmerLength, y1: 0, y2: 0, children: [_jsx("stop", { offset: "0%", stopColor: shimmerStroke, stopOpacity: 0 }), _jsx("stop", { offset: "35%", stopColor: shimmerStroke, stopOpacity: 0.45 }), _jsx("stop", { offset: "50%", stopColor: shimmerStroke, stopOpacity: 1 }), _jsx("stop", { offset: "65%", stopColor: shimmerStroke, stopOpacity: 0.45 }), _jsx("stop", { offset: "100%", stopColor: shimmerStroke, stopOpacity: 0 })] }) })) : null, vertical && fadeVertical && (_jsxs("defs", { children: [_jsxs("linearGradient", { id: vGradientId, x1: "0%", x2: "0%", y1: "0%", y2: "100%", children: [_jsx("stop", { offset: "0%", style: { stopColor: "white", stopOpacity: 0 } }), _jsx("stop", { offset: "10%", style: { stopColor: "white", stopOpacity: 1 } }), _jsx("stop", { offset: "90%", style: { stopColor: "white", stopOpacity: 1 } }), _jsx("stop", { offset: "100%", style: { stopColor: "white", stopOpacity: 0 } })] }), _jsx("mask", { id: vMaskId, children: _jsx("rect", { fill: `url(#${vGradientId})`, height: innerHeight, width: innerWidth, x: "0", y: "0" }) })] })), horizontal && (_jsxs("g", { mask: horizontalFadeMask, children: [_jsx(GridRows, { numTicks: rowTickValuesResolved ? undefined : numTicksRows, scale: yScale, stroke: gridStroke, strokeDasharray: strokeDasharray, strokeOpacity: strokeOpacity, strokeWidth: strokeWidth, tickValues: rowTickValuesResolved, width: innerWidth }), shimmerEnabled ? (_jsx(GridRows, { numTicks: rowTickValuesResolved ? undefined : numTicksRows, scale: yScale, stroke: `url(#${shimmerGradientId})`, strokeDasharray: strokeDasharray, strokeOpacity: 1, strokeWidth: strokeWidth, tickValues: rowTickValuesResolved, width: innerWidth })) : null] })), horizontal && highlightRowValues && highlightRowValues.length > 0 ? (_jsx("g", { className: "chart-grid-highlight-rows", children: highlightRowValues.map((value) => {
                    const y = yScale(value);
                    if (y == null || !Number.isFinite(y)) {
                        return null;
                    }
                    return (_jsx("line", { stroke: highlightRowStroke, strokeDasharray: highlightRowStrokeDasharray, strokeOpacity: highlightRowStrokeOpacity, strokeWidth: highlightRowStrokeWidth, x1: 0, x2: innerWidth, y1: y, y2: y }, value));
                }) })) : null, vertical && columnScale && typeof columnScale === "function" && (_jsx("g", { mask: fadeVertical ? `url(#${vMaskId})` : undefined, children: _jsx(GridColumns, { height: innerHeight, numTicks: columnTickValuesResolved ? undefined : numTicksColumns, scale: columnScale, stroke: stroke, strokeDasharray: strokeDasharray, strokeOpacity: strokeOpacity, strokeWidth: strokeWidth, tickValues: columnTickValuesResolved }) }))] }));
}
Grid.displayName = "Grid";
export default Grid;
