"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
} from "@vault/ui/components/chart";
import React from "react";
import { LabelList, Pie, PieChart } from "recharts";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";

export type CategoryMixDatum = {
	category: string;
	/** Percent of total (0–100). Usually sums to 100. */
	share: number;
};

const SLICE_PALETTE = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
] as const;

/** At most four named slices; remaining share rolls into a fifth slice, “Others”. */
const MAX_NAMED_SLICES = 4;

/** Rolling window for the mix (days). */
const periodDays = 7;

/** Demo mix (sums to 100). Replace or pass `data` on the component. */
const data = [
	{ category: "Vestuário", share: 22 },
	{ category: "Acessórios", share: 22 },
	{ category: "Calçados", share: 18 },
	{ category: "Casa e decoração", share: 14 },
	{ category: "Beleza", share: 11 },
	{ category: "Outlet", share: 8 },
	{ category: "Esportes", share: 5 },
] as const satisfies readonly CategoryMixDatum[];

/** Sort by share descending, keep top four, merge the rest into “Others” (max five slices). */
function consolidateTopFourAndOthers(
	data: readonly CategoryMixDatum[],
): CategoryMixDatum[] {
	if (data.length <= MAX_NAMED_SLICES) {
		return [...data];
	}

	const sorted = [...data].sort((a, b) => b.share - a.share);
	const head = sorted.slice(0, MAX_NAMED_SLICES);
	const tail = sorted.slice(MAX_NAMED_SLICES);
	const othersShare = tail.reduce((sum, row) => sum + row.share, 0);

	return [...head, { category: "Outros", share: othersShare }];
}

type SliceRow = {
	key: string;
	category: string;
	share: number;
	fill: string;
};

function buildSlices(data: readonly CategoryMixDatum[]): {
	chartConfig: ChartConfig;
	pieData: SliceRow[];
} {
	const chartConfig: ChartConfig = {
		share: {
			label: "Participação",
		},
	};

	const pieData: SliceRow[] = data.map((row, i) => {
		const key = `s${i}`;
		const color = SLICE_PALETTE[i % SLICE_PALETTE.length];
		chartConfig[key] = {
			label: row.category,
			color,
		};
		return {
			key,
			category: row.category,
			share: row.share,
			fill: `var(--color-${key})`,
		};
	});

	return { chartConfig, pieData };
}

type CategoryRankChartProps = {
	loading?: boolean;
};

export function CategoryRankChart({ loading = false }: CategoryRankChartProps) {
	if (loading) {
		return <HomeCardSkeleton variant="category" />;
	}

	const { chartConfig, pieData } = React.useMemo(
		() => buildSlices(consolidateTopFourAndOthers(data)),
		[],
	);

	return (
		<Card className="financial-panel-border h-full min-h-[32rem] ring-0 md:col-span-2">
			<CardHeader>
				<CardTitle>Participação da receita por categoria</CardTitle>
				<CardDescription>Últimos {periodDays} dias.</CardDescription>
			</CardHeader>
			<CardContent className="my-auto p-0">
				<ChartContainer
					className="aspect-auto h-80 w-full"
					config={chartConfig}
				>
					<PieChart accessibilityLayer>
						<Pie
							cornerRadius={4}
							data={pieData}
							dataKey="share"
							innerRadius={50}
							nameKey="key"
							outerRadius="88%"
							stroke="var(--card)"
							strokeWidth={4}
						>
							<LabelList
								className="fill-background font-medium"
								dataKey="share"
								fill="currentColor"
								fontWeight={500}
								formatter={(label) => {
									const n = Number(label);
									return Number.isFinite(n) ? `${n}%` : String(label ?? "");
								}}
								position="inside"
								stroke="none"
							/>
						</Pie>
						<ChartLegend
							content={
								<ChartLegendContent
									className="flex flex-wrap gap-3 pt-2"
									nameKey="key"
								/>
							}
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
