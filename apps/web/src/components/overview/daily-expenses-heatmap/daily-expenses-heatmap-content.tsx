"use client";

import { cn } from "@vault/ui/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import type { SalesByHourDatum } from "./use-daily-expenses-heatmap";

const HOUR_LABELS = ["0h", "6h", "12h", "18h", "24h"] as const;
const INTENSITY_CLASSES = [
	"bg-foreground/8",
	"bg-foreground/18",
	"bg-foreground/32",
	"bg-foreground/48",
	"bg-foreground/68",
] as const;
const HEATMAP_COLUMNS = 24;
const RELATION_LABEL = "em relação ao último dia da semana";

function formatPercent(value: number) {
	return `${value.toFixed(1)}%`;
}

function formatCurrency(
	value: number,
	currency: string,
	maximumFractionDigits = 1,
) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		notation: "compact",
		maximumFractionDigits,
	}).format(value);
}

function TrendText({ value }: { value: number }) {
	const positive = value >= 0;
	const Icon = positive ? ArrowUpIcon : ArrowDownIcon;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 text-xs font-medium tabular-nums",
				positive ? "text-emerald-400" : "text-rose-400",
			)}
		>
			<Icon className="size-3.5" />
			<span>{formatPercent(Math.abs(value))}</span>
			<span>{RELATION_LABEL}</span>
		</span>
	);
}

type DailyExpensesHeatmapContentProps = {
	heatmapData: SalesByHourDatum[];
	mobileRows: Array<{ day: string; total: number; peakLabel: string }>;
	metrics: {
		averagePerHour: number;
		maxValue: number;
		peakLabel: string;
		dayChangePct: number;
		total: number;
	};
	currency: string;
	locale: string;
	periodLabel: string;
};

export function DailyExpensesHeatmapContent({
	heatmapData,
	mobileRows,
	metrics,
	currency,
	locale,
	periodLabel,
}: DailyExpensesHeatmapContentProps) {
	return (
		<div className="flex flex-1 flex-col space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
				<div className="space-y-2">
					<p className="text-3xl font-semibold tracking-tight sm:text-4xl">
						<MaskedMonetaryValue
							format={(value) => formatCurrency(value, currency)}
							value={metrics.total}
						/>
					</p>
					<TrendText value={metrics.dayChangePct} />
				</div>
				<p className="text-sm text-muted-foreground sm:pt-1">{periodLabel}</p>
			</div>

			<div className="space-y-3 overflow-hidden pt-1 md:hidden">
				{mobileRows.map((row) => (
					<div
						key={row.day}
						className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-3 py-3"
					>
						<div className="min-w-0">
							<p className="font-medium">{row.day}</p>
							<p className="text-xs text-muted-foreground">{row.peakLabel}</p>
						</div>
						<div className="text-right">
							<p className="text-sm font-medium tabular-nums">
								<MaskedMonetaryValue
									format={(value) => formatCurrency(value, currency)}
									value={row.total}
								/>
							</p>
							<p className="text-xs text-muted-foreground">Total do dia</p>
						</div>
					</div>
				))}
			</div>

			<div className="hidden space-y-8 overflow-hidden pt-3 md:block">
				<div className="space-y-2.5">
					{heatmapData.map((row) => (
						<div
							key={row.day}
							className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4"
						>
							<span
								id={`heatmap-${row.day}`}
								className="text-right text-xs leading-none text-muted-foreground"
							>
								{row.day}
							</span>

							<div
								className="grid min-w-0 grid-cols-24 gap-1"
								role="group"
								aria-labelledby={`heatmap-${row.day}`}
							>
								{row.values.map((value, hour) => {
									const level =
										metrics.maxValue > 0
											? Math.min(
													INTENSITY_CLASSES.length - 1,
													Math.floor(
														(value / metrics.maxValue) *
															INTENSITY_CLASSES.length,
													),
												)
											: 0;

									return (
										<div
											key={`${row.day}-${hour}`}
											aria-label={`${row.day}, ${hour}h às ${(hour + 1) % 24}h: ${new Intl.NumberFormat(locale).format(value)}`}
											className={cn(
												"aspect-square min-w-0 rounded-[2px] border border-white/4",
												INTENSITY_CLASSES[level],
											)}
											role="img"
										/>
									);
								})}
							</div>
						</div>
					))}
				</div>

				<div className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 text-xs text-muted-foreground sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-4">
					<span />
					<div className="grid min-w-0 grid-cols-24 gap-1">
						{HOUR_LABELS.map((label, index) => {
							const hour =
								index === HOUR_LABELS.length - 1
									? HEATMAP_COLUMNS - 1
									: index * 6;
							const alignClassName =
								index === 0
									? "justify-self-start"
									: index === HOUR_LABELS.length - 1
										? "justify-self-end"
										: "justify-self-center";

							return (
								<span
									key={label}
									className={cn("col-span-1", alignClassName)}
									style={{ gridColumnStart: hour + 1 }}
								>
									{label}
								</span>
							);
						})}
					</div>
				</div>
			</div>

			<div className="flex justify-start md:justify-end">
				<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
					<span>Menor</span>
					<div className="flex items-center gap-2">
						{INTENSITY_CLASSES.map((className, index) => (
							<span
								key={className}
								aria-hidden="true"
								className={cn(
									"h-3 w-4 rounded-[3px] border border-white/4",
									className,
									index === INTENSITY_CLASSES.length - 1 &&
										"shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
								)}
							/>
						))}
					</div>
					<span>Maior</span>
				</div>
			</div>
		</div>
	);
}
