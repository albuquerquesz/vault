"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
import { createContext, useCallback, useContext, useMemo, useState, } from "react";
import { HEATMAP_DEFAULT_LEVEL_COLORS, } from "./heatmap-colors";
const HeatmapContext = createContext(null);
const HeatmapInteractionContext = createContext(null);
export function HeatmapInteractionProvider({ children, }) {
    const [hoveredCell, setHoveredCell] = useState(null);
    const [hoveredLegendLevel, setHoveredLegendLevel] = useState(null);
    const [tooltipData, setTooltipData] = useState(null);
    const clearInteraction = useCallback(() => {
        setHoveredCell(null);
        setHoveredLegendLevel(null);
        setTooltipData(null);
    }, []);
    const value = useMemo(() => ({
        hoveredCell,
        hoveredLegendLevel,
        tooltipData,
        setHoveredCell,
        setHoveredLegendLevel,
        setTooltipData,
        clearInteraction,
    }), [clearInteraction, hoveredCell, hoveredLegendLevel, tooltipData]);
    return (_jsx(HeatmapInteractionContext.Provider, { value: value, children: children }));
}
export function HeatmapProvider({ children, value, }) {
    return (_jsx(HeatmapContext.Provider, { value: value, children: children }));
}
export function useHeatmap() {
    const context = useContext(HeatmapContext);
    if (!context) {
        throw new Error("useHeatmap must be used within a HeatmapProvider");
    }
    return context;
}
export function useHeatmapInteraction() {
    const context = useContext(HeatmapInteractionContext);
    if (!context) {
        throw new Error("useHeatmapInteraction must be used within a HeatmapInteractionProvider");
    }
    return context;
}
export function useHeatmapInteractionOptional() {
    return useContext(HeatmapInteractionContext);
}
/** Clears hover state when the pointer leaves chart + legend. */
export function HeatmapInteractionBoundary({ children, className, }) {
    const { clearInteraction } = useHeatmapInteraction();
    return (_jsx("div", { className: cn("size-full min-h-0 min-w-0", className), onPointerLeave: clearInteraction, children: children }));
}
/** Nests a provider only when one is not already present upstream. */
export function HeatmapInteractionRoot({ children }) {
    const existing = useContext(HeatmapInteractionContext);
    if (existing) {
        return children;
    }
    return _jsx(HeatmapInteractionProvider, { children: children });
}
/** @deprecated Use {@link HEATMAP_DEFAULT_LEVEL_COLORS} */
export const heatmapCssVars = {
    empty: HEATMAP_DEFAULT_LEVEL_COLORS[0],
    level1: HEATMAP_DEFAULT_LEVEL_COLORS[1],
    level2: HEATMAP_DEFAULT_LEVEL_COLORS[2],
    level3: HEATMAP_DEFAULT_LEVEL_COLORS[3],
    level4: HEATMAP_DEFAULT_LEVEL_COLORS[4],
};
