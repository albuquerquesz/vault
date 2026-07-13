"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { TooltipBox } from "../tooltip/tooltip-box";
import { useHeatmap, useHeatmapInteraction } from "./heatmap-context";
import { formatHeatmapContributionLabel, formatHeatmapTooltipDate, formatHeatmapTooltipWeekday, } from "./heatmap-utils";
import { useDelayedTooltipData } from "./use-delayed-tooltip-data";
export const HeatmapTooltip = memo(function HeatmapTooltip({ formatLabel = formatHeatmapContributionLabel, className = "", panelStyle, backgroundColor, showDelay = 0, hideDelay = 120, instant = false, }) {
    const { containerRef, width, height } = useHeatmap();
    const { tooltipData } = useHeatmapInteraction();
    const displayData = useDelayedTooltipData(tooltipData, showDelay, hideDelay);
    if (!displayData) {
        return null;
    }
    const { count, date } = displayData;
    return (_jsx(TooltipBox, { animate: false, backgroundColor: backgroundColor, className: className, containerHeight: height, containerRef: containerRef, containerWidth: width, entrance: !instant, panelStyle: panelStyle, visible: true, x: displayData.x, y: displayData.y, children: _jsx("div", { className: "overflow-hidden", children: _jsxs("div", { className: "px-3 py-2.5 text-left", children: [_jsx("div", { className: "font-medium text-chart-tooltip-foreground text-xs", children: formatHeatmapTooltipDate(date) }), _jsx("div", { className: "mt-0.5 text-chart-tooltip-muted text-xs", children: formatHeatmapTooltipWeekday(date) }), _jsx("div", { className: "my-2 border-chart-tooltip-muted/30 border-t" }), _jsx("div", { className: "text-chart-tooltip-foreground text-sm", children: formatLabel(count, date) })] }) }) }));
});
HeatmapTooltip.displayName = "HeatmapTooltip";
export default HeatmapTooltip;
