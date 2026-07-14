"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from "react";
const ChartLegendHoverContext = createContext(null);
export function ChartLegendHoverProvider({ hoveredIndex, onHoverChange, children, }) {
    const value = useMemo(() => ({ hoveredIndex, setHoveredIndex: onHoverChange }), [hoveredIndex, onHoverChange]);
    return (_jsx(ChartLegendHoverContext.Provider, { value: value, children: children }));
}
export function useChartLegendHover() {
    const context = useContext(ChartLegendHoverContext);
    return (context ?? {
        hoveredIndex: null,
        setHoveredIndex: () => {
            /* noop outside ChartLegendHoverProvider */
        },
    });
}
