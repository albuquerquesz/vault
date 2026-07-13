"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
import { motion } from "motion/react";
import { memo, useCallback } from "react";
import { defaultHeatmapColorScale, } from "./heatmap-colors";
import { useHeatmapInteractionOptional } from "./heatmap-context";
import { HeatmapLegendGradient } from "./heatmap-legend-gradient";
import { HeatmapLegendSwatch } from "./heatmap-legend-swatch";
import { getHeatmapContributionLevel, isHeatmapHoverEffectEnabled, resolveHeatmapHoverStyle, } from "./heatmap-utils";
export const HEATMAP_LEGEND_LEVELS = [0, 1, 2, 3, 4];
const HEATMAP_INACTIVE_OPACITY = 0.3;
/** Smooth tween for inactive opacity + scale on hover. */
const HEATMAP_INACTIVE_TRANSITION = {
    duration: 0.22,
    ease: [0.4, 0, 0.2, 1],
};
export const HeatmapLegend = memo(function HeatmapLegend({ lessLabel = "Less", moreLabel = "More", cellSize = 11, gap = 2, cornerRadius = 2, align = "end", variant = "swatches", gradientSpan = 5, fontSize, labelClassName, levelStyles: levelStylesProp, colorScale = defaultHeatmapColorScale, inactiveOpacity = HEATMAP_INACTIVE_OPACITY, inactiveScale = 1, activeScale = 1, interactive, className, }) {
    const interaction = useHeatmapInteractionOptional();
    const isInteractive = interactive ?? interaction != null;
    const levelStyles = levelStylesProp ??
        HEATMAP_LEGEND_LEVELS.map((level) => ({
            color: colorScale(level),
            fillMode: "solid",
            pattern: "none",
        }));
    const { hoveredLegendLevel, tooltipData, setHoveredCell, setHoveredLegendLevel, setTooltipData, } = interaction ?? {
        hoveredLegendLevel: null,
        tooltipData: null,
        setHoveredCell: () => undefined,
        setHoveredLegendLevel: () => undefined,
        setTooltipData: () => undefined,
    };
    const highlightedLevel = hoveredLegendLevel ??
        (tooltipData ? getHeatmapContributionLevel(tooltipData.count) : null);
    const hoverParams = { inactiveOpacity, inactiveScale, activeScale };
    const inactiveEnabled = isHeatmapHoverEffectEnabled(hoverParams);
    const isDimming = isInteractive && highlightedLevel !== null && inactiveEnabled;
    const handleLegendEnter = useCallback((level) => {
        if (!isInteractive) {
            return;
        }
        setHoveredLegendLevel(level);
        setHoveredCell(null);
        setTooltipData(null);
    }, [isInteractive, setHoveredCell, setHoveredLegendLevel, setTooltipData]);
    const handleLegendLeave = useCallback(() => {
        if (!isInteractive) {
            return;
        }
        setHoveredLegendLevel(null);
    }, [isInteractive, setHoveredLegendLevel]);
    const labelStyle = fontSize == null ? undefined : { fontSize };
    return (_jsxs("div", { className: cn("flex w-full items-center gap-1.5 text-chart-label text-xs", align === "start" && "justify-start", align === "center" && "justify-center", align === "end" && "justify-end", className), style: labelStyle, children: [_jsx("span", { className: labelClassName, children: lessLabel }), variant === "gradient" ? (_jsx(HeatmapLegendGradient, { activeScale: activeScale, cellSize: cellSize, cornerRadius: cornerRadius, gap: gap, gradientSpan: gradientSpan, highlightedLevel: highlightedLevel, inactiveOpacity: inactiveOpacity, inactiveScale: inactiveScale, isDimming: isDimming, isInteractive: isInteractive, levelStyles: levelStyles, levels: HEATMAP_LEGEND_LEVELS, onEnter: handleLegendEnter, onLeave: handleLegendLeave })) : (_jsx("div", { className: "flex items-center", style: { gap }, children: HEATMAP_LEGEND_LEVELS.map((level) => {
                    const isHighlighted = highlightedLevel === level;
                    const isDimmed = isDimming && !isHighlighted;
                    const hoverStyle = resolveHeatmapHoverStyle(isHighlighted, isDimmed, hoverParams);
                    const style = levelStyles[level];
                    return (_jsx(motion.span, { animate: {
                            opacity: hoverStyle.opacity,
                            scale: hoverStyle.scale,
                        }, "aria-hidden": "true", className: "block shrink-0 leading-none", initial: { opacity: 1, scale: 1 }, onPointerEnter: () => handleLegendEnter(level), onPointerLeave: handleLegendLeave, style: {
                            cursor: isInteractive ? "pointer" : undefined,
                        }, transition: HEATMAP_INACTIVE_TRANSITION, children: _jsx(HeatmapLegendSwatch, { cellSize: cellSize, cornerRadius: cornerRadius, level: level, style: style }) }, level));
                }) })), _jsx("span", { className: labelClassName, children: moreLabel })] }));
});
HeatmapLegend.displayName = "HeatmapLegend";
export default HeatmapLegend;
