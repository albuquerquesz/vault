"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from "motion/react";
import { useId } from "react";
export function HighlightSegment({ pathRef, visible, stroke, strokeWidth, height, x, width, }) {
    const clipId = useId();
    if (!(visible && pathRef.current)) {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("defs", { children: _jsx("clipPath", { id: clipId, children: _jsx(motion.rect, { height: height, width: width, x: x, y: 0 }) }) }), _jsx(motion.path, { animate: { opacity: 1 }, clipPath: `url(#${clipId})`, d: pathRef.current.getAttribute("d") || "", exit: { opacity: 0 }, fill: "none", initial: { opacity: 0 }, stroke: stroke, strokeLinecap: "round", strokeWidth: strokeWidth, transition: { duration: 0.4, ease: "easeInOut" } })] }));
}
HighlightSegment.displayName = "HighlightSegment";
export default HighlightSegment;
