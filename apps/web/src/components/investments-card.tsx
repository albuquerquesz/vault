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
	ChartTooltip,
	ChartTooltipContent,
} from "@vault/ui/components/chart";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";

export type InvestmentChartDatum = {
	month: string;
	investedTotal: number;
	returnPct: number;
};

type InvestmentsCardProps = {
	title?: string;
	periodLabel?: string;
	totalInvested?: number;
	returnPct?: number;
	data?: readonly InvestmentChartDatum[];
	loading?: boolean;
};

const DEFAULT_DATA = [
	{ month: "Jan", investedTotal: 118_000, returnPct: 1.2 },
	{ month: "Fev", investedTotal: 123_500, returnPct: 1.8 },
	{ month: "Mar", investedTotal: 129_900, returnPct: 1.4 },
	{ month: "Abr", investedTotal: 136_200, returnPct: 2.1 },
	{ month: "Mai", investedTotal: 142_800, returnPct: 2.6 },
	{ month: "Jun", investedTotal: 149_400, returnPct: 3.2 },
] as const satisfies readonly InvestmentChartDatum[];

const chartConfig = {
	investedTotal: {
		label: "Total investido",
		color: "rgba(255,255,255,0.16)",
	},
	returnPct: {
		label: "Rendimento %",
		color: "#f6f7fb",
	},
} satisfies ChartConfig;

function formatCurrency(value: number, locale = "pt-BR", currency = "BRL") {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(value);
}

function formatCompactCurrency(value: number, locale = "pt-BR", currency = "BRL") {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value);
}

function formatPercent(value: number) {
	return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function InvestmentsCard({
	title = "Investimentos",
	periodLabel = "últimos 6 meses",
	totalInvested = 149_400,
	returnPct = 3.2,
	data = DEFAULT_DATA,
	loading = false,
}: InvestmentsCardProps) {
	if (loading) {
		return <HomeCardSkeleton variant="investment" />;
	}

	return (
		<Card className="financial-panel-border h-full min-h-[32rem] ring-0">
			<CardHeader className="gap-5">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-3">
						<CardDescription className="text-base">{title}</CardDescription>
						<div className="flex flex-wrap items-end gap-x-3 gap-y-2">
							<CardTitle className="text-4xl">
								{formatCurrency(totalInvested)}
							</CardTitle>
							<Delta
								value={returnPct}
								className="pb-1.5 text-lg font-medium tracking-tight"
							>
								<DeltaIcon />
								<DeltaValue absolute={false} />
							</Delta>
						</div>
					</div>
					<span className="pt-1 text-right text-sm text-muted-foreground">
						{periodLabel}
					</span>
				</div>
			</CardHeader>

			<CardContent className="flex h-full flex-col">
				<div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
					<span>Total investido hoje</span>
					<span>Rendimento consolidado</span>
				</div>

				<ChartContainer
					className="aspect-auto h-[15.5rem] w-full overflow-hidden"
					config={chartConfig}
				>
					<ComposedChart
						accessibilityLayer
						data={[...data]}
						margin={{ left: 0, right: 4, top: 8, bottom: 0 }}
					>
						<CartesianGrid
							horizontal
							vertical={false}
							stroke="rgba(255,255,255,0.08)"
							strokeDasharray="3 3"
						/>
						<XAxis
							axisLine={false}
							dataKey="month"
							tickLine={false}
							tickMargin={10}
						/>
						<YAxis
							axisLine={false}
							dataKey="investedTotal"
							tickFormatter={(value) => formatCompactCurrency(Number(value))}
							tickLine={false}
							tickMargin={10}
							width={54}
						/>
						<YAxis
							axisLine={false}
							dataKey="returnPct"
							domain={["dataMin - 0.6", "dataMax + 0.6"]}
							orientation="right"
							tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
							tickLine={false}
							tickMargin={10}
							width={40}
							yAxisId="return"
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									indicator="line"
									labelFormatter={(label) => `${label}`}
									formatter={(value, name) => {
										const isCurrency = name === "investedTotal";
										return (
											<div className="flex w-full items-center justify-between gap-4">
												<span className="text-muted-foreground">
													{isCurrency ? "Total investido" : "Rendimento %"}
												</span>
												<span className="font-mono font-medium text-foreground tabular-nums">
													{isCurrency
														? formatCurrency(Number(value))
														: formatPercent(Number(value))}
												</span>
											</div>
										);
									}}
								/>
							}
						/>
						<Bar
							barSize={28}
							dataKey="investedTotal"
							fill="var(--color-investedTotal)"
							radius={[10, 10, 4, 4]}
						/>
						<Line
							dataKey="returnPct"
							dot={{
								fill: "var(--color-returnPct)",
								r: 3,
								stroke: "#101114",
								strokeWidth: 2,
							}}
							stroke="var(--color-returnPct)"
							strokeWidth={2.25}
							type="monotone"
							yAxisId="return"
						/>
					</ComposedChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
