"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@vault/ui/components/tooltip";
import { useMemo } from "react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import {
	MaskedMonetaryText,
	MaskedMonetaryValue,
} from "@/components/monetary-visibility";

type MonthlySavingsInsightCardProps = {
	title?: string;
	amountSaved?: number;
	amountSuffix?: string;
	dayLabels?: readonly string[];
	actualSeries?: readonly number[];
	baselineSeries?: readonly number[];
	loading?: boolean;
};

const DEFAULT_ACTUAL_SERIES = [
	312, 314, 314, 315, 315, 358, 360, 360, 360, 360, 360, 360,
] as const;
const DEFAULT_BASELINE_SERIES = [
	340, 471, 506, 495, 557, 558, 558, 794, 794, 794, 876, 915,
] as const;
const DEFAULT_DAY_LABELS = [
	"01 jun.",
	"03 jun.",
	"05 jun.",
	"08 jun.",
	"10 jun.",
	"13 jun.",
	"15 jun.",
	"18 jun.",
	"21 jun.",
	"24 jun.",
	"27 jun.",
	"29 jun.",
] as const;

function formatCurrency(value: number, locale = "pt-BR", currency = "BRL") {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(Math.abs(value));
}

function buildPath(values: readonly number[], width: number, height: number) {
	if (values.length === 0) {
		return "";
	}

	const stepX = values.length > 1 ? width / (values.length - 1) : 0;

	return values
		.map((value, index) => {
			const x = index * stepX;
			const y = height - value;
			return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
		})
		.join(" ");
}

function formatTooltipHeader(label: string) {
	return `${label} vs. mesmo dia do mes passado`;
}

export function MonthlySavingsInsightCard({
	title = "Você gastou",
	amountSaved = 629,
	amountSuffix = "a menos este mês",
	dayLabels = DEFAULT_DAY_LABELS,
	actualSeries = DEFAULT_ACTUAL_SERIES,
	baselineSeries = DEFAULT_BASELINE_SERIES,
	loading = false,
}: MonthlySavingsInsightCardProps) {
	if (loading) {
		return <HomeCardSkeleton variant="savings" />;
	}

	const chart = useMemo(() => {
		const safeActual =
			actualSeries.length > 1 ? actualSeries : DEFAULT_ACTUAL_SERIES;
		const safeBaseline =
			baselineSeries.length > 1 ? baselineSeries : DEFAULT_BASELINE_SERIES;
		const safeLabels =
			dayLabels.length === safeBaseline.length ? dayLabels : DEFAULT_DAY_LABELS;
		const width = 100;
		const height = 100;
		const maxValue = Math.max(...safeActual, ...safeBaseline, 1);
		const normalize = (value: number) => (value / maxValue) * 70 + 12;
		const normalizedActual = safeActual.map(normalize);
		const normalizedBaseline = safeBaseline.map(normalize);
		const linePath = buildPath(normalizedActual, width, height);
		const baselinePath = buildPath(normalizedBaseline, width, height);
		const lastIndex = normalizedActual.length - 1;
		const lastX =
			normalizedActual.length > 1 ? (width / lastIndex) * lastIndex : width;
		const lastY = height - normalizedActual[lastIndex];

		return {
			baselinePath,
			lastX,
			lastY,
			linePath,
			tooltipPoints: normalizedBaseline.map((value, index) => ({
				actualAmount: safeActual[index] ?? 0,
				baselineAmount: safeBaseline[index] ?? 0,
				label: safeLabels[index] ?? `Dia ${index + 1}`,
				x: index * (normalizedBaseline.length > 1 ? width / lastIndex : 0),
				y: height - value,
			})),
		};
	}, [actualSeries, baselineSeries, dayLabels]);

	return (
		<Card className="financial-panel-border h-full min-h-[32rem] ring-0">
			<CardHeader className="gap-4">
				<div className="space-y-3">
					<CardDescription className="text-[1.05rem]">{title}</CardDescription>
					<div className="flex flex-wrap items-end gap-x-3 gap-y-2">
						<CardTitle className="text-4xl">
							<MaskedMonetaryValue format={formatCurrency} value={amountSaved} />
						</CardTitle>
						<p className="pb-0.5 text-2xl text-muted-foreground">
							{amountSuffix}
						</p>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex h-full flex-col">
				<TooltipProvider delay={80}>
					<div className="relative h-56">
						<svg
							className="h-full w-full"
							viewBox="0 0 100 100"
							preserveAspectRatio="none"
							aria-hidden="true"
						>
							<path
								d={chart.baselinePath}
								fill="none"
								stroke="rgba(255,255,255,0.32)"
								strokeDasharray="2.5 3"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="0.7"
							/>
							<path
								d={chart.linePath}
								fill="none"
								stroke="#ffffff"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.4"
							/>
							<circle
								cx={chart.lastX}
								cy={chart.lastY}
								fill="#ffffff"
								r="1.7"
							/>
							<circle
								cx={chart.lastX}
								cy={chart.lastY}
								fill="#0b0b0b"
								r="1.05"
								stroke="#ffffff"
								strokeWidth="0.55"
							/>
						</svg>

						<div className="absolute inset-0">
							{chart.tooltipPoints.map((point, index) => (
								<Tooltip key={`${point.label}-${index}`}>
									<TooltipTrigger
										className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full outline-hidden"
										style={{
											left: `${point.x}%`,
											top: `${point.y}%`,
										}}
									/>
									<TooltipContent
										className="w-56 flex-col items-start gap-2 bg-white px-3 py-3 text-black"
										side="top"
										sideOffset={10}
									>
										<div className="text-[11px] font-medium uppercase tracking-[0.08em] text-black/55">
											{formatTooltipHeader(point.label)}
										</div>
										<div className="space-y-1">
											<div className="text-sm font-medium text-black">
												Voce gastou{" "}
												<MaskedMonetaryText>
													{formatCurrency(point.actualAmount)}
												</MaskedMonetaryText>
											</div>
											<div className="text-sm text-black/68">
												Mes passado:{" "}
												<MaskedMonetaryText>
													{formatCurrency(point.baselineAmount)}
												</MaskedMonetaryText>
											</div>
										</div>
									</TooltipContent>
								</Tooltip>
							))}
						</div>
					</div>
				</TooltipProvider>
			</CardContent>
		</Card>
	);
}
