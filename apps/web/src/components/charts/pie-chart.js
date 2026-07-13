"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { arc as arcGenerator } from "@visx/shape";
import { pie as d3Pie } from "d3-shape";
import { Children, isValidElement, memo, useCallback, useEffect, useMemo, useRef, useState, } from "react";
import { cn } from "@/lib/utils";
import { defaultPieColors, PieProvider, } from "./pie-context";
/** Default hover offset in pixels */
export const DEFAULT_HOVER_OFFSET = 10;
function generatePieArcPath(innerRadius, outerRadius, startAngle, endAngle, cornerRadius, padAngle) {
    const generator = arcGenerator({
        innerRadius,
        outerRadius,
        cornerRadius,
        padAngle,
    });
    return generator({ startAngle, endAngle }) || "";
}
// Helper to check if a child is a PieCenter component
function isPieCenter(child) {
    return (isValidElement(child) &&
        typeof child.type === "function" &&
        (child.type.displayName === "PieCenter" ||
            child.type.name === "PieCenter"));
}
function isPieSlice(child) {
    return (isValidElement(child) &&
        typeof child.type === "function" &&
        (child.type.displayName === "PieSlice" ||
            child.type.name === "PieSlice"));
}
// Helper to check if a component is a gradient or pattern definition
function isDefsComponent(child) {
    const displayName = child.type?.displayName ||
        child.type?.name ||
        "";
    return (displayName.includes("Gradient") ||
        displayName.includes("Pattern") ||
        displayName === "LinearGradient" ||
        displayName === "RadialGradient");
}
function PieChartInner(props) {
    const size = Math.min(props.width, props.height);
    if (size < 10) {
        return null;
    }
    return _jsx(PieChartCore, { ...props });
}
const PieChartCore = memo(function PieChartCore({ width, height, data, innerRadius: innerRadiusProp, paddingAngle, cornerRadius, startAngle, endAngle, hoverOffset, children, containerRef, hoveredIndexProp, onHoverChange, enterTransition, enterStaggerScale, geometryScrubbing, }) {
    const [internalHoveredIndex, setInternalHoveredIndex] = useState(null);
    const [animationKey] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    // Use controlled or uncontrolled hover state
    const isControlled = hoveredIndexProp !== undefined;
    const hoveredIndex = isControlled ? hoveredIndexProp : internalHoveredIndex;
    const setHoveredIndex = useCallback((index) => {
        if (isControlled) {
            onHoverChange?.(index);
        }
        else {
            setInternalHoveredIndex(index);
        }
    }, [isControlled, onHoverChange]);
    // Use the smaller dimension to ensure the chart fits
    const size = Math.min(width, height);
    const center = size / 2;
    // Calculate radii with padding based on hover offset to prevent clipping
    const padding = hoverOffset;
    const outerRadius = center - padding;
    const innerRadius = innerRadiusProp;
    // Calculate total value
    const totalValue = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
    // Get color for a slice index
    const getColor = useCallback((index) => {
        const item = data[index];
        if (item?.color) {
            return item.color;
        }
        return defaultPieColors[index % defaultPieColors.length];
    }, [data]);
    // Get fill for a slice index (supports patterns/gradients)
    const getFill = useCallback((index) => {
        const item = data[index];
        // Check for explicit fill (pattern/gradient URL)
        if (item?.fill) {
            return item.fill;
        }
        // Fall back to color
        return getColor(index);
    }, [data, getColor]);
    // Compute arcs using d3-shape pie
    const arcs = useMemo(() => {
        const pieGenerator = d3Pie()
            .value((d) => d.value)
            .startAngle(startAngle)
            .endAngle(endAngle)
            .padAngle(paddingAngle)
            .sort(null); // Maintain data order
        const computed = pieGenerator(data);
        return computed.map((arc, index) => ({
            data: arc.data,
            index,
            startAngle: arc.startAngle,
            endAngle: arc.endAngle,
            paddingAngle: arc.padAngle,
            value: arc.value,
        }));
    }, [data, startAngle, endAngle, paddingAngle]);
    const scrubSlicePaths = useMemo(() => {
        if (!geometryScrubbing) {
            return null;
        }
        return arcs.map((arc) => generatePieArcPath(innerRadius, outerRadius, arc.startAngle, arc.endAngle, cornerRadius, arc.paddingAngle));
    }, [geometryScrubbing, arcs, innerRadius, outerRadius, cornerRadius]);
    const effectiveIsLoaded = geometryScrubbing || isLoaded;
    // biome-ignore lint/correctness/useExhaustiveDependencies: enterTransition
    useEffect(() => {
        if (geometryScrubbing) {
            return;
        }
        setIsLoaded(false);
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100);
        return () => clearTimeout(timer);
    }, [enterTransition, enterStaggerScale, geometryScrubbing]);
    // Separate children into categories
    const { svgChildren, centerChildren, defsChildren } = useMemo(() => {
        const svgNodes = [];
        const centerNodes = [];
        const defsNodes = [];
        Children.forEach(children, (child) => {
            if (!isValidElement(child)) {
                svgNodes.push(child);
                return;
            }
            if (isPieCenter(child)) {
                centerNodes.push(child);
            }
            else if (isDefsComponent(child)) {
                defsNodes.push(child);
            }
            else if (geometryScrubbing && isPieSlice(child)) {
                return;
            }
            else {
                svgNodes.push(child);
            }
        });
        return {
            svgChildren: svgNodes,
            centerChildren: centerNodes,
            defsChildren: defsNodes,
        };
    }, [children, geometryScrubbing]);
    const scrubSliceFills = useMemo(() => {
        if (!(geometryScrubbing && scrubSlicePaths)) {
            return null;
        }
        return scrubSlicePaths.map((_d, index) => getFill(index));
    }, [geometryScrubbing, scrubSlicePaths, getFill]);
    const contextValue = useMemo(() => ({
        data,
        arcs,
        size,
        center,
        outerRadius,
        innerRadius,
        paddingAngle,
        cornerRadius,
        hoverOffset,
        hoveredIndex,
        setHoveredIndex,
        animationKey,
        isLoaded: effectiveIsLoaded,
        enterTransition,
        enterStaggerScale,
        containerRef,
        totalValue,
        getColor,
        getFill,
        geometryScrubbing,
        scrubSlicePaths,
    }), [
        data,
        arcs,
        size,
        center,
        outerRadius,
        innerRadius,
        paddingAngle,
        cornerRadius,
        hoverOffset,
        hoveredIndex,
        setHoveredIndex,
        animationKey,
        effectiveIsLoaded,
        enterTransition,
        enterStaggerScale,
        containerRef,
        totalValue,
        getColor,
        getFill,
        geometryScrubbing,
        scrubSlicePaths,
    ]);
    // Use CSS Grid stacking to layer SVG and HTML content
    // This avoids Safari's foreignObject rendering bugs
    return (_jsx(PieProvider, { value: contextValue, children: _jsxs("div", { className: "grid", style: {
                gridTemplateColumns: "1fr",
                gridTemplateRows: "1fr",
                width: size,
                height: size,
            }, children: [_jsxs("svg", { "aria-hidden": "true", height: size, style: { gridArea: "1 / 1", contain: "layout style paint" }, width: size, children: [defsChildren.length > 0 && _jsx("defs", { children: defsChildren }), _jsxs(Group, { left: center, top: center, children: [scrubSlicePaths && scrubSliceFills
                                    ? scrubSlicePaths.map((d, index) => d ? (_jsx("path", { d: d, fill: scrubSliceFills?.[index], pointerEvents: "none" }, data[index]?.label ?? index)) : null)
                                    : null, svgChildren] })] }), centerChildren.length > 0 && (_jsx("div", { className: "pointer-events-none flex items-center justify-center", style: { gridArea: "1 / 1" }, children: centerChildren }))] }) }));
}, pieChartCorePropsEqual);
function pieChartCorePropsEqual(prev, next) {
    return (prev.width === next.width &&
        prev.height === next.height &&
        prev.data === next.data &&
        prev.innerRadius === next.innerRadius &&
        prev.paddingAngle === next.paddingAngle &&
        prev.cornerRadius === next.cornerRadius &&
        prev.startAngle === next.startAngle &&
        prev.endAngle === next.endAngle &&
        prev.hoverOffset === next.hoverOffset &&
        prev.hoveredIndexProp === next.hoveredIndexProp &&
        prev.onHoverChange === next.onHoverChange &&
        prev.enterTransition === next.enterTransition &&
        prev.enterStaggerScale === next.enterStaggerScale &&
        prev.geometryScrubbing === next.geometryScrubbing &&
        prev.children === next.children);
}
export function PieChart({ data, size: fixedSize, innerRadius = 0, paddingAngle = 0, cornerRadius = 0, startAngle = -Math.PI / 2, endAngle = (3 * Math.PI) / 2, className = "", hoveredIndex, onHoverChange, hoverOffset = DEFAULT_HOVER_OFFSET, enterTransition, enterStaggerScale = 1, geometryScrubbing = false, children, }) {
    const containerRef = useRef(null);
    // If fixed size is provided, use it directly
    if (fixedSize) {
        return (_jsx("div", { className: cn("relative flex items-center justify-center", className), ref: containerRef, style: { width: fixedSize, height: fixedSize }, children: _jsx(PieChartInner, { containerRef: containerRef, cornerRadius: cornerRadius, data: data, endAngle: endAngle, enterStaggerScale: enterStaggerScale, enterTransition: enterTransition, geometryScrubbing: geometryScrubbing, height: fixedSize, hoveredIndexProp: hoveredIndex, hoverOffset: hoverOffset, innerRadius: innerRadius, onHoverChange: onHoverChange, paddingAngle: paddingAngle, startAngle: startAngle, width: fixedSize, children: children }) }));
    }
    // Otherwise use ParentSize for responsive sizing
    return (_jsx("div", { className: cn("relative aspect-square w-full", className), ref: containerRef, children: _jsx(ParentSize, { debounceTime: 10, children: ({ width, height }) => (_jsx(PieChartInner, { containerRef: containerRef, cornerRadius: cornerRadius, data: data, endAngle: endAngle, enterStaggerScale: enterStaggerScale, enterTransition: enterTransition, geometryScrubbing: geometryScrubbing, height: height, hoveredIndexProp: hoveredIndex, hoverOffset: hoverOffset, innerRadius: innerRadius, onHoverChange: onHoverChange, paddingAngle: paddingAngle, startAngle: startAngle, width: width, children: children })) }) }));
}
PieChart.displayName = "PieChart";
export default PieChart;
