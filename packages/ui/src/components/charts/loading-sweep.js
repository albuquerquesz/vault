"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { scaleLinear } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, } from "react";
import { chartCssVars, useChartStable } from "./chart-context";
import { LINE_LOADING_PULSE_EASE, LOADING_LABEL_EXIT_S, } from "./line-loading-timing";
/** One shimmer sweep, in seconds. */
const DEFAULT_SWEEP_DURATION_S = 2;
/** Sweep travel in objectBoundingBox space: off the left edge to off the right. */
const SWEEP_START_X = -1;
const SWEEP_END_X = 2;
/** Diagonal tilt of the shimmer band, in degrees. */
const SWEEP_ANGLE_DEG = 25;
const HEIGHT_MIN_PCT = 20;
const HEIGHT_MAX_PCT = 80;
const DEFAULT_POINT_COUNT = 14;
const BAR_CORNER_RADIUS = 2;
const DEFAULT_BAR_COUNT = 12;
const DEFAULT_FILL = "var(--foreground)";
const DEFAULT_BAR_FILL_OPACITY = 0.45;
const LINE_STROKE_OPACITY = 0.55;
const AREA_FILL_TOP_OPACITY = 0.18;
const AREA_FILL_BOTTOM_OPACITY = 0.02;
/** Bar width as a fraction of its band (the rest is the inter-bar gap). */
const DEFAULT_BAR_FRACTION = 0.7;
// ─── Pure, SSR-safe helpers ──────────────────────────────────────────────
// Heights come from a deterministic hash of (index, seed), never
// `Math.random()`, so the first server render and first client render agree
// (no Next.js hydration mismatch). Re-randomizing only bumps the numeric seed
// on the client, after a sweep completes.
/** Cheap deterministic hash to a fractional part in [0, 1). */
function hashFract(n) {
    const x = Math.sin(n) * 43_758.5453;
    return x - Math.floor(x);
}
/** Deterministic heights (percentages of the available height) for a seed. */
export function getSkeletonHeights(count, seed = 0, min = HEIGHT_MIN_PCT, max = HEIGHT_MAX_PCT) {
    const range = max - min;
    return Array.from({ length: count }, (_, i) => min + Math.floor(hashFract((i + 1) * 12.9898 + seed) * range));
}
/** Deterministic up/down (±1) per bar for the "center" baseline. */
function getSkeletonSigns(count, seed = 0) {
    return Array.from({ length: count }, (_, i) => hashFract((i + 1) * 78.233 + seed) < 0.5 ? -1 : 1);
}
/** Bell-curve opacity stops (sin squared) for the shimmer band's soft edges. */
function generateEasedGradientStops(steps = 17, minOpacity = 0.05, maxOpacity = 0.9) {
    return Array.from({ length: steps }, (_, i) => {
        const t = i / (steps - 1);
        const eased = Math.sin(t * Math.PI) ** 2;
        const opacity = minOpacity + eased * (maxOpacity - minOpacity);
        return {
            offset: `${(t * 100).toFixed(0)}%`,
            opacity: Number(opacity.toFixed(3)),
        };
    });
}
// ─── Shared mask defs (`${chartId}-mask` is the mask id) ─────────────────────
function LoadingSweepMask({ chartId, width, height, durationSeconds, onSweepComplete, }) {
    const gradientStops = useMemo(() => generateEasedGradientStops(), []);
    const lastXRef = useRef(SWEEP_START_X);
    const handleUpdate = useCallback((latest) => {
        const xValue = typeof latest.x === "number" ? latest.x : SWEEP_START_X;
        // Re-roll once the band has cleared the visible area (crossed past 1),
        // so the silhouette never changes shape under the user's eye.
        if (xValue >= 1 && lastXRef.current < 1) {
            onSweepComplete();
        }
        lastXRef.current = xValue;
    }, [onSweepComplete]);
    return (_jsxs(_Fragment, { children: [_jsx("linearGradient", { id: `${chartId}-grad`, x1: "0", x2: "1", y1: "0", y2: "0", children: gradientStops.map(({ offset, opacity }) => (_jsx("stop", { offset: offset, stopColor: "white", stopOpacity: opacity }, offset))) }), _jsx("pattern", { height: "1", id: `${chartId}-pattern`, patternContentUnits: "objectBoundingBox", patternTransform: `rotate(${SWEEP_ANGLE_DEG})`, patternUnits: "objectBoundingBox", width: 3, x: "0", y: "0", children: _jsx(motion.rect, { animate: { x: SWEEP_END_X }, fill: `url(#${chartId}-grad)`, height: "1", initial: { x: SWEEP_START_X }, onUpdate: handleUpdate, transition: {
                        duration: durationSeconds,
                        ease: "linear",
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                    }, width: "1", y: "0" }) }), _jsx("mask", { id: `${chartId}-mask`, maskUnits: "userSpaceOnUse", children: _jsx("rect", { fill: `url(#${chartId}-pattern)`, height: height, width: width }) })] }));
}
/**
 * Renders a placeholder line/area silhouette (its own, not the chart's skeleton)
 * with the shimmer sweeping across it. The silhouette re-randomizes between
 * passes. Reads inner dimensions from chart context.
 */
