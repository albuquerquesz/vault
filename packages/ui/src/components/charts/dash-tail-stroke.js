"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
export function DashTailStroke({ pathD, pathLength, dashStartLength, dashStartX, innerWidth, innerHeight, stroke, strokeWidth, dashArray, }) {
    const clipPathId = useId().replace(/:/g, "");
    if (!pathD || pathLength <= 0 || dashStartLength >= pathLength) {
        return null;
    }
    const pad = strokeWidth * 2;
    const tailWidth = Math.max(0, innerWidth - dashStartX + pad);
    return (_jsxs(_Fragment, { children: [_jsx("defs", { children: _jsx("clipPath", { id: clipPathId, children: _jsx("rect", { height: innerHeight + pad, width: tailWidth, x: dashStartX - strokeWidth, y: -strokeWidth }) }) }), _jsx("path", { d: pathD, fill: "none", stroke: stroke, strokeDasharray: `${dashStartLength} ${Math.max(1, pathLength - dashStartLength)}`, strokeLinecap: "round", strokeWidth: strokeWidth }), _jsx("path", { clipPath: `url(#${clipPathId})`, d: pathD, fill: "none", stroke: stroke, strokeDasharray: dashArray, strokeLinecap: "round", strokeWidth: strokeWidth })] }));
}
