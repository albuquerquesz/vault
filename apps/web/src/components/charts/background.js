"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from "motion/react";
import { useId, useMemo } from "react";
import { useChartStable } from "./chart-context";
import { renderPatternPreset, } from "./pattern-preset";
const BACKGROUND_ENTER_FADE_MS = 420;
function clampFadeLength(length) {
    return Math.min(45, Math.max(0, length));
}
function fadeMaskStops(lengthPercent) {
    const edge = clampFadeLength(lengthPercent);
    return [
        { offset: "0%", opacity: 0 },
        { offset: `${edge}%`, opacity: 1 },
        { offset: `${100 - edge}%`, opacity: 1 },
        { offset: "100%", opacity: 0 },
    ];
}
/** Plot-area pattern fill for charts without a grid. Renders behind series layers. */
export function Background({ pattern = "diagonal", color = "var(--chart-grid)", scale = 1, strokeWidth, radius, complement, fill, dotFill, tileBackground, showFill = true, opacity = 1, fadeHorizontal = true, fadeVertical = true, fadeHorizontalLength = 10, fadeVerticalLength = 10, }) {
    const { innerWidth, innerHeight, isLoaded, enterTransition } = useChartStable();
    const uniqueId = useId();
    const patternId = `chart-background-${uniqueId.replace(/:/g, "")}`;
    const hStops = useMemo(() => fadeMaskStops(fadeHorizontalLength), [fadeHorizontalLength]);
    const vStops = useMemo(() => fadeMaskStops(fadeVerticalLength), [fadeVerticalLength]);
    if (pattern === "none" || !showFill || innerWidth <= 0 || innerHeight <= 0) {
        return null;
    }
    const patternNode = renderPatternPreset(pattern, patternId, {
        color,
        scale,
        strokeWidth,
        radius,
        complement,
        fill,
        dotFill,
        tileBackground,
    });
    if (!patternNode) {
        return null;
    }
    const fadeMask = fadeHorizontal || fadeVertical;
    const hMaskId = `chart-background-fade-h-${uniqueId.replace(/:/g, "")}`;
    const hGradientId = `${hMaskId}-gradient`;
    const vMaskId = `chart-background-fade-v-${uniqueId.replace(/:/g, "")}`;
    const vGradientId = `${vMaskId}-gradient`;
    const combinedMaskId = `chart-background-fade-${uniqueId.replace(/:/g, "")}`;
    let maskRef;
    if (fadeHorizontal && fadeVertical) {
        maskRef = `url(#${combinedMaskId})`;
    }
    else if (fadeHorizontal) {
        maskRef = `url(#${hMaskId})`;
    }
    else if (fadeVertical) {
        maskRef = `url(#${vMaskId})`;
    }
    const targetOpacity = opacity;
    const revealOpacity = isLoaded ? targetOpacity : 0;
    const enterFade = enterTransition && typeof enterTransition === "object"
        ? enterTransition
        : { duration: BACKGROUND_ENTER_FADE_MS / 1000, ease: "easeOut" };
    return (_jsxs("g", { "aria-hidden": "true", className: "chart-background", children: [fadeMask ? (_jsxs("defs", { children: [fadeHorizontal ? (_jsxs(_Fragment, { children: [_jsx("linearGradient", { id: hGradientId, x1: "0%", x2: "100%", y1: "0%", y2: "0%", children: hStops.map((stop) => (_jsx("stop", { offset: stop.offset, style: { stopColor: "white", stopOpacity: stop.opacity } }, stop.offset))) }), _jsx("mask", { id: hMaskId, children: _jsx("rect", { fill: `url(#${hGradientId})`, height: innerHeight, width: innerWidth, x: 0, y: 0 }) })] })) : null, fadeVertical ? (_jsxs(_Fragment, { children: [_jsx("linearGradient", { id: vGradientId, x1: "0%", x2: "0%", y1: "0%", y2: "100%", children: vStops.map((stop) => (_jsx("stop", { offset: stop.offset, style: { stopColor: "white", stopOpacity: stop.opacity } }, stop.offset))) }), _jsx("mask", { id: vMaskId, children: _jsx("rect", { fill: `url(#${vGradientId})`, height: innerHeight, width: innerWidth, x: 0, y: 0 }) })] })) : null, fadeHorizontal && fadeVertical ? (_jsx("mask", { id: combinedMaskId, children: _jsx("g", { mask: `url(#${hMaskId})`, children: _jsx("rect", { fill: `url(#${vGradientId})`, height: innerHeight, width: innerWidth, x: 0, y: 0 }) }) })) : null] })) : null, _jsx("defs", { children: patternNode }), _jsx(motion.rect, { animate: { opacity: revealOpacity }, fill: `url(#${patternId})`, height: innerHeight, initial: { opacity: 0 }, mask: maskRef, transition: isLoaded ? enterFade : { duration: 0 }, width: innerWidth, x: 0, y: 0 })] }));
}
Background.displayName = "Background";
export default Background;
