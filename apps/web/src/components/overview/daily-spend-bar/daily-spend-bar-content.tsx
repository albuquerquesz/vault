"use client";

import {
	Bar,
	BarChart,
	BarDepthBack,
	BarDepthFront,
	BarLineIndicator,
	BarPulse,
	BarXAxis,
	ChartTooltip,
	Grid,
} from "@/components/bar-chart";
import {
	MaskedMonetaryValue,
	maskMonetaryText,
	useMonetaryVisibility,
} from "@/components/monetary-visibility";
import type { DailySpendDatum } from "./hooks/use-daily-spend-bar";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

const brlWholeFormatter = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

/**
 * Vault inverts the bklit chart scale: `--chart-1` is near-white (oklch 0.92)
 * and `--chart-5` is charcoal (oklch 0.34). The Studio "3D Depth" demo paints
 * bars with a dark base (~0.32), so we use the dark end of our palette.
 */
const BAR_COLOR = "var(--chart-5)";
/** Lighter step so the peak day reads clearly without leaving the palette. */
const PEAK_BAR_COLOR = "var(--chart-3)";

function formatBrl(value: number) {
	return brlFormatter.format(value);
}

function formatBrlWhole(value: number) {
	return brlWholeFormatter.format(value);
}

function isPeakDay(
	datum: Record<string, unknown>,
	peakDay: DailySpendDatum | null,
) {
	if (!peakDay) {
		return false;
	}
	return datum.dayNumber === peakDay.dayNumber;
}

export function DailySpendBarContent({
	chartData,
	peakDay,
}: {
	chartData: DailySpendDatum[];
	peakDay: DailySpendDatum | null;
}) {
	const { isVisible } = useMonetaryVisibility();
	const peakIndex = peakDay != null ? peakDay.dayNumber - 1 : undefined;

	const colorFor = (datum: Record<string, unknown>, _index: number) =>
		isPeakDay(datum, peakDay) ? PEAK_BAR_COLOR : BAR_COLOR;

	return (
		<div className="flex h-full min-h-40 w-full flex-1 flex-col gap-2 sm:min-h-55">
			{peakDay ? (
				<p className="mb-4 shrink-0 self-start text-2xl font-sans font-medium tracking-tight tabular-nums text-foreground sm:mb-8 sm:text-4xl">
					<MaskedMonetaryValue format={formatBrlWhole} value={peakDay.amount} />
				</p>
			) : null}
			<BarChart
				className="h-56 shrink-0 sm:h-72"
				aspectRatio="auto"
				data={chartData}
				margin={{ top: 8, right: 8, bottom: 40, left: 8 }}
				xDataKey="day"
			>
				<Grid horizontal />
				<BarDepthBack
					color={BAR_COLOR}
					colorAccessor={colorFor}
					dataKey="amount"
				/>
				<Bar
					dataKey="amount"
					fill={BAR_COLOR}
					fillAccessor={colorFor}
					perspective
				/>
				<BarDepthFront dataKey="amount" />
				{peakIndex != null && peakIndex >= 0 ? (
					<BarPulse activeIndex={peakIndex} dataKey="amount" />
				) : null}
				<BarXAxis maxLabels={12} />
				<ChartTooltip
					rows={(point) => {
						const amount = typeof point.amount === "number" ? point.amount : 0;
						const day =
							typeof point.day === "string"
								? point.day
								: String(point.day ?? "");
						const isPeak =
							peakDay != null && Number(point.dayNumber) === peakDay.dayNumber;

						return [
							{
								color: isPeak ? PEAK_BAR_COLOR : BAR_COLOR,
								label: isPeak ? `Dia ${day} · pico` : `Dia ${day}`,
								value: maskMonetaryText(formatBrl(amount), isVisible),
							},
						];
					}}
					showCrosshair={false}
					showDatePill={false}
					showDots={false}
				/>
				<BarLineIndicator data={chartData} valueKey="amount" xKey="day" />
			</BarChart>
		</div>
	);
}
