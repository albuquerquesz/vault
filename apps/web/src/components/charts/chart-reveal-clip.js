"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from "motion/react";
import { clipRevealTransition } from "./animation";
/**
 * Left-to-right clip reveal for cartesian series.
 * Grows clip rect width from 0 → full (true LTR; scaleX is avoided — it reveals from center).
 */
export function ChartRevealClip({ clipPathId, height, targetWidth, enterTransition, revealEpoch, padding = 0, animating = true, mode = "reveal", onComplete, }) {
    const transition = clipRevealTransition(enterTransition);
    const paddedWidth = Math.max(0, targetWidth + padding * 2);
    const paddedHeight = height + padding * 2;
    if (!animating) {
        return (_jsx("clipPath", { id: clipPathId, children: _jsx("rect", { height: paddedHeight, width: paddedWidth, x: -padding, y: -padding }) }));
    }
    if (mode === "conceal") {
        // Mirror the LTR reveal: advance the clip's left edge rightward while width
        // shrinks (same geometry as `LineLoadingPulseStroke` exit half-cycle).
        const rightEdge = -padding + paddedWidth;
        return (_jsx("clipPath", { id: clipPathId, children: _jsx(motion.rect, { animate: { width: 0, x: rightEdge }, height: paddedHeight, initial: { width: paddedWidth, x: -padding }, onAnimationComplete: () => onComplete?.(), transition: transition, y: -padding }, `conceal-${revealEpoch}`) }));
    }
    return (_jsx("clipPath", { id: clipPathId, children: _jsx(motion.rect, { animate: { width: paddedWidth }, height: paddedHeight, initial: { width: 0 }, transition: transition, width: paddedWidth, x: -padding, y: -padding }, `reveal-${revealEpoch}`) }));
}