export function LineLoadingSweep({ curve, withArea = false, mode = "loop", onTransitionComplete, stroke = chartCssVars.foreground, strokeOpacity = LINE_STROKE_OPACITY, strokeWidth = 2, pointCount = DEFAULT_POINT_COUNT, durationSeconds = DEFAULT_SWEEP_DURATION_S, }) {
    const { innerWidth, innerHeight } = useChartStable();
    const reduceMotion = useReducedMotion();
    const reactId = useId();
    const chartId = `line-sweep-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const isLoop = mode === "loop";
    const [tick, setTick] = useState(0);
    // Re-randomize only while looping; hold the silhouette steady through a
    // transition so it fades out (or in) as one piece.
    const onSweepComplete = useCallback(() => {
        if (isLoop) {
            setTick((prev) => prev + 1);
        }
    }, [isLoop]);
    const heights = useMemo(() => getSkeletonHeights(pointCount, tick), [pointCount, tick]);
    // With reduced motion there is no fade to await, so signal the handoff
    // immediately or the phase machine would stall mid-transition.
    useEffect(() => {
        if (reduceMotion && !isLoop) {
            onTransitionComplete?.();
        }
    }, [reduceMotion, isLoop, onTransitionComplete]);
    if (innerWidth <= 0 || innerHeight <= 0 || heights.length < 2) {
        return null;
    }
    const xScale = scaleLinear({
        domain: [0, heights.length - 1],
        range: [0, innerWidth],
    });
    const yScale = scaleLinear({ domain: [0, 100], range: [innerHeight, 0] });
    const points = heights.map((value, index) => ({ index, value }));
    const getX = (d) => xScale(d.index);
    const getY = (d) => yScale(d.value);
    const silhouette = (_jsxs(_Fragment, { children: [withArea ? (_jsx(AreaClosed, { curve: curve, data: points, fill: `url(#${chartId}-area)`, x: getX, y: getY, yScale: yScale })) : null, _jsx(LinePath, { curve: curve, data: points, fill: "none", stroke: stroke, strokeLinecap: "round", strokeOpacity: strokeOpacity, strokeWidth: strokeWidth, x: getX, y: getY })] }));
    const areaGradient = withArea ? (_jsxs("linearGradient", { id: `${chartId}-area`, x1: "0", x2: "0", y1: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: stroke, stopOpacity: AREA_FILL_TOP_OPACITY }), _jsx("stop", { offset: "100%", stopColor: stroke, stopOpacity: AREA_FILL_BOTTOM_OPACITY })] })) : null;
    if (reduceMotion) {
        return (_jsxs(_Fragment, { children: [areaGradient ? _jsx("defs", { children: areaGradient }) : null, silhouette] }));
    }
    const maskUrl = `url(#${chartId}-mask)`;
    const defs = (_jsxs("defs", { children: [areaGradient, _jsx(LoadingSweepMask, { chartId: chartId, durationSeconds: durationSeconds, height: innerHeight, onSweepComplete: onSweepComplete, width: innerWidth })] }));
    if (isLoop) {
        return (_jsxs(_Fragment, { children: [defs, _jsx("g", { mask: maskUrl, children: silhouette })] }));
    }
    // Transition: fade the swept silhouette out (exit) or in (enter), then hand
    // off to the chart so it can reveal the real series.
    return (_jsxs(_Fragment, { children: [defs, _jsx(motion.g, { animate: { opacity: mode === "exit" ? 0 : 1 }, initial: { opacity: mode === "exit" ? 1 : 0 }, mask: maskUrl, onAnimationComplete: onTransitionComplete, transition: {
                    duration: LOADING_LABEL_EXIT_S,
                    ease: [...LINE_LOADING_PULSE_EASE],
                }, children: silhouette })] }));
}
LineLoadingSweep.displayName = "LineLoadingSweep";
// ─── Bar loading skeleton (seeded bars under the sweep, inner coords) ─────────
function SkeletonBars({ heights, signs, innerWidth, innerHeight, baseline, barFraction, fill, fillOpacity, }) {
    const bandWidth = innerWidth / heights.length;
    const barW = bandWidth * barFraction;
    const xOffset = (bandWidth * (1 - barFraction)) / 2;
    const isCenter = baseline === "center";
    const baselineY = isCenter ? innerHeight / 2 : innerHeight;
    const halfBarH = isCenter ? innerHeight / 2 : innerHeight;
    return (_jsx(_Fragment, { children: heights.map((value, i) => {
            const sign = isCenter ? (signs[i] ?? 1) : 1;
            const barH = Math.max(1, halfBarH * (value / 100));
            const x = i * bandWidth + xOffset;
            const y = sign === 1 ? baselineY - barH : baselineY;
            return (_jsx("rect", { fill: fill, fillOpacity: fillOpacity, height: barH, rx: BAR_CORNER_RADIUS, width: barW, x: x, y: y }, `${x.toFixed(2)}-${value}`));
        }) }));
}
/**
 * Skeleton bars masked by the shimmer sweep, re-randomizing between passes.
 * Rendered in the chart's inner coordinate space (origin at the inner top-left),
 * so a `BarChart` drops it inside its margin-translated group.
 */
