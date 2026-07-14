"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, useSpring } from "motion/react";
import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { resolveTooltipBoxMotion, useChartConfig, } from "../chart-config-context";
import { chartCssVars, useChart, useChartStable, } from "../chart-context";
import { weekdayDateFmt } from "../chart-formatters";
import { DateTicker } from "./date-ticker";
import { TooltipBox } from "./tooltip-box";
import { TooltipContent } from "./tooltip-content";
import { TooltipDot } from "./tooltip-dot";
import { TooltipIndicator } from "./tooltip-indicator";
const ChartTooltipInner = memo(function ChartTooltipInner({ showDatePill = true, showCrosshair = true, showDots = true, dotVariant = "dot", dotSize = 5, dotRadiusFraction, dotScale = 1, dotStrokeWidth, indicatorColor: indicatorColorProp, content, rows: rowsRenderer, dotColor: dotColorProp, children, className = "", container, springConfig, matchCrosshair = false, damping, indicatorDasharray, indicatorFadeEdges, indicatorFadeLength, boxSpringConfig, panelStyle, backgroundColor, }) {
    const { tooltipData, width, height, innerHeight, margin, columnWidth, lines, xAccessor, dateLabels, containerRef, orientation, barXAccessor, bandWidth, squareSnap, } = useChart();
    const { tooltipSpring } = useChartConfig();
    const isHorizontal = orientation === "horizontal";
    const discreteInteraction = dateLabels.length > 60;
    const resolvedDotSize = useMemo(() => {
        if (dotVariant !== "ring" || !bandWidth || lines.length === 0) {
            return dotSize * dotScale;
        }
        const seriesCount = lines.length;
        const gap = squareSnap?.groupGap ?? (seriesCount > 1 ? 4 : 0);
        const squareSize = (bandWidth - gap * (seriesCount - 1)) / seriesCount;
        return (squareSize / 2) * dotScale;
    }, [
        bandWidth,
        dotScale,
        dotSize,
        dotVariant,
        lines.length,
        squareSnap?.groupGap,
    ]);
    const boxMotion = useMemo(() => {
        if (boxSpringConfig) {
            return {
                animate: !discreteInteraction,
                springConfig: boxSpringConfig,
            };
        }
        if (matchCrosshair) {
            return {
                animate: !discreteInteraction,
                springConfig: springConfig ?? tooltipSpring,
            };
        }
        return resolveTooltipBoxMotion(damping);
    }, [
        boxSpringConfig,
        damping,
        discreteInteraction,
        matchCrosshair,
        springConfig,
        tooltipSpring,
    ]);
    const visible = tooltipData !== null;
    const x = tooltipData?.x ?? 0;
    const xWithMargin = x + margin.left;
    // For horizontal charts, get the y position from the first line's yPosition (center of bar)
    const firstLineDataKey = lines[0]?.dataKey;
    const firstLineY = firstLineDataKey
        ? (tooltipData?.yPositions[firstLineDataKey] ?? 0)
        : 0;
    const yWithMargin = firstLineY + margin.top;
    const tooltipRows = useMemo(() => {
        if (!tooltipData) {
            return [];
        }
        if (rowsRenderer) {
            return rowsRenderer(tooltipData.point);
        }
        // Default: generate rows from registered lines
        return lines.map((line) => ({
            color: line.stroke,
            label: line.dataKey,
            value: tooltipData.point[line.dataKey] ?? 0,
        }));
    }, [tooltipData, lines, rowsRenderer]);
    const resolveDotColor = useMemo(() => {
        return (line, index) => {
            if (rowsRenderer && tooltipRows[index]?.color) {
                return tooltipRows[index].color;
            }
            if (dotColorProp != null) {
                if (typeof dotColorProp === "function" && tooltipData) {
                    return dotColorProp(tooltipData.point, line);
                }
                if (typeof dotColorProp === "string") {
                    return dotColorProp;
                }
            }
            return line.stroke;
        };
    }, [dotColorProp, rowsRenderer, tooltipData, tooltipRows]);
    // Resolve indicator color (static or from hovered point)
    const indicatorColor = useMemo(() => {
        if (indicatorColorProp == null) {
            return chartCssVars.crosshair;
        }
        if (typeof indicatorColorProp === "function") {
            return tooltipData
                ? indicatorColorProp(tooltipData.point)
                : chartCssVars.crosshair;
        }
        return indicatorColorProp;
    }, [indicatorColorProp, tooltipData]);
    // Title from date or category
    const title = useMemo(() => {
        if (!tooltipData) {
            return undefined;
        }
        // For bar charts (horizontal or vertical), use the category name
        if (barXAccessor) {
            return barXAccessor(tooltipData.point);
        }
        // For line/area charts, use the date
        return weekdayDateFmt.format(xAccessor(tooltipData.point));
    }, [tooltipData, barXAccessor, xAccessor]);
    const tooltipContent = (_jsxs(_Fragment, { children: [showCrosshair && (_jsx("svg", { "aria-hidden": "true", className: "pointer-events-none absolute inset-0", height: "100%", width: "100%", children: _jsx("g", { transform: `translate(${margin.left},${margin.top})`, children: _jsx(TooltipIndicator, { animate: !discreteInteraction, colorEdge: indicatorColor, colorMid: indicatorColor, columnWidth: columnWidth, fadeEdges: indicatorDasharray ? "none" : (indicatorFadeEdges ?? "both"), fadeLength: indicatorFadeLength, height: innerHeight, springConfig: springConfig, strokeDasharray: indicatorDasharray, visible: visible, width: "line", x: x }) }) })), showDots && visible && !isHorizontal && (_jsx("svg", { "aria-hidden": "true", className: "pointer-events-none absolute inset-0", height: "100%", width: "100%", children: _jsx("g", { transform: `translate(${margin.left},${margin.top})`, children: lines.map((line, index) => (_jsx(TooltipDot, { color: resolveDotColor(line, index), cornerRadiusFraction: dotVariant === "ring" ? dotRadiusFraction : undefined, size: resolvedDotSize, springConfig: springConfig, strokeColor: chartCssVars.background, strokeWidth: dotVariant === "ring" ? dotStrokeWidth : undefined, variant: dotVariant, visible: visible, x: tooltipData?.xPositions?.[line.dataKey] ?? x, y: tooltipData?.yPositions[line.dataKey] ?? 0 }, line.dataKey))) }) })), _jsx(TooltipBox, { animate: boxMotion.animate, backgroundColor: backgroundColor, className: className, containerHeight: height, containerRef: containerRef, containerWidth: width, panelStyle: panelStyle, springConfig: boxMotion.springConfig, top: isHorizontal ? undefined : margin.top, visible: visible, x: xWithMargin, y: isHorizontal ? yWithMargin : margin.top, children: content && tooltipData
                    ? content({
                        point: tooltipData.point,
                        index: tooltipData.index,
                    })
                    : !content && (_jsx(TooltipContent, { rows: tooltipRows, title: title, children: children })) }), _jsx(DatePillTracker, { currentIndex: tooltipData?.index ?? 0, discreteInteraction: discreteInteraction, enabled: showDatePill && !isHorizontal, labels: dateLabels, springConfig: springConfig, visible: visible, xWithMargin: xWithMargin })] }));
    return createPortal(tooltipContent, container);
});
export function ChartTooltip(props) {
    const { containerRef } = useChartStable();
    const [mounted, setMounted] = useState(false);
    // Only render portals on client side after mount
    useEffect(() => {
        setMounted(true);
    }, []);
    const container = containerRef.current;
    if (!(mounted && container)) {
        return null;
    }
    return _jsx(ChartTooltipInner, { ...props, container: container });
}
ChartTooltip.displayName = "ChartTooltip";
// Inner-only-on-visible so `useSpring` initializes at the real cursor x
// instead of `margin.left` on first hover.
function DatePillTracker(props) {
    if (!(props.enabled && props.visible && props.labels.length > 0)) {
        return null;
    }
    return _jsx(DatePillTrackerInner, { ...props });
}
function DatePillTrackerInner({ labels, currentIndex, xWithMargin, discreteInteraction, springConfig, visible, }) {
    const { tooltipSpring } = useChartConfig();
    const effectiveSpring = springConfig ?? tooltipSpring;
    const animatedX = useSpring(xWithMargin, effectiveSpring);
    if (!discreteInteraction) {
        animatedX.set(xWithMargin);
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: we need to jump the animatedX when the visible prop changes
    useEffect(() => {
        animatedX.set(xWithMargin);
    }, [animatedX, visible]);
    return (_jsx(motion.div, { className: "pointer-events-none absolute z-50", style: {
            left: discreteInteraction ? xWithMargin : animatedX,
            transform: "translateX(-50%)",
            bottom: 4,
        }, children: _jsx(DateTicker, { currentIndex: currentIndex, labels: labels, visible: visible }) }));
}
export default ChartTooltip;
