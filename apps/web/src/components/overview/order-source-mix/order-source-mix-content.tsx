"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import {
	PatternLines,
	PieCenter,
	PieChart,
	PieSlice,
	slicePalette,
	type PieData,
} from "@/components/pie-chart";
import type { OrderSourceDatum } from "./hooks/use-order-source-mix";

const PATTERN_PRESETS = [
	{ height: 6, width: 6, orientation: ["diagonal"] as const },
	{ height: 6, width: 6, orientation: ["horizontal"] as const },
	{ height: 6, width: 6, orientation: ["vertical"] as const },
	{ height: 8, width: 8, orientation: ["diagonalRightToLeft"] as const },
] as const;

function patternIdForIndex(index: number) {
	return `dp-${index + 1}`;
}

function patternFillForIndex(index: number) {
	// PatternLines registers SVG ids as `pattern-${id}`
	return `url(#pattern-${patternIdForIndex(index)})`;
}

function patternPresetForIndex(index: number) {
	return PATTERN_PRESETS[index % PATTERN_PRESETS.length]!;
}

function formatMonthLabel(month: string) {
	const [year, monthNumber] = month.split("-").map(Number);
	if (!year || !monthNumber) {
		return month;
	}

	const label = new Date(year, monthNumber - 1, 1).toLocaleDateString("pt-BR", {
		month: "long",
	});

	return label.charAt(0).toUpperCase() + label.slice(1);
}

function TrendIcon({
	trend,
}: {
	trend: OrderSourceDatum["monthOverMonthTrend"];
}) {
	if (trend === "up") {
		return (
			<ArrowUpRight
				className="h-4.5 w-4.5 text-emerald-500"
				aria-label="Melhor que mês passado"
			/>
		);
	}

	if (trend === "down") {
		return (
			<ArrowDownRight
				className="h-4.5 w-4.5 text-rose-500"
				aria-label="Pior que mês passado"
			/>
		);
	}

	return (
		<ArrowRight
			className="h-4.5 w-4.5 text-muted-foreground"
			aria-label="Sem variação em relação ao mês passado"
		/>
	);
}

export function OrderSourceMixContent({
	month,
	sourceData,
}: {
	month: string;
	sourceData: OrderSourceDatum[];
}) {
	const monthLabel = useMemo(() => formatMonthLabel(month), [month]);

	const pieData = useMemo<PieData[]>(
		() =>
			sourceData.map((datum, index) => ({
				label: datum.source,
				value: datum.amount,
				color: slicePalette[index % slicePalette.length],
				fill: patternFillForIndex(index),
			})),
		[sourceData],
	);

	return (
		<div className="flex flex-1 items-center gap-12">
			<div className="flex min-w-0 flex-[2] items-center justify-center">
				<div className="relative flex h-[300px] w-[300px] shrink-0 items-center justify-center">
					<PieChart data={pieData} innerRadius={82} size={300}>
						{sourceData.map((datum, index) => {
							const preset = patternPresetForIndex(index);
							const stroke =
								slicePalette[index % slicePalette.length] ?? "var(--chart-1)";

							return (
								<PatternLines
									key={`${datum.source}-pattern`}
									background="transparent"
									height={preset.height}
									id={patternIdForIndex(index)}
									orientation={[...preset.orientation]}
									stroke={stroke}
									strokeWidth={1}
									width={preset.width}
								/>
							);
						})}
						{sourceData.map((datum, index) => (
							<PieSlice
								fill={patternFillForIndex(index)}
								index={index}
								key={datum.source}
							/>
						))}
						<PieCenter
							defaultLabel={monthLabel}
							formatOptions={{
								style: "currency",
								currency: "BRL",
								maximumFractionDigits: 0,
							}}
						/>
					</PieChart>
				</div>
			</div>

			<div className="flex min-w-0 flex-[3] flex-col gap-4 pr-8">
				{sourceData.map((datum, index) => (
					<div key={datum.source} className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<span
								className="size-3 shrink-0"
								style={{
									backgroundColor: slicePalette[index % slicePalette.length],
								}}
							/>
							<span className="text-sm text-muted-foreground">{datum.source}</span>
						</div>
						<div className="ml-auto flex items-center gap-2">
							<span className="text-sm font-medium tabular-nums">
								{datum.percentage.toFixed(1)}%
							</span>
							<TrendIcon trend={datum.monthOverMonthTrend} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
