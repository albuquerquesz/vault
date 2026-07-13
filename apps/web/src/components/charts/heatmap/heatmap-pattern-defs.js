"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Fragment, memo } from "react";
import { renderPatternPreset } from "../pattern-preset";
import { heatmapLevelPatternId, heatmapLevelPatternRenderOptions, isHeatmapLevelPattern, } from "./heatmap-colors";
export const HeatmapPatternDefs = memo(function HeatmapPatternDefs({ levelStyles, }) {
    const nodes = levelStyles.flatMap((style, level) => {
        if (!isHeatmapLevelPattern(style)) {
            return [];
        }
        const id = heatmapLevelPatternId(level);
        const pattern = style.pattern;
        if (!pattern) {
            return [];
        }
        const node = renderPatternPreset(pattern, id, heatmapLevelPatternRenderOptions(style));
        return node ? [_jsx(Fragment, { children: node }, id)] : [];
    });
    if (nodes.length === 0) {
        return null;
    }
    return _jsx("defs", { children: nodes });
});
HeatmapPatternDefs.displayName = "HeatmapPatternDefs";
