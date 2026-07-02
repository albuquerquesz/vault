"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { DashboardCardLinkButton } from "@/components/dashboard-card-link-button";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import {
	MaskedMonetaryValue,
	MonetaryMask,
	useMonetaryVisibility,
} from "@/components/monetary-visibility";

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
	detailHref?: string;
};

const DEFAULT_DATA = [
	{ month: "Jan", investedTotal: 118_000, returnPct: 1.2 },
	{ month: "Fev", investedTotal: 123_500, returnPct: 1.8 },
	{ month: "Mar", investedTotal: 129_900, returnPct: 1.4 },
	{ month: "Abr", investedTotal: 136_200, returnPct: 2.1 },
	{ month: "Mai", investedTotal: 142_800, returnPct: 2.6 },
	{ month: "Jun", investedTotal: 149_400, returnPct: 3.2 },
] as const satisfies readonly InvestmentChartDatum[];

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

function formatAxisCurrency(value: number) {
	if (value === 0) {
		return "R$ 0";
	}

	return `${Math.round(value / 1_000)} mil`;
}

function getChartMaxWithHeadroom(
	maxValue: number,
	minimumMax: number,
	headroomRatio: number,
	absolutePadding = 0,
) {
	return Math.max(
		minimumMax,
		Math.ceil(maxValue * headroomRatio),
		maxValue + absolutePadding,
		1,
	);
}

function OverviewColumnSegment({
	className,
}: {
	className?: string;
}) {
	return (
		<div
			className={cn("shrink-0 rounded-[2px] bg-white/24", className)}
		/>
	);
}

function SegmentedInvestmentBar({
	segments,
	height,
	className,
}: {
	segments: number;
	height: string;
	className?: string;
}) {
	return (
		<div
			className={cn("flex w-full max-w-[1.8rem] flex-col justify-end gap-[3px]", className)}
			style={{ height }}
		>
			{Array.from({ length: segments }, (_, index) => (
				<OverviewColumnSegment key={index} className="h-[10px] rounded-[5px]" />
			))}
		</div>
	);
}

function InvestmentsSegmentedChart({
	data,
	isVisible,
}: {
	data: readonly InvestmentChartDatum[];
	isVisible: boolean;
}) {
	const maxBarValue = Math.max(...data.map((item) => item.investedTotal), 1);
	const chartMax = getChartMaxWithHeadroom(maxBarValue, 160_000, 1.06);
	const yTicks = [0, 40_000, 80_000, 120_000, 160_000] as const;
	const maxSegments = 13;

	return (
		<div className="mt-2">
			<div className="relative h-[13.5rem]">
				<div className="pointer-events-none absolute inset-y-2 left-0 w-12">
					{yTicks.map((tick) => {
						const bottom = chartMax <= 0 ? 0 : (tick / chartMax) * 100;

						return (
							<span
								key={tick}
								className="absolute left-0 -translate-y-1/2 text-xs font-medium tracking-[0.02em] text-white/42"
								style={{ bottom: `${bottom}%` }}
							>
								{isVisible ? (
									formatAxisCurrency(tick)
								) : tick === 0 ? (
									<MonetaryMask className="text-[12px]" />
								) : (
									<MonetaryMask className="text-[12px]" prefix={null} />
								)}
							</span>
						);
					})}
				</div>

				<div
					className="absolute inset-y-0 right-0 left-12 grid items-end gap-5"
					style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
				>
					<div className="pointer-events-none absolute inset-0 rounded-[0.45rem] border border-white/[0.04] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:100%_25%]" />
					{yTicks.map((tick) => {
						const bottom = chartMax <= 0 ? 0 : (tick / chartMax) * 100;

						return (
							<div
								key={`investments-grid-${tick}`}
								className="pointer-events-none absolute inset-x-0 border-t border-white/[0.03]"
								style={{ bottom: `${bottom}%` }}
							/>
						);
					})}

					{data.map((item) => {
						const segments = Math.max(
							4,
							Math.round((item.investedTotal / chartMax) * maxSegments),
						);

						return (
							<div
								key={item.month}
								className="relative z-10 flex h-full items-end justify-center"
							>
								<SegmentedInvestmentBar
									height={`${(item.investedTotal / chartMax) * 100}%`}
									segments={segments}
								/>
							</div>
						);
					})}
				</div>
			</div>

			<div className="mt-3 pl-12 pr-1">
				<div
					className="grid gap-5 text-[0.82rem] text-muted-foreground"
					style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
				>
					{data.map((item) => (
						<span key={`month-${item.month}`} className="text-center">
							{item.month}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}

export function InvestmentsCard({
	title = "Investimentos",
	totalInvested = 149_400,
	returnPct = 3.2,
	data = DEFAULT_DATA,
	loading = false,
	detailHref,
}: InvestmentsCardProps) {
	if (loading) {
		return <HomeCardSkeleton variant="investment" />;
	}

	const { isVisible } = useMonetaryVisibility();

	return (
		<Card className="financial-panel-border h-full min-h-[27rem] ring-0">
			<CardHeader className="gap-5">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-3">
						<CardDescription className="text-base">{title}</CardDescription>
						<div className="flex flex-wrap items-end gap-x-3 gap-y-2">
							<CardTitle className="text-4xl">
								<MaskedMonetaryValue format={formatCurrency} value={totalInvested} />
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
					{detailHref ? (
						<DashboardCardLinkButton
							label={`Abrir ${title}`}
							to={detailHref}
						/>
					) : null}
				</div>
			</CardHeader>

			<CardContent className="flex h-full flex-col">
				<div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
					<span>Total investido hoje</span>
					<span>Rendimento consolidado</span>
				</div>
				<InvestmentsSegmentedChart data={data} isVisible={isVisible} />
			</CardContent>
		</Card>
	);
}
