import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { fadeGradientStops, resolveFadeSides, viewportFadeGradientAttrs, } from "./fade-edges";
export function AreaGradientDefs({ gradientId, strokeGradientId, edgeMaskId, edgeGradientId, fill, fillOpacity, gradientToOpacity, gradientSpan = 1, resolvedStroke, isPatternFill, fadeEdges, innerWidth, innerHeight, }) {
    const sides = resolveFadeSides(fadeEdges);
    // Stroke gradient mirrors the area's edge fade so the line doesn't pop in
    // past the faded fill. Skip emitting it when neither edge fades — the line
    // can then paint a solid stroke instead of an unnecessary url(#...) ref.
    const strokeStops = sides.any ? fadeGradientStops(sides) : null;
    const showEdgeMask = sides.any && !isPatternFill;
    const edgeStops = showEdgeMask ? fadeGradientStops(sides) : null;
    const span = Math.min(1, Math.max(0.01, gradientSpan));
    const midOffset = `${span * 100}%`;
    return (_jsxs("defs", { children: [isPatternFill ? null : (_jsxs("linearGradient", { id: gradientId, x1: "0%", x2: "0%", y1: "0%", y2: "100%", children: [_jsx("stop", { offset: "0%", style: { stopColor: fill, stopOpacity: fillOpacity } }), _jsx("stop", { offset: midOffset, style: { stopColor: fill, stopOpacity: gradientToOpacity } }), span < 1 ? (_jsx("stop", { offset: "100%", style: { stopColor: fill, stopOpacity: gradientToOpacity } })) : null] })), strokeStops ? (_jsx("linearGradient", { id: strokeGradientId, ...viewportFadeGradientAttrs(innerWidth), children: strokeStops.map((stop) => (_jsx("stop", { offset: stop.offset, style: { stopColor: resolvedStroke, stopOpacity: stop.opacity } }, stop.offset))) })) : null, edgeStops ? (_jsxs(_Fragment, { children: [_jsx("linearGradient", { id: edgeGradientId, ...viewportFadeGradientAttrs(innerWidth), children: edgeStops.map((stop) => (_jsx("stop", { offset: stop.offset, style: { stopColor: "white", stopOpacity: stop.opacity } }, stop.offset))) }), _jsx("mask", { id: edgeMaskId, children: _jsx("rect", { fill: `url(#${edgeGradientId})`, height: innerHeight, width: innerWidth, x: "0", y: "0" }) })] })) : null] }));
}
