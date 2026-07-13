export {
	PieChart,
	DEFAULT_HOVER_OFFSET,
} from "@/components/charts/pie-chart";
export type { PieChartProps } from "@/components/charts/pie-chart";
export { PieSlice } from "@/components/charts/pie-slice";
export type { PieSliceProps, PieSliceHoverEffect } from "@/components/charts/pie-slice";
export { PieCenter } from "@/components/charts/pie-center";
export type { PieCenterProps } from "@/components/charts/pie-center";
export { PatternLines } from "@/components/charts/pattern-lines";
export type { PatternLinesProps } from "@/components/charts/pattern-lines";
export type { PieData, PieArcData } from "@/components/charts/pie-context";

/** Shared chart palette for pie slices and legends */
export const slicePalette = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];