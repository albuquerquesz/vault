"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import { Clock3Icon } from "lucide-react";
import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";

export type SalesByHourDatum = {
	day: string;
	values: readonly number[];
};

type SalesByHourHeatmapProps = {
	title?: string;
	periodLabel?: string;
	currency?: string;
	locale?: string;
	data?: readonly SalesByHourDatum[];
	loading?: boolean;
	detailHref?: string;
};

const HOUR_LABELS = ["0h", "6h", "12h", "18h", "24h"] as const;

const DEFAULT_DATA: readonly SalesByHourDatum[] = [
	{
		day: "Seg",
		values: [
			90, 88, 84, 82, 86, 90, 104, 120, 138, 154, 168, 184, 202, 214, 226, 238,
			250, 244, 232, 220, 196, 174, 146, 120,
		],
	},
	{
		day: "Ter",
		values: [
			86, 82, 80, 78, 84, 90, 110, 126, 146, 164, 182, 198, 216, 230, 244, 252,
			264, 258, 246, 228, 206, 184, 160, 132,
		],
	},
	{
		day: "Qua",
		values: [
			78, 76, 74, 72, 76, 84, 100, 116, 134, 152, 170, 188, 204, 218, 230, 242,
			248, 244, 232, 218, 198, 178, 154, 128,
		],
	},
	{
		day: "Qui",
		values: [
			82, 80, 78, 76, 82, 88, 106, 122, 140, 160, 180, 200, 220, 234, 248, 260,
			268, 262, 250, 236, 214, 194, 168, 140,
		],
	},
	{
		day: "Sex",
		values: [
			94, 92, 90, 88, 92, 98, 118, 138, 160, 182, 206, 228, 248, 264, 280, 296,
			310, 304, 288, 270, 246, 224, 198, 166,
		],
	},
	{
		day: "Sab",
		values: [
			102, 98, 96, 94, 100, 110, 128, 148, 174, 198, 224, 246, 268, 288, 310,
			330, 344, 352, 360, 354, 332, 306, 272, 228,
		],
	},
	{
		day: "Dom",
		values: [
			96, 94, 92, 90, 96, 104, 122, 144, 168, 190, 212, 232, 248, 266, 286, 304,
			322, 336, 342, 334, 314, 286, 252, 212,
		],
	},
] as const;

const INTENSITY_CLASSES = [
	"bg-foreground/8",
	"bg-foreground/18",
	"bg-foreground/32",
	"bg-foreground/48",
	"bg-foreground/68",
] as const;

function clampHeatmapData(
	data: readonly SalesByHourDatum[],
): readonly SalesByHourDatum[] {
	if (data.length === 7 && data.every((row) => row.values.length === 24)) {
		return data;
	}

	return DEFAULT_DATA;
}

function formatCurrency(
	value: number,
	locale: string,
	currency: string,
	maximumFractionDigits = 1,
) {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		notation: "compact",
		maximumFractionDigits,
	}).format(value);
}

function formatPeakWindow(day: string, hour: number) {
	const endHour = (hour + 1) % 24;
	return `${day} ${hour}h-${endHour}h`;
}

export function SalesByHourHeatmap({
	title = "Despesas diárias",
	currency = "BRL",
	locale = "pt-BR",
	data = DEFAULT_DATA,
	loading = false,
	detailHref,
}: SalesByHourHeatmapProps) {
	if (loading) {
		return <HomeCardSkeleton variant="heatmap" />;
	}

	const safeData = useMemo(() => clampHeatmapData(data), [data]);

	const metrics = useMemo(() => {
		const allSlots = safeData.flatMap((row) => row.values);
		const maxValue = Math.max(...allSlots, 0);
		const total = allSlots.reduce((sum, value) => sum + value, 0);
		const averagePerHour = total / allSlots.length;

		let peakDay = safeData[0]?.day ?? "Seg";
		let peakHour = 0;
		let peakValue = 0;

		safeData.forEach((row) => {
			row.values.forEach((value, hour) => {
				if (value > peakValue) {
					peakValue = value;
					peakDay = row.day;
					peakHour = hour;
				}
			});
		});

		return {
			averagePerHour,
			maxValue,
			peakLabel: formatPeakWindow(peakDay, peakHour),
			total,
		};
	}, [safeData]);

	return (
		<Card className="financial-panel-border h-full min-h-[22rem] w-full ring-0">
			<CardHeader className="gap-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Clock3Icon className="size-4" aria-hidden="true" />
						<CardDescription className="text-base">{title}</CardDescription>
					</div>
					{detailHref ? (
						<ArrowUpRight className="size-4 text-muted-foreground" />
					) : null}
				</div>

				<div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
					<div className="space-y-1">
						<CardTitle className="text-4xl">
							<MaskedMonetaryValue
								format={(value) => formatCurrency(value, locale, currency)}
								value={metrics.total}
							/>
						</CardTitle>
						<p className="text-muted-foreground text-sm">
							Pico · {metrics.peakLabel}
						</p>
					</div>
					<div className="space-y-1 text-right">
						<p className="text-xl font-semibold tracking-tight">
							<MaskedMonetaryValue
								format={(value) => formatCurrency(value, locale, currency)}
								value={metrics.averagePerHour}
							/>
						</p>
						<p className="text-muted-foreground text-sm">Média / hora</p>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-3">
				<div className="space-y-2.5">
					<div className="space-y-2.5">
						<div className="grid grid-cols-[1.8rem_minmax(0,1fr)] items-start gap-3">
							<div className="grid gap-2 pt-0.5 text-right text-[11px] text-muted-foreground">
								{safeData.map((row) => (
									<span key={row.day} className="h-3 leading-none">
										{row.day}
									</span>
								))}
							</div>

							<div className="grid gap-2">
								{safeData.map((row) => (
									<div
										key={row.day}
										className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1"
										role="group"
										aria-labelledby={`heatmap-${row.day}`}
									>
										<span id={`heatmap-${row.day}`} className="sr-only">
											Mapa de calor de {row.day}
										</span>
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
														"h-3 w-full rounded-[2px] border border-white/4",
														INTENSITY_CLASSES[level],
													)}
													role="img"
												/>
											);
										})}
									</div>
								))}
							</div>
						</div>

						<div className="grid grid-cols-[1.8rem_minmax(0,1fr)] gap-3 text-[11px] text-muted-foreground">
							<span />
							<div className="grid grid-cols-5">
								{HOUR_LABELS.map((label, index) => (
									<span
										key={label}
										className={cn(
											index === 0 && "text-left",
											index > 0 &&
												index < HOUR_LABELS.length - 1 &&
												"text-center",
											index === HOUR_LABELS.length - 1 && "text-right",
										)}
									>
										{label}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					<span>Menor</span>
					<div className="flex items-center gap-1.5">
						{INTENSITY_CLASSES.map((className, index) => (
							<span
								key={className}
								aria-hidden="true"
								className={cn(
									"h-2.5 w-3.5 rounded-[2px] border border-white/4",
									className,
									index === INTENSITY_CLASSES.length - 1 &&
										"shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
								)}
							/>
						))}
					</div>
					<span>Maior</span>
				</div>
			</CardContent>
		</Card>
	);
}
