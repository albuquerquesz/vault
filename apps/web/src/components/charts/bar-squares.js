"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { motion } from "motion/react";
import { memo, useId, useMemo } from "react";
import { computeSquareColumn } from "./bar-squares-layout";
import { chartCssVars, useChart, useChartStable, useYScale, } from "./chart-context";
import { useChartLegendHover } from "./chart-legend-hover";
import { transitionWithDelay } from "./motion-utils";
import { renderPatternPreset } from "./pattern-preset";
function isPatternFill(fill) {
    return fill.startsWith("url(");
}
/** Delay between stacked squares within one column (bottom → top). */
function squareCascadeStepSeconds(enterTransition, animationDurationMs, squareCount) {
    if (squareCount <= 1) {
        return 0;
    }
    const durationMs = enterTransition?.type === "tween" &&
        typeof enterTransition.duration === "number"
        ? enterTransition.duration * 1000
        : animationDurationMs;
    const cascadeSpreadMs = durationMs * 0.4;
    return cascadeSpreadMs / 1000 / (squareCount - 1);
}
function cascadeColumnTransition(enterTransition, animationDurationMs, columnIndex, columnStaggerDelay, squareCount) {
    const cascadeStep = squareCascadeStepSeconds(enterTransition, animationDurationMs, squareCount);
    const base = transitionWithDelay(enterTransition, columnIndex * columnStaggerDelay);
    if (squareCount <= 1 || base.type !== "tween") {
        return base;
    }
    const baseDuration = typeof base.duration === "number"
        ? base.duration
        : animationDurationMs / 1000;
    return {
        ...base,
        duration: baseDuration + cascadeStep * (squareCount - 1),
    };
}
function SquareColumn({ x, baselineY, barLengthPx, squareSize, squareGap, squareRadius, squareFit, fill, useGradient, gradientStops, patternPreset, index, isFaded, fadedOpacity, animate, staggerDelay, animationDuration, enterTransition, revealEpoch, }) {
    const layout = useMemo(() => computeSquareColumn({
        barLengthPx,
        squareSize,
        gap: squareGap,
        fit: squareFit,
    }), [barLengthPx, squareSize, squareGap, squareFit]);
    const rx = squareSize * squareRadius;
    const columnTop = baselineY - layout.columnHeight;
    const gradientId = `bar-squares-gradient-${index}-${revealEpoch}`;
    const patternFill = isPatternFill(fill);
    const patternId = `bar-squares-pattern-${index}-${revealEpoch}`;
    const effectiveFill = useMemo(() => {
        if (useGradient) {
            if (patternFill && patternPreset && patternPreset !== "none") {
                return `url(#${patternId})`;
            }
            return `url(#${gradientId})`;
        }
        return fill;
    }, [useGradient, patternFill, patternPreset, fill, gradientId, patternId]);
    const cascadeStep = squareCascadeStepSeconds(enterTransition, animationDuration, layout.count);
    const squareOpacity = isFaded ? fadedOpacity : 1;
    const gradientPatternNode = useGradient && patternFill && patternPreset && patternPreset !== "none"
        ? renderPatternPreset(patternPreset, patternId, {
            color: `url(#${gradientId})`,
        })
        : null;
    const gradientDefs = useGradient ? (_jsxs("defs", { children: [_jsx("linearGradient", { gradientUnits: "userSpaceOnUse", id: gradientId, x1: 0, x2: 0, y1: baselineY, y2: columnTop, children: gradientStops.map((stop) => (_jsx("stop", { offset: `${stop.offset}%`, stopColor: stop.color }, `${stop.offset}-${stop.color}`))) }), gradientPatternNode] })) : null;
    const squares = layout.positions.map((relY, squareIndex) => {
        const y = columnTop + relY;
        const bottomY = y + squareSize;
        const key = `sq-${index}-${squareIndex}-${revealEpoch}`;
        if (!animate) {
            return (_jsx("rect", { fill: effectiveFill, height: squareSize, opacity: squareOpacity, rx: rx, ry: rx, width: squareSize, x: x, y: y }, key));
        }
        return (_jsx(motion.rect, { animate: { attrY: y, height: squareSize, opacity: squareOpacity }, fill: effectiveFill, height: squareSize, initial: { attrY: bottomY, height: 0, opacity: 1 }, rx: rx, ry: rx, transition: {
                ...transitionWithDelay(enterTransition, index * staggerDelay + squareIndex * cascadeStep),
                opacity: { duration: 0.15 },
            }, width: squareSize, x: x }, key));
    });
    return (_jsxs(_Fragment, { children: [gradientDefs, squares] }));
}
const BarSquaresInner = memo(function BarSquaresInner({ dataKey, yAxisId, fill = chartCssVars.linePrimary, squareGap = 3, squareRadius = 0.25, squareFit = false, useGradient = false, gradientStops = [], patternPreset, animate = true, fadedOpacity = 0.3, staggerDelay, groupGap = 4, barScale, bandWidth, barXAccessor, }) {
    const { data, innerHeight, hoveredBarIndex, lines, orientation, stacked, animationDuration, enterTransition, revealEpoch = 0, } = useChart();
    const { hoveredIndex: legendHoveredIndex } = useChartLegendHover();
    const uniqueId = useId();
    const isHorizontal = orientation === "horizontal";
    const isUnsupported = isHorizontal || stacked;
    const seriesIndex = useMemo(() => {
        const idx = lines.findIndex((l) => l.dataKey === dataKey);
        return idx >= 0 ? idx : 0;
    }, [lines, dataKey]);
    const seriesConfig = lines[seriesIndex];
    const valueScale = useYScale(yAxisId ?? seriesConfig?.yAxisId);
    const isLegendDimmed = legendHoveredIndex !== null && legendHoveredIndex !== seriesIndex;
    const seriesCount = lines.length;
    const squareSize = useMemo(() => {
        if (!bandWidth || seriesCount === 0) {
            return 0;
        }
        const effectiveGroupGap = seriesCount > 1 ? groupGap : 0;
        return (bandWidth - effectiveGroupGap * (seriesCount - 1)) / seriesCount;
    }, [bandWidth, seriesCount, groupGap]);
    const totalAnimDuration = animationDuration || 1100;
    const staggerSpread = totalAnimDuration * 0.4;
    const calculatedStaggerDelay = staggerDelay ?? (data.length > 1 ? staggerSpread / 1000 / data.length : 0);
    const baselineY = valueScale(0) ?? innerHeight;
    const stops = gradientStops.length >= 2
        ? gradientStops
        : [
            { offset: 0, color: fill },
            { offset: 100, color: fill },
        ];
    if (isUnsupported) {
        return null;
    }
    return (_jsx("g", { className: `bar-squares-${uniqueId}`, children: data.map((d, i) => {
            const value = d[dataKey];
            if (typeof value !== "number" || value <= 0) {
                return null;
            }
            const categoryValue = barXAccessor(d);
            const bandPos = barScale(categoryValue) ?? 0;
            const effectiveGroupGap = seriesCount > 1 ? groupGap : 0;
            const x = bandPos + seriesIndex * (squareSize + effectiveGroupGap);
            const valuePos = valueScale(value) ?? 0;
            const barLengthPx = baselineY - valuePos;
            const isFaded = (hoveredBarIndex !== null && hoveredBarIndex !== i) || isLegendDimmed;
            return (_jsx(SquareColumn, { animate: animate, animationDuration: animationDuration || 1100, barLengthPx: barLengthPx, baselineY: baselineY, enterTransition: enterTransition, fadedOpacity: fadedOpacity, fill: fill, gradientStops: stops, index: i, isFaded: isFaded, patternPreset: patternPreset, revealEpoch: revealEpoch, squareFit: squareFit, squareGap: squareGap, squareRadius: squareRadius, squareSize: squareSize, staggerDelay: calculatedStaggerDelay, useGradient: useGradient, x: x }, `bar-squares-${dataKey}-${categoryValue}`));
        }) }));
});
export function BarSquares(props) {
    const { barScale, bandWidth, barXAccessor } = useChartStable();
    if (!(barScale && bandWidth && barXAccessor)) {
        console.warn("BarSquares must be used within a BarChart");
        return null;
    }
    return (_jsx(BarSquaresInner, { ...props, bandWidth: bandWidth, barScale: barScale, barXAccessor: barXAccessor }));
}
BarSquares.displayName = "BarSquares";
const BarColumnTrackInner = memo(function BarColumnTrackInner({ fill = chartCssVars.grid, opacity = 0.3, squareGap = 3, squareRadius = 0.25, squareFit = false, groupGap = 4, staggerDelay, barScale, bandWidth, barXAccessor, }) {
    const { data, lines, orientation, stacked, hoveredBarIndex, animationDuration, enterTransition, revealEpoch = 0, } = useChart();
    const uniqueId = useId();
    const isHorizontal = orientation === "horizontal";
    const isUnsupported = isHorizontal || stacked;
    const seriesCount = lines.length;
    const squareSize = useMemo(() => {
        if (!bandWidth || seriesCount === 0) {
            return 0;
        }
        const effectiveGroupGap = seriesCount > 1 ? groupGap : 0;
        return (bandWidth - effectiveGroupGap * (seriesCount - 1)) / seriesCount;
    }, [bandWidth, seriesCount, groupGap]);
    const totalAnimDuration = animationDuration || 1100;
    const staggerSpread = totalAnimDuration * 0.4;
    const calculatedStaggerDelay = staggerDelay ?? (data.length > 1 ? staggerSpread / 1000 / data.length : 0);
    if (isUnsupported) {
        return null;
    }
    const rx = squareSize * squareRadius;
    const effectiveOpacity = hoveredBarIndex === null ? opacity : 0;
    return (_jsx("g", { className: `bar-column-track-${uniqueId}`, style: { transition: "opacity 0.15s ease-in-out" }, children: data.map((d, i) => {
            const categoryValue = barXAccessor(d);
            const bandPos = barScale(categoryValue) ?? 0;
            const effectiveGroupGap = seriesCount > 1 ? groupGap : 0;
            return lines.map((line, seriesIndex) => (_jsx(TrackColumn, { animate: true, bandPos: bandPos, d: d, dataKey: line.dataKey, effectiveGroupGap: effectiveGroupGap, effectiveOpacity: effectiveOpacity, enterTransition: enterTransition, fill: fill, index: i, revealEpoch: revealEpoch, rx: rx, seriesIndex: seriesIndex, squareFit: squareFit, squareGap: squareGap, squareSize: squareSize, staggerDelay: calculatedStaggerDelay, yAxisId: line.yAxisId }, `track-${i}-${line.dataKey}`)));
        }) }));
});
function TrackColumn({ d, dataKey, yAxisId, bandPos, seriesIndex, effectiveGroupGap, squareSize, squareGap, squareFit, fill, rx, effectiveOpacity, index, staggerDelay, animate, enterTransition, revealEpoch, }) {
    const { innerHeight, animationDuration: chartAnimationDuration } = useChart();
    const valueScale = useYScale(yAxisId);
    const value = d[dataKey];
    if (typeof value !== "number" || value <= 0) {
        return null;
    }
    const baselineY = valueScale(0) ?? innerHeight;
    const valuePos = valueScale(value) ?? 0;
    const barLengthPx = baselineY - valuePos;
    const layout = computeSquareColumn({
        barLengthPx,
        squareSize,
        gap: squareGap,
        fit: squareFit,
    });
    const columnTop = baselineY - layout.columnHeight;
    const trackHeight = Math.max(0, columnTop);
    if (trackHeight <= 0 && !animate) {
        return null;
    }
    const x = bandPos + seriesIndex * (squareSize + effectiveGroupGap);
    const enterAnim = cascadeColumnTransition(enterTransition, chartAnimationDuration || 1100, index, staggerDelay, layout.count);
    const animatedHeight = trackHeight > 0 ? trackHeight : 0;
    if (animate) {
        return (_jsx(motion.rect, { animate: { height: animatedHeight, y: 0 }, fill: fill, height: animatedHeight, initial: { height: baselineY, y: 0 }, opacity: effectiveOpacity, rx: rx, ry: rx, transition: enterAnim, width: squareSize, x: x }, `track-${index}-${seriesIndex}-${revealEpoch}`));
    }
    if (trackHeight <= 0) {
        return null;
    }
    return (_jsx("rect", { fill: fill, height: trackHeight, opacity: effectiveOpacity, rx: rx, ry: rx, width: squareSize, x: x, y: 0 }));
}
export function BarColumnTrack(props) {
    const { barScale, bandWidth, barXAccessor } = useChartStable();
    if (!(barScale && bandWidth && barXAccessor)) {
        console.warn("BarColumnTrack must be used within a BarChart");
        return null;
    }
    return (_jsx(BarColumnTrackInner, { ...props, bandWidth: bandWidth, barScale: barScale, barXAccessor: barXAccessor }));
}
BarColumnTrack.displayName = "BarColumnTrack";
export default BarSquares;
