"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { arc as arcGenerator } from "@visx/shape";
import { motion, useSpring, useTransform } from "motion/react";
import { memo, useCallback, useEffect, useMemo } from "react";
import { useEnterComplete } from "./hooks/use-enter-complete";
import { useMountProgress } from "./hooks/use-mount-progress";
import { usePieHover, usePieStable } from "./pie-context";
// Helper to generate arc path using d3 arc generator
function generateArcPath(innerRadius, outerRadius, startAngle, endAngle, cornerRadius, padAngle) {
    const generator = arcGenerator({
        innerRadius,
        outerRadius,
        cornerRadius,
        padAngle,
    });
    return generator({ startAngle, endAngle }) || "";
}
// Calculate the translation offset for a slice to "pop out" along its radial axis
function getSliceOffset(startAngle, endAngle, distance) {
    // Calculate the midpoint angle of the slice
    const midAngle = (startAngle + endAngle) / 2;
    // In d3-shape, 0 radians is at 12 o'clock, angles increase clockwise
    // So the outward direction is: x = sin(angle), y = -cos(angle)
    return {
        x: Math.sin(midAngle) * distance,
        y: -Math.cos(midAngle) * distance,
    };
}
function AnimatedSliceTranslate({ index, innerRadius, outerRadius, startAngle, endAngle, cornerRadius, padAngle, fill, color, isHovered, isFaded, animationKey, showGlow, hoverOffset, }) {
    const { enterTransition, enterStaggerScale, animationKey: pieAnimationKey, } = usePieStable();
    const animationDelay = (0.1 + index * 0.08) * enterStaggerScale;
    const mountProgress = useMountProgress(enterTransition, animationDelay, pieAnimationKey);
    const enterComplete = useEnterComplete(mountProgress);
    const animatedPath = useMemo(() => {
        const currentEndAngle = startAngle + (endAngle - startAngle) * mountProgress;
        if (currentEndAngle <= startAngle + 0.01) {
            return "";
        }
        return generateArcPath(innerRadius, outerRadius, startAngle, currentEndAngle, cornerRadius, padAngle);
    }, [
        mountProgress,
        startAngle,
        endAngle,
        innerRadius,
        outerRadius,
        cornerRadius,
        padAngle,
    ]);
    const offset = useMemo(() => getSliceOffset(startAngle, endAngle, hoverOffset), [startAngle, endAngle, hoverOffset]);
    const glowColor = color;
    const hitboxPath = useMemo(() => generateArcPath(innerRadius, outerRadius, startAngle, endAngle, cornerRadius, padAngle), [innerRadius, outerRadius, startAngle, endAngle, cornerRadius, padAngle]);
    if (enterComplete) {
        const shouldTranslate = isHovered;
        return (_jsx(motion.path, { animate: {
                opacity: isFaded ? 0.4 : 1,
                x: shouldTranslate ? offset.x : 0,
                y: shouldTranslate ? offset.y : 0,
            }, d: hitboxPath, fill: fill, pointerEvents: "none", style: {
                filter: showGlow && isHovered
                    ? `drop-shadow(0 0 12px ${glowColor})`
                    : "none",
            }, transition: {
                opacity: { duration: 0.15 },
                x: { type: "spring", stiffness: 400, damping: 25 },
                y: { type: "spring", stiffness: 400, damping: 25 },
            } }));
    }
    return (_jsx(motion.path, { animate: {
            opacity: isFaded ? 0.4 : 1,
            x: isHovered ? offset.x : 0,
            y: isHovered ? offset.y : 0,
        }, d: animatedPath, fill: fill, pointerEvents: "none", style: {
            filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${glowColor})` : "none",
        }, transition: {
            opacity: { duration: 0.15 },
            x: { type: "spring", stiffness: 400, damping: 25 },
            y: { type: "spring", stiffness: 400, damping: 25 },
        } }, `slice-${animationKey}-${index}`));
}
function AnimatedSliceGrow({ index, innerRadius, outerRadius, startAngle, endAngle, cornerRadius, padAngle, fill, color, isHovered, isFaded, animationKey, showGlow, hoverOffset, }) {
    const { enterTransition, enterStaggerScale, animationKey: pieAnimationKey, } = usePieStable();
    const animationDelay = (0.1 + index * 0.08) * enterStaggerScale;
    const mountProgress = useMountProgress(enterTransition, animationDelay, pieAnimationKey);
    const enterComplete = useEnterComplete(mountProgress);
    const growSpring = useSpring(outerRadius, {
        stiffness: 400,
        damping: 25,
    });
    useEffect(() => {
        growSpring.set(isHovered ? outerRadius + hoverOffset : outerRadius);
    }, [isHovered, hoverOffset, outerRadius, growSpring]);
    const animatedPath = useTransform(growSpring, (currentOuterRadius) => {
        const currentEndAngle = startAngle + (endAngle - startAngle) * mountProgress;
        if (currentEndAngle <= startAngle + 0.01) {
            return "";
        }
        return generateArcPath(innerRadius, currentOuterRadius, startAngle, currentEndAngle, cornerRadius, padAngle);
    });
    const glowColor = color;
    const grownOuterRadius = isHovered ? outerRadius + hoverOffset : outerRadius;
    const grownPath = useMemo(() => generateArcPath(innerRadius, grownOuterRadius, startAngle, endAngle, cornerRadius, padAngle), [
        innerRadius,
        grownOuterRadius,
        startAngle,
        endAngle,
        cornerRadius,
        padAngle,
    ]);
    if (enterComplete) {
        return (_jsx(motion.path, { animate: {
                opacity: isFaded ? 0.4 : 1,
                d: grownPath,
            }, d: grownPath, fill: fill, pointerEvents: "none", style: {
                filter: showGlow && isHovered
                    ? `drop-shadow(0 0 12px ${glowColor})`
                    : "none",
            }, transition: {
                opacity: { duration: 0.15 },
                d: { type: "spring", stiffness: 400, damping: 25 },
            } }));
    }
    return (_jsx(motion.path, { animate: {
            opacity: isFaded ? 0.4 : 1,
        }, d: animatedPath, fill: fill, pointerEvents: "none", style: {
            filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${glowColor})` : "none",
        }, transition: {
            opacity: { duration: 0.15 },
        } }, `slice-${animationKey}-${index}`));
}
export const PieSlice = memo(function PieSlice({ index, color: colorProp, fill: fillProp, animate = true, showGlow = true, hoverEffect = "translate", hoverOffset: hoverOffsetProp, }) {
    const { arcs, innerRadius, outerRadius, cornerRadius, hoverOffset: contextHoverOffset, animationKey, geometryScrubbing, scrubSlicePaths, getColor, getFill, } = usePieStable();
    const { hoveredIndex, setHoveredIndex } = usePieHover();
    // Use prop if provided, otherwise use context value
    const hoverOffset = hoverOffsetProp ?? contextHoverOffset;
    const arcData = arcs[index];
    if (!arcData) {
        return null;
    }
    const color = colorProp || getColor(index);
    const fill = fillProp || getFill(index);
    if (geometryScrubbing) {
        const scrubPath = scrubSlicePaths?.[index];
        if (!scrubPath) {
            return null;
        }
        return _jsx("path", { d: scrubPath, fill: fill, pointerEvents: "none" });
    }
    const isHovered = hoveredIndex === index;
    const isFaded = hoveredIndex !== null && hoveredIndex !== index;
    // Calculate values for non-animated/static paths
    const offset = useMemo(() => getSliceOffset(arcData.startAngle, arcData.endAngle, hoverOffset), [arcData.startAngle, arcData.endAngle, hoverOffset]);
    // Generate the static hitbox path (always uses base outer radius)
    const hitboxPath = useMemo(() => generateArcPath(innerRadius, outerRadius, arcData.startAngle, arcData.endAngle, cornerRadius, arcData.paddingAngle), [
        innerRadius,
        outerRadius,
        arcData.startAngle,
        arcData.endAngle,
        cornerRadius,
        arcData.paddingAngle,
    ]);
    // Generate the visible path for grow effect
    const grownOuterRadius = isHovered ? outerRadius + hoverOffset : outerRadius;
    const grownPath = useMemo(() => generateArcPath(innerRadius, grownOuterRadius, arcData.startAngle, arcData.endAngle, cornerRadius, arcData.paddingAngle), [
        innerRadius,
        grownOuterRadius,
        arcData.startAngle,
        arcData.endAngle,
        cornerRadius,
        arcData.paddingAngle,
    ]);
    // Render animated slice based on effect type
    const renderAnimatedSlice = () => {
        if (hoverEffect === "grow") {
            return (_jsx(AnimatedSliceGrow, { animationKey: animationKey, color: color, cornerRadius: cornerRadius, endAngle: arcData.endAngle, fill: fill, hoverOffset: hoverOffset, index: index, innerRadius: innerRadius, isFaded: isFaded, isHovered: isHovered, outerRadius: outerRadius, padAngle: arcData.paddingAngle, showGlow: showGlow, startAngle: arcData.startAngle }));
        }
        // Default: translate effect (also covers "none" with hoverOffset=0)
        return (_jsx(AnimatedSliceTranslate, { animationKey: animationKey, color: color, cornerRadius: cornerRadius, endAngle: arcData.endAngle, fill: fill, hoverOffset: hoverEffect === "none" ? 0 : hoverOffset, index: index, innerRadius: innerRadius, isFaded: isFaded, isHovered: isHovered, outerRadius: outerRadius, padAngle: arcData.paddingAngle, showGlow: showGlow, startAngle: arcData.startAngle }));
    };
    // Render static (non-animated) slice
    const renderStaticSlice = () => {
        if (hoverEffect === "grow") {
            return (_jsx(motion.path, { animate: {
                    opacity: isFaded ? 0.4 : 1,
                    d: grownPath,
                }, d: hitboxPath, fill: fill, pointerEvents: "none", style: {
                    filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
                }, transition: {
                    opacity: { duration: 0.15 },
                    d: { type: "spring", stiffness: 400, damping: 25 },
                } }));
        }
        // Default: translate effect
        const shouldTranslate = hoverEffect !== "none" && isHovered;
        const translateX = shouldTranslate ? offset.x : 0;
        const translateY = shouldTranslate ? offset.y : 0;
        return (_jsx(motion.path, { animate: {
                opacity: isFaded ? 0.4 : 1,
                x: translateX,
                y: translateY,
            }, d: hitboxPath, fill: fill, pointerEvents: "none", style: {
                filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${color})` : "none",
            }, transition: {
                opacity: { duration: 0.15 },
                x: { type: "spring", stiffness: 400, damping: 25 },
                y: { type: "spring", stiffness: 400, damping: 25 },
            } }));
    };
    const handleMouseEnter = useCallback(() => setHoveredIndex(index), [index, setHoveredIndex]);
    const handleMouseLeave = useCallback(() => setHoveredIndex(null), [setHoveredIndex]);
    return (_jsxs("g", { style: { cursor: "pointer" }, children: [_jsx("path", { d: hitboxPath, fill: "transparent", onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }), animate ? renderAnimatedSlice() : renderStaticSlice()] }));
});
PieSlice.displayName = "PieSlice";
export default PieSlice;
