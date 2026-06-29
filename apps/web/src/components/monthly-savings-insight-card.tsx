"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { useMemo } from "react";

type MonthlySavingsInsightCardProps = {
	title?: string;
	amountSaved?: number;
	amountSuffix?: string;
	actualSeries?: readonly number[];
	baselineSeries?: readonly number[];
	badgeLabel?: string;
};

const DEFAULT_ACTUAL_SERIES = [
	8, 8, 8, 8, 8, 16, 16, 16, 16, 16, 16, 16,
] as const;
const DEFAULT_BASELINE_SERIES = [
	10, 30, 38, 36, 50, 50, 50, 88, 88, 88, 102, 108,
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

export function MonthlySavingsInsightCard({
	title = "Você gastou",
	amountSaved = 629,
	amountSuffix = "a menos este mês",
	actualSeries = DEFAULT_ACTUAL_SERIES,
	baselineSeries = DEFAULT_BASELINE_SERIES,
	badgeLabel,
}: MonthlySavingsInsightCardProps) {
	const chart = useMemo(() => {
		const safeActual =
			actualSeries.length > 1 ? actualSeries : DEFAULT_ACTUAL_SERIES;
		const safeBaseline =
			baselineSeries.length > 1 ? baselineSeries : DEFAULT_BASELINE_SERIES;
		const width = 100;
		const height = 100;
		const maxValue = Math.max(...safeActual, ...safeBaseline, 1);
		const normalize = (value: number) => (value / maxValue) * 78 + 10;
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
		};
	}, [actualSeries, baselineSeries]);

	const resolvedBadgeLabel =
		badgeLabel ??
		`${formatCurrency(amountSaved)} ${amountSaved >= 0 ? "a menos este mês" : "a mais este mês"}`;

	return (
		<Card className="financial-panel-border h-full min-h-[32rem] ring-0">
			<CardHeader className="gap-5">
				<div className="space-y-3">
					<CardDescription className="text-[1.05rem]">{title}</CardDescription>
					<div className="flex flex-wrap items-end gap-x-3 gap-y-2">
						<CardTitle className="text-5xl">
							{formatCurrency(amountSaved)}
						</CardTitle>
						<p className="pb-1 text-3xl text-muted-foreground">
							{amountSuffix}
						</p>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex h-full flex-col">
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
							stroke="rgba(255,255,255,0.18)"
							strokeDasharray="2.5 3"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="0.7"
						/>
						<path
							d={chart.linePath}
							fill="none"
							stroke="#18d24f"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.4"
						/>
						<circle cx={chart.lastX} cy={chart.lastY} fill="#18d24f" r="1.7" />
						<circle
							cx={chart.lastX}
							cy={chart.lastY}
							fill="#0b0b0b"
							r="1.15"
							stroke="#ffffff"
							strokeWidth="0.55"
						/>
					</svg>

					<div className="absolute right-6 bottom-11 rounded-md bg-[#22d35c] px-4 py-2 text-lg font-semibold text-white shadow-[0_10px_28px_rgba(34,211,92,0.26)]">
						{resolvedBadgeLabel}
						<div className="absolute right-5 top-full h-0 w-0 border-x-[8px] border-t-[10px] border-x-transparent border-t-[#22d35c]" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
