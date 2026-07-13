export type { PatternLinesProps } from "@/components/charts/pattern-lines";
export { PatternLines } from "@/components/charts/pattern-lines";
export type { PieCenterProps } from "@/components/charts/pie-center";
export { PieCenter } from "@/components/charts/pie-center";
export type { PieChartProps } from "@/components/charts/pie-chart";
export {
	DEFAULT_HOVER_OFFSET,
	PieChart,
} from "@/components/charts/pie-chart";
export type { PieArcData, PieData } from "@/components/charts/pie-context";
export type {
	PieSliceHoverEffect,
	PieSliceProps,
} from "@/components/charts/pie-slice";
export { PieSlice } from "@/components/charts/pie-slice";

/** Shared chart palette for pie slices and legends */
export const slicePalette = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];
