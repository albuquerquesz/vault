import { Children, isValidElement, type ReactNode } from "react";

const CHART_DEFS_COMPONENTS = new Set([
	"Defs",
	"PatternLines",
	"PatternCircles",
	"PatternDots",
]);

export function isChartDefsComponent(type: string): boolean {
	return CHART_DEFS_COMPONENTS.has(type);
}

export function partitionChartDefNodes(children: ReactNode): {
	defsChildren: ReactNode;
	otherChildren: ReactNode;
} {
	const defsChildren: ReactNode[] = [];
	const otherChildren: ReactNode[] = [];

	Children.forEach(children, (child) => {
		if (
			isValidElement(child) &&
			typeof child.type === "object" &&
			"displayName" in child.type &&
			isChartDefsComponent((child.type as any).displayName)
		) {
			defsChildren.push(child);
		} else {
			otherChildren.push(child);
		}
	});

	return {
		defsChildren: defsChildren.length === 1 ? defsChildren[0] : defsChildren,
		otherChildren: otherChildren.length === 1 ? otherChildren[0] : otherChildren,
	};
}

export function collectChartDefsChildren(children: ReactNode): ReactNode[] {
	const defs: ReactNode[] = [];

	Children.forEach(children, (child) => {
		if (
			isValidElement(child) &&
			typeof child.type === "object" &&
			"displayName" in child.type &&
			isChartDefsComponent((child.type as any).displayName)
		) {
			defs.push(child);
		}
	});

	return defs;
}