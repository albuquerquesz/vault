"use client";

import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import { ArrowRightIcon } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";

/** Daily return rate (% of fulfilled orders returned), last 7 days (demo). */
const returnDaily7 = [
	{ day: "Mon", returnRate: 2.2 },
	{ day: "Tue", returnRate: 1.5 },
	{ day: "Wed", returnRate: 3.1 },
	{ day: "Thu", returnRate: 4.8 },
	{ day: "Fri", returnRate: 2.4 },
	{ day: "Sat", returnRate: 3.2 },
	{ day: "Sun", returnRate: 3.9 },
] as const;

/** Share of orders that were refunded over the same window (demo). */
const REFUNDED_SHARE_OF_ORDERS_PCT = 2.6;

const chartConfig = {
	returnRate: {
		label: "Return %",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function RefundReturnRateChart() {
	const first = returnDaily7[0];
	const lastW = returnDaily7.at(-1) ?? first;
	const returnTrendPct =
		first.returnRate > 0
			? ((lastW.returnRate - first.returnRate) / first.returnRate) * 100
			: 0;

	return (
		<Card className="financial-panel-border ring-0 md:col-span-2">
			<CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<CardTitle>Return rate</CardTitle>
					<CardDescription>Last 7 days</CardDescription>
				</div>
				<div className="space-y-1">
					<CardTitle className="text-right">
						{REFUNDED_SHARE_OF_ORDERS_PCT}%
					</CardTitle>
					<CardDescription>of orders refunded</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="mt-auto">
				<ChartContainer
					className="aspect-auto h-56 w-full"
					config={chartConfig}
				>
					<LineChart
						accessibilityLayer
						data={returnDaily7}
						margin={{ left: 12, right: 12, top: 12, bottom: 0 }}
					>
						<CartesianGrid horizontal={false} strokeDasharray="3 3" />
						<XAxis
							axisLine={false}
							dataKey="day"
							interval={1}
							minTickGap={8}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
						<Line
							dataKey="returnRate"
							dot={false}
							stroke="var(--color-returnRate)"
							strokeWidth={2.5}
							type="monotone"
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
			<CardFooter>
				<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-muted-foreground text-xs">
					<Delta value={returnTrendPct}>
						<DeltaIcon />
						<DeltaValue />
					</Delta>
					<span className="inline-flex min-w-0 text-pretty">
						vs first day (last 7 days)
					</span>
				</div>
				<Button
					className="text-muted-foreground"
					size="xs"
					variant="ghost"
					render={<a href="#/orders/returns" />}
					nativeButton={false}
				>
					Returns desk
					<ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
				</Button>
			</CardFooter>
		</Card>
	);
}
