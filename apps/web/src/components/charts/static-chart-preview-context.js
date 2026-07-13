"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
const StaticChartPreviewContext = createContext(false);
/** Disables cartesian reveal clip-path for static docs previews. */
export function StaticChartPreviewProvider({ children, }) {
    return (_jsx(StaticChartPreviewContext.Provider, { value: true, children: children }));
}
export function useStaticChartPreview() {
    return useContext(StaticChartPreviewContext);
}
