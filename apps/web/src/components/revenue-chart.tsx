"use client";

import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@vault/ui/components/chart";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import { ArrowRightIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import {
	formatChartAxisTick,
	formatChartTooltipDate,
} from "@/components/formater";
import { revenueChartDemo } from "@/components/revenue-chart-data";

/** Matches `<Select>`; chart uses the last N days of `revenueChartDemo`. */
type PeriodDays = 7 | 14 | 30 | 60 | 90;

// Recharts XAxis: `interval` is tick skip index (0 = all, 1 = every other, …).
const xAxisIntervalByPeriod: Record<PeriodDays, number> = {
	7: 0,
	14: 1,
	30: 3,
	60: 4,
	90: 6,
};

type RevenueRow = {
	date: string;
	revenue: number;
};

const chartConfig = {
	revenue: {
		label: "Receita",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function RevenueChart() {
	const chartUid = useId().replace(/:/g, "");
	const idAreaGradient = `revenue-area-grad-${chartUid}`;
	const [periodDays, setPeriodDays] = useState<PeriodDays>(60);

	const chartRows = useMemo(
		() => revenueChartDemo.slice(-periodDays),
		[periodDays],
	);

	// Footer delta: first → last point in the active series (not calendar MoM).
	const growthPct = useMemo(() => {
		const first = chartRows[0]?.revenue ?? 0;
		const last = chartRows.at(-1)?.revenue ?? first;
		if (!first) {
			return 0;
		}
		return ((last - first) / first) * 100;
	}, [chartRows]);

	// Extra spacing so long ranges don’t collide; pairs with `interval` above.
	const xAxisMinTickGap =
		periodDays <= 7
			? undefined
			: Math.max(8, Math.min(52, Math.floor(periodDays / 2)));

	return (
		<Card className="financial-panel-border ring-0 md:col-span-2 lg:col-span-4">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<CardTitle className="text-balance">Receita</CardTitle>
				<Select
					onValueChange={(v) => {
						setPeriodDays(Number(v) as PeriodDays);
					}}
					value={String(periodDays)}
				>
					<SelectTrigger
						aria-label="Intervalo de tempo da receita"
						className="w-full min-w-36 sm:w-fit"
						size="sm"
					>
						<SelectValue placeholder="Período" />
					</SelectTrigger>
					<SelectContent align="end">
						<SelectItem value="7">Últimos 7 dias</SelectItem>
						<SelectItem value="14">Últimos 14 dias</SelectItem>
						<SelectItem value="30">Últimos 30 dias</SelectItem>
						<SelectItem value="60">Últimos 60 dias</SelectItem>
						<SelectItem value="90">Últimos 90 dias</SelectItem>
					</SelectContent>
				</Select>
			</CardHeader>
			<CardContent>
				<ChartContainer
					className="aspect-auto h-60 w-full p-0"
					config={chartConfig}
				>
					<AreaChart
						accessibilityLayer
						// Copy so Recharts always sees a mutable array reference.
						data={[...chartRows]}
						margin={{ left: 24, right: 8, top: 8, bottom: 0 }}
					>
						<defs>
							<linearGradient id={idAreaGradient} x1="0" x2="0" y1="0" y2="1">
								<stop
									offset="0%"
									stopColor="var(--color-revenue)"
									stopOpacity={0.2}
								/>
								<stop
									offset="100%"
									stopColor="var(--color-revenue)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid horizontal={false} strokeDasharray="2 2" />
						<XAxis
							axisLine={false}
							dataKey="date"
							interval={xAxisIntervalByPeriod[periodDays]}
							minTickGap={xAxisMinTickGap}
							tickFormatter={(value) =>
								formatChartAxisTick(String(value), periodDays)
							}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="min-w-36"
									indicator="line"
									labelFormatter={(_, payload) => {
										const row = payload?.[0]?.payload as RevenueRow | undefined;
										if (!row?.date) {
											return "";
										}
										return formatChartTooltipDate(row.date, "short");
									}}
								/>
							}
						/>
						<Area
							dataKey="revenue"
							dot={false}
							fill={`url(#${idAreaGradient})`}
							stroke="var(--color-revenue)"
							strokeWidth={2}
							type="monotone"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex items-center justify-between">
				<div className="flex items-center gap-1 text-muted-foreground text-xs">
					<Delta value={growthPct}>
						<DeltaIcon />
						<DeltaValue />
					</Delta>
					<p className="inline-flex text-pretty">
						vs primeiro dia nos últimos {periodDays} dias.
					</p>
				</div>
				<Button
					className="text-muted-foreground"
					size="xs"
					variant="ghost"
					render={<a href="#/reports" />}
					nativeButton={false}
				>
					Ver relatório
					<ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
				</Button>
			</CardFooter>
		</Card>
	);
}
