"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, } from "react";
import { ChartLoadingLabel } from "../chart-loading-label";
import { DEFAULT_CHART_STATUS, resolveRestingChartPhase, } from "../chart-phase";
import { HEATMAP_DEFAULT_ENTER_DURATION_MS, HEATMAP_DEFAULT_ENTER_TRANSITION, HEATMAP_DEFAULT_LOADING_CELL_MAX_OPACITY, HEATMAP_DEFAULT_LOADING_CELL_RANDOMNESS, HEATMAP_LOADING_CHART_OPACITY, HEATMAP_LOADING_CONCEAL_MS, } from "./heatmap-animation";
import { buildHeatmapColorScaleFromStyles, buildHeatmapFillScale, resolveHeatmapLevelStyles, } from "./heatmap-colors";
import { HeatmapInteractionRoot, HeatmapProvider, useHeatmap, useHeatmapInteraction, } from "./heatmap-context";
import { HeatmapPatternDefs } from "./heatmap-pattern-defs";
import { resolveHeatmapSeparatorConfigWithData } from "./heatmap-resolve-separator";
import { filterHeatmapColumns, getHeatmapColumnXOffset, getHeatmapPlotInnerWidth, getHeatmapSeparatorCount, getHeatmapTimeExtent, rotateHeatmapColumnBins, } from "./heatmap-utils";
const DEFAULT_MARGIN = { top: 28, right: 16, bottom: 0, left: 40 };
function computeHeatmapDimensions({ width, parentHeight, margin, columnCount, rowCount, binSize, layout, separator, }) {
    const innerWidth = Math.max(width - margin.left - margin.right, 0);
    const availableHeight = Math.max(parentHeight - margin.top - margin.bottom, 0);
    const separatorCount = separator ? getHeatmapSeparatorCount(separator) : 0;
    const totalSpacing = separatorCount * (separator?.spacing ?? 0);
    let binWidth;
    let binHeight;
    if (binSize > 0) {
        binWidth = binSize;
        binHeight = binSize;
    }
    else if (layout === "fluid") {
        const cellSize = Math.max((innerWidth - totalSpacing) / columnCount, 0);
        binWidth = cellSize;
        binHeight = cellSize;
    }
    else {
        const cellSize = Math.min(Math.max((innerWidth - totalSpacing) / columnCount, 0), availableHeight / rowCount);
        binWidth = cellSize;
        binHeight = cellSize;
    }
    const plotInnerWidth = getHeatmapPlotInnerWidth(columnCount, binWidth, separator);
    const innerHeight = rowCount * binHeight;
    const height = layout === "fluid"
        ? margin.top + innerHeight + margin.bottom
        : Math.max(parentHeight, margin.top + innerHeight + margin.bottom);
    const chartWidth = binSize > 0 && layout === "fluid"
        ? margin.left + plotInnerWidth + margin.right
        : width;
    return {
        binWidth,
        binHeight,
        innerWidth: plotInnerWidth,
        innerHeight,
        height,
        width: chartWidth,
    };
}
function HeatmapChartInner({ width, height: parentHeight, data, xDomain, sizingColumnCount: sizingColumnCountProp, margin, binSize, gap, layout, colorScale, fillScale, levelStyles, chartStatus, chartPhase, isLoaded, revealEpoch, animationDuration, enterTransition, enterStaggerScale, animateCells, loadingOpacity, showLoadingCells, loadingCellMaxOpacity, loadingCellRandomness, revealMode, loadingLabel, showLoadingLabel, columnSeparators, weekStartDay, children, }) {
    const containerRef = useRef(null);
    const filteredData = useMemo(() => filterHeatmapColumns(data, xDomain), [data, xDomain]);
    const visibleData = useMemo(() => rotateHeatmapColumnBins(filteredData, weekStartDay), [filteredData, weekStartDay]);
    const visibleColumnCount = Math.max(visibleData.length, 1);
    const columnCount = xDomain && sizingColumnCountProp != null
        ? Math.max(sizingColumnCountProp, 1)
        : visibleColumnCount;
    const rowCount = Math.max(visibleData[0]?.bins.length ?? 7, 1);
    const separatorLayout = useMemo(() => resolveHeatmapSeparatorConfigWithData(children, visibleData, columnSeparators), [children, columnSeparators, visibleData]);
    const { binWidth, binHeight, innerWidth, innerHeight, height, width: chartWidth, } = useMemo(() => computeHeatmapDimensions({
        width,
        parentHeight,
        margin,
        columnCount,
        rowCount,
        binSize,
        layout,
        separator: separatorLayout,
    }), [
        binSize,
        columnCount,
        layout,
        margin,
        parentHeight,
        rowCount,
        separatorLayout,
        width,
    ]);
    const xScale = useMemo(() => (columnIndex) => columnIndex * binWidth +
        getHeatmapColumnXOffset(columnIndex, separatorLayout), [binWidth, separatorLayout]);
    const yScale = useMemo(() => (rowIndex) => rowIndex * binHeight, [binHeight]);
    const timeExtent = useMemo(() => getHeatmapTimeExtent(data), [data]);
    const timeXScale = useMemo(() => {
        const domain = timeExtent ?? [new Date(), new Date()];
        return scaleTime({
            domain,
            range: [0, innerWidth],
        });
    }, [innerWidth, timeExtent]);
    const brushYScale = useMemo(() => scaleLinear({
        domain: [0, 1],
        range: [innerHeight, 0],
    }), [innerHeight]);
    const contextValue = useMemo(() => ({
        data: visibleData,
        width: chartWidth,
        height,
        innerWidth,
        innerHeight,
        margin,
        binWidth,
        binHeight,
        gap,
        weekStartDay,
        xScale,
        yScale,
        separatorLayout,
        timeXScale,
        brushYScale,
        isReady: chartWidth >= 10 && height >= 10,
        colorScale,
        fillScale,
        levelStyles,
        containerRef,
        chartStatus,
        chartPhase,
        isLoaded,
        revealEpoch,
        animationDuration,
        enterTransition,
        enterStaggerScale,
        animateCells,
        loadingOpacity,
        showLoadingCells,
        loadingCellMaxOpacity,
        loadingCellRandomness,
        revealMode,
        loadingLabel,
        showLoadingLabel,
    }), [
        animateCells,
        animationDuration,
        binHeight,
        binWidth,
        brushYScale,
        chartPhase,
        chartStatus,
        chartWidth,
        colorScale,
        fillScale,
        enterStaggerScale,
        enterTransition,
        gap,
        height,
        innerHeight,
        innerWidth,
        isLoaded,
        loadingCellMaxOpacity,
        loadingCellRandomness,
        loadingLabel,
        levelStyles,
        loadingOpacity,
        margin,
        revealMode,
        separatorLayout,
        showLoadingCells,
        showLoadingLabel,
        revealEpoch,
        timeXScale,
        visibleData,
        weekStartDay,
        xScale,
        yScale,
    ]);
    if (chartWidth < 10 || height < 10) {
        return null;
    }
    return (_jsx(HeatmapProvider, { value: contextValue, children: _jsx(HeatmapInteractionRoot, { children: _jsx(HeatmapChartSurface, { layout: layout, children: children }) }) }));
}
function HeatmapChartSurface({ layout, children, }) {
    const { containerRef, height, width, margin, levelStyles, chartPhase, loadingOpacity, loadingLabel, showLoadingLabel, } = useHeatmap();
    const { clearInteraction } = useHeatmapInteraction();
    const reducedOpacity = chartPhase === "loading" || chartPhase === "exitingReady"
        ? loadingOpacity
        : 1;
    return (_jsxs("div", { className: cn("relative w-full", layout === "fill" && "h-full"), onPointerLeave: clearInteraction, ref: containerRef, style: { opacity: reducedOpacity }, children: [_jsxs("svg", { "aria-hidden": "true", height: height, width: width, children: [_jsx(HeatmapPatternDefs, { levelStyles: levelStyles }), _jsx("g", { transform: `translate(${margin.left},${margin.top})`, children: children })] }), showLoadingLabel && loadingLabel?.trim() ? (_jsx("div", { className: "pointer-events-none absolute", style: {
                    top: margin.top,
                    left: margin.left,
                    width: Math.max(width - margin.left - margin.right, 0),
                    height: Math.max(height - margin.top - margin.bottom, 0),
                }, children: _jsx(ChartLoadingLabel, { exiting: chartPhase !== "loading", text: loadingLabel }) })) : null] }));
}
function useHeatmapChartLifecycle({ chartStatus, animationDuration, revealSignature = "", animate, }) {
    const reducedMotion = useReducedMotion();
    const [chartPhase, setChartPhase] = useState(() => resolveRestingChartPhase(chartStatus));
    const [isLoaded, setIsLoaded] = useState(() => chartStatus === "ready" && (!animate || animationDuration <= 0));
    const [revealEpoch, setRevealEpoch] = useState(0);
    const [revealMode, setRevealMode] = useState(null);
    const prevStatusRef = useRef(chartStatus);
    const phaseRef = useRef(chartPhase);
    phaseRef.current = chartPhase;
    const animateCells = animate && !reducedMotion;
    const animateEnter = animateCells && animationDuration > 0;
    const finishReveal = useCallback(() => {
        setIsLoaded(true);
        setChartPhase("ready");
        setRevealMode(null);
    }, []);
    const beginReveal = useCallback(() => {
        setRevealMode("enter");
        setRevealEpoch((epoch) => epoch + 1);
        setIsLoaded(false);
        setChartPhase("revealing");
        if (!animateEnter) {
            finishReveal();
        }
    }, [animateEnter, finishReveal]);
    useLayoutEffect(() => {
        const prevStatus = prevStatusRef.current;
        if (prevStatus === chartStatus) {
            return;
        }
        prevStatusRef.current = chartStatus;
        if (chartStatus === "ready" && prevStatus === "loading") {
            setRevealMode("fromLoading");
            setIsLoaded(false);
            setChartPhase("revealing");
            return;
        }
        if (chartStatus === "loading" && prevStatus === "ready") {
            setRevealMode(null);
            setIsLoaded(false);
            setChartPhase("exitingReady");
        }
    }, [chartStatus]);
    useEffect(() => {
        if (chartPhase !== "exitingReady") {
            return;
        }
        const timer = window.setTimeout(() => {
            setChartPhase("loading");
        }, HEATMAP_LOADING_CONCEAL_MS);
        return () => window.clearTimeout(timer);
    }, [chartPhase]);
    // biome-ignore lint/correctness/useExhaustiveDependencies: revealSignature replays enter
    useEffect(() => {
        if (!animateEnter) {
            setIsLoaded(true);
            setChartPhase(resolveRestingChartPhase(chartStatus));
            return;
        }
        if (chartStatus !== "ready") {
            return;
        }
        if (phaseRef.current !== "ready") {
            return;
        }
        beginReveal();
    }, [
        animateEnter,
        animationDuration,
        beginReveal,
        chartStatus,
        revealSignature,
    ]);
    // biome-ignore lint/correctness/useExhaustiveDependencies: revealEpoch replays finish timer
    useEffect(() => {
        if (!animateEnter || chartPhase !== "revealing") {
            return;
        }
        const finishTimer = window.setTimeout(finishReveal, animationDuration);
        return () => window.clearTimeout(finishTimer);
    }, [animateEnter, animationDuration, chartPhase, finishReveal, revealEpoch]);
    return {
        chartPhase,
        isLoaded,
        revealEpoch,
        revealMode,
        animateCells,
    };
}
export function HeatmapChart({ data, xDomain, sizingColumnCount, layout = "fluid", margin: marginProp, binSize = 0, gap = 2, colorScale: colorScaleProp, levelColors, levelStyles: levelStylesProp, aspectRatio, className = "", status = DEFAULT_CHART_STATUS, loadingLabel, animationDuration = HEATMAP_DEFAULT_ENTER_DURATION_MS, enterTransition = HEATMAP_DEFAULT_ENTER_TRANSITION, revealSignature = "", enterStaggerScale = 1, animate = true, loadingOpacity = HEATMAP_LOADING_CHART_OPACITY, showLoadingCells = true, loadingCellMaxOpacity = HEATMAP_DEFAULT_LOADING_CELL_MAX_OPACITY, loadingCellRandomness = HEATMAP_DEFAULT_LOADING_CELL_RANDOMNESS, columnSeparators, weekStartDay = 0, children, }) {
    const margin = { ...DEFAULT_MARGIN, ...marginProp };
    const levelStyles = useMemo(() => resolveHeatmapLevelStyles(levelColors, levelStylesProp), [levelColors, levelStylesProp]);
    const colorScale = useMemo(() => colorScaleProp ?? buildHeatmapColorScaleFromStyles(levelStyles), [colorScaleProp, levelStyles]);
    const fillScale = useMemo(() => buildHeatmapFillScale(levelStyles), [levelStyles]);
    const { chartPhase, isLoaded, revealEpoch, revealMode, animateCells } = useHeatmapChartLifecycle({
        chartStatus: status,
        animationDuration,
        revealSignature,
        animate,
    });
    const showLoadingLabel = Boolean(loadingLabel?.trim() &&
        status === "loading" &&
        (chartPhase === "loading" || chartPhase === "exitingReady"));
    return (_jsx("div", { className: cn("relative w-full", layout === "fill" && "h-full min-h-0", className), style: aspectRatio ? { aspectRatio } : undefined, children: _jsx(ParentSize, { children: ({ width, height: parentHeight }) => (_jsx(HeatmapChartInner, { animateCells: animateCells, animationDuration: animationDuration, binSize: binSize, chartPhase: chartPhase, chartStatus: status, colorScale: colorScale, columnSeparators: columnSeparators, data: data, enterStaggerScale: enterStaggerScale, enterTransition: enterTransition, fillScale: fillScale, gap: gap, height: parentHeight, isLoaded: isLoaded, layout: layout, levelStyles: levelStyles, loadingCellMaxOpacity: loadingCellMaxOpacity, loadingCellRandomness: loadingCellRandomness, loadingLabel: loadingLabel, loadingOpacity: loadingOpacity, margin: margin, revealEpoch: revealEpoch, revealMode: revealMode, showLoadingCells: showLoadingCells, showLoadingLabel: showLoadingLabel, sizingColumnCount: sizingColumnCount, weekStartDay: weekStartDay, width: width, xDomain: xDomain, children: children })) }) }));
}
HeatmapChart.displayName = "HeatmapChart";
export default HeatmapChart;