export function BarLoadingSkeleton({ innerWidth, innerHeight, barCount = DEFAULT_BAR_COUNT, fill = DEFAULT_FILL, fillOpacity = DEFAULT_BAR_FILL_OPACITY, baseline = "bottom", barFraction = DEFAULT_BAR_FRACTION, durationSeconds = DEFAULT_SWEEP_DURATION_S, }) {
    const reduceMotion = useReducedMotion();
    const reactId = useId();
    const chartId = `bar-sweep-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const [tick, setTick] = useState(0);
    const onSweepComplete = useCallback(() => setTick((prev) => prev + 1), []);
    const heights = useMemo(() => getSkeletonHeights(barCount, tick), [barCount, tick]);
    const signs = useMemo(() => getSkeletonSigns(barCount, tick), [barCount, tick]);
    if (innerWidth <= 0 || innerHeight <= 0) {
        return null;
    }
    const bars = (_jsx(SkeletonBars, { barFraction: barFraction, baseline: baseline, fill: fill, fillOpacity: fillOpacity, heights: heights, innerHeight: innerHeight, innerWidth: innerWidth, signs: signs }));
    if (reduceMotion) {
        return bars;
    }
    return (_jsxs(_Fragment, { children: [_jsx("defs", { children: _jsx(LoadingSweepMask, { chartId: chartId, durationSeconds: durationSeconds, height: innerHeight, onSweepComplete: onSweepComplete, width: innerWidth }) }), _jsx("g", { mask: `url(#${chartId}-mask)`, children: bars })] }));
}
BarLoadingSkeleton.displayName = "BarLoadingSkeleton";
