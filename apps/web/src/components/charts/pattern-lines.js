"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { PatternLines as VisxPatternLines } from "@visx/pattern";
import { useMemo } from "react";
/**
 * SVG pattern definition for line fills. Renders inside <defs> via PieChart.
 */
export function PatternLines({ id, ...rest }) {
    const patternId = useMemo(() => `pattern-${id}`, [id]);
    return _jsx(VisxPatternLines, { id: patternId, ...rest });
}
PatternLines.displayName = "PatternLines";
export default PatternLines;
