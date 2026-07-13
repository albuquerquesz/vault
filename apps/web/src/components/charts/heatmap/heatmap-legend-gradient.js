"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from "motion/react";
import { memo } from "react";
import { buildHeatmapLegendGradient, resolveHeatmapHoverStyle, } from "./heatmap-utils";
const HEATMAP_INACTIVE_TRANSITION = {
    duration: 0.22,
    ease: [0.4, 0, 0.2, 1],
};
export const HeatmapLegendGradient = memo(function HeatmapLegendGradient({ levels, levelStyles, cellSize, gap, cornerRadius, gradientSpan, highlightedLevel, isDimming, inactiveOpacity, inactiveScale, activeScale, isInteractive, onEnter, onLeave, }) {
    const barWidth = gradientSpan * cellSize + (gradientSpan - 1) * gap;
    const barHeight = cellSize;
    const pillRadius = Math.min(cornerRadius, barHeight / 2);
    const segmentWidth = barWidth / levels.length;
    const gradient = buildHeatmapLegendGradient(levelStyles);
    return (_jsxs("div", { className: "relative shrink-0", style: { width: barWidth, height: barHeight }, children: [_jsx(motion.div, { animate: {
                    opacity: isDimming && highlightedLevel === null ? inactiveOpacity : 1,
                    scale: 1,
                }, "aria-hidden": "true", className: "absolute inset-0", initial: { opacity: 1, scale: 1 }, style: {
                    borderRadius: pillRadius,
                    background: gradient,
                }, transition: HEATMAP_INACTIVE_TRANSITION }), levels.map((level, index) => {
                const isHighlighted = highlightedLevel === level;
                const isDimmed = isDimming && !isHighlighted;
                const hoverStyle = resolveHeatmapHoverStyle(isHighlighted, isDimmed, {
                    inactiveOpacity,
                    inactiveScale,
                    activeScale,
                });
                return (_jsx(motion.span, { animate: {
                        opacity: hoverStyle.opacity,
                        scale: hoverStyle.scale,
                    }, className: "absolute top-0 block", initial: { opacity: 1, scale: 1 }, onPointerEnter: () => onEnter(level), onPointerLeave: onLeave, style: {
                        left: index * segmentWidth,
                        width: segmentWidth,
                        height: barHeight,
                        cursor: isInteractive ? "pointer" : undefined,
                        transformOrigin: "center center",
                    }, transition: HEATMAP_INACTIVE_TRANSITION }, level));
            })] }));
});
HeatmapLegendGradient.displayName = "HeatmapLegendGradient";
export default HeatmapLegendGradient;
