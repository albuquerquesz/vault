"use client";

import { PatternLines as VisxPatternLines } from "@visx/pattern";
import { type ComponentProps, useMemo } from "react";

type VisxPatternLinesProps = ComponentProps<typeof VisxPatternLines>;

export type PatternLinesProps = Omit<VisxPatternLinesProps, "id"> & {
	/** Pattern id for referencing in fills */
	id: string;
};

/**
 * SVG pattern definition for line fills. Renders inside <defs> via PieChart.
 */
export function PatternLines({ id, ...rest }: PatternLinesProps) {
	const patternId = useMemo(() => `pattern-${id}`, [id]);

	return <VisxPatternLines id={patternId} {...rest} />;
}

PatternLines.displayName = "PatternLines";

export default PatternLines;