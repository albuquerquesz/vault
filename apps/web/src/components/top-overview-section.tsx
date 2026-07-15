"use client";

import { Card, CardContent, CardHeader } from "@vault/ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import { cn } from "@vault/ui/lib/utils";
import {
	CalendarIcon,
	CreditCardIcon,
	ReceiptTextIcon,
	ScaleIcon,
	TrendingDownIcon,
	TrendingUpIcon,
	WalletIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { DashboardCardLinkButton } from "@/components/dashboard-card-link-button";
import {
	MaskedMonetaryText,
	MaskedMonetaryValue,
} from "@/components/monetary-visibility";
import { getMonthValue } from "@/features/finance/sdk";

type SummaryCard = {
	title: string;
	value: number;
	description: string;
	change: number;
	icon: React.ReactNode;
	format: (value: number) => string;
	bars: readonly number[];
	isMonetary?: boolean;
	detailHref?: string;
};

export type TopOverviewSummaryCard = SummaryCard;
export type TopOverviewAxisLabel = {
	label: string;
	index: number;
};
export type TopOverviewYAxisTick = {
	value: number;
	label: string;
};
export type TopOverviewMainFlowBar = {
	essenciais: number;
	naoEssenciais: number;
};

export type TopOverviewMainFlowMonth = {
	total: number;
	description: string;
	change: number;
	bars: readonly TopOverviewMainFlowBar[];
	xLabels: readonly TopOverviewAxisLabel[];
	yTicks: readonly TopOverviewYAxisTick[];
	legend?: readonly [string, string];
};

export type MonthOption = {
	value: string;
	label: string;
};

type MonthKey = string;
type OverviewColumnStatus = "primary" | "secondary";
type OverviewSegmentedColumnSegment = {
	status: OverviewColumnStatus;
};

export type TopOverviewSecondaryFlow = {
	total: number;
	description: string;
	change: number;
	bars: readonly number[];
	xLabels: readonly TopOverviewAxisLabel[];
	highlightedIndex?: number;
	highlightedValueLabel?: string;
};

type TopOverviewSectionProps = {
	title?: string;
	summaryCards?: TopOverviewSummaryCard[];
	summaryDescriptions?: string[];
	mainFlowData?: Record<string, TopOverviewMainFlowMonth>;
	secondaryFlow?: TopOverviewSecondaryFlow;
	rightContent?: React.ReactNode;
	extraRightContent?: React.ReactNode;
	initialMonth?: string;
	showMainFlow?: boolean;
};

const _summaryCards: SummaryCard[] = [
	{
		title: "Saídas do mês",
		value: 284_920,
		description: "8.2% vs últimos 30 dias",
		change: 8.2,
		icon: <WalletIcon className="size-3.5" />,
		format: formatCompactCurrency,
		bars: [5, 8, 11, 14, 10, 12, 9],
		isMonetary: true,
	},
	{
		title: "Lançamentos",
		value: 1_842,
		description: "4.1% vs últimos 30 dias",
		change: 4.1,
		icon: <ReceiptTextIcon className="size-3.5" />,
		format: formatInteger,
		bars: [7, 10, 13, 11, 12, 14, 10],
	},
	{
		title: "Porcentagem gasta",
		value: 68.4,
		description: "2.1% vs últimos 30 dias",
		change: -2.1,
		icon: <CreditCardIcon className="size-3.5" />,
		format: (value) => `${value.toFixed(1)}%`,
		bars: [11, 12, 10, 9, 13, 8, 6],
	},
	{
		title: "Taxa de economia",
		value: 3.06,
		description: "0.6% vs últimos 30 dias",
		change: 0.6,
		icon: <ScaleIcon className="size-3.5" />,
		format: (value) => `${value.toFixed(2)}%`,
		bars: [6, 7, 9, 8, 10, 11, 9],
	},
];

const monthlyCampaignBars = [
	18, 42, 27, 33, 21, 38, 25, 44, 31, 27, 39, 34,
] as const;

const defaultMainFlowYTicks: readonly TopOverviewYAxisTick[] = [
	{ value: 0, label: "0k" },
	{ value: 5, label: "5k" },
	{ value: 10, label: "10k" },
	{ value: 15, label: "15k" },
	{ value: 20, label: "20k" },
];

function generateMonthOptions(count = 6): MonthOption[] {
	const now = new Date();
	const options: MonthOption[] = [];
	for (let i = 0; i < count; i++) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const value = getMonthValue(d);
		const label = d.toLocaleDateString("pt-BR", {
			month: "long",
			year: "numeric",
		});
		options.push({
			value,
			label: label.charAt(0).toUpperCase() + label.slice(1),
		});
	}
	return options;
}

const mainFlowData: Record<MonthKey, TopOverviewMainFlowMonth> = {
	"2026-07": {
		total: 413_000,
		description: "Total movimentado em julho de 2026",
		change: 1.5,
		legend: ["Essenciais", "Não essenciais"],
		bars: [
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 7, naoEssenciais: 8 },
			{ essenciais: 4, naoEssenciais: 6 },
			{ essenciais: 3, naoEssenciais: 6 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 7, naoEssenciais: 8 },
			{ essenciais: 7, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 5 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 8, naoEssenciais: 10 },
			{ essenciais: 7, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 8, naoEssenciais: 10 },
			{ essenciais: 8, naoEssenciais: 9 },
			{ essenciais: 7, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 5 },
			{ essenciais: 6, naoEssenciais: 8 },
		],
		xLabels: [
			{ label: "1 Jul", index: 0 },
			{ label: "5 Jul", index: 5 },
			{ label: "10 Jul", index: 9 },
			{ label: "15 Jul", index: 14 },
			{ label: "20 Jul", index: 19 },
			{ label: "25 Jul", index: 24 },
			{ label: "30 Jul", index: 29 },
		],
		yTicks: defaultMainFlowYTicks,
	},
	"2026-06": {
		total: 387_000,
		description: "Total movimentado em junho de 2026",
		change: -2.3,
		legend: ["Essenciais", "Não essenciais"],
		bars: [
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 3, naoEssenciais: 5 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 4, naoEssenciais: 4 },
			{ essenciais: 3, naoEssenciais: 4 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 3, naoEssenciais: 4 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 7, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 6 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 4, naoEssenciais: 4 },
			{ essenciais: 5, naoEssenciais: 7 },
		],
		xLabels: [
			{ label: "1 Jun", index: 0 },
			{ label: "5 Jun", index: 5 },
			{ label: "10 Jun", index: 9 },
			{ label: "15 Jun", index: 14 },
			{ label: "20 Jun", index: 19 },
			{ label: "25 Jun", index: 24 },
			{ label: "29 Jun", index: 28 },
		],
		yTicks: defaultMainFlowYTicks,
	},
	"2026-05": {
		total: 425_000,
		description: "Total movimentado em maio de 2026",
		change: 3.1,
		legend: ["Essenciais", "Não essenciais"],
		bars: [
			{ essenciais: 6, naoEssenciais: 9 },
			{ essenciais: 7, naoEssenciais: 10 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 9 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 4, naoEssenciais: 7 },
			{ essenciais: 3, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 9 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 4, naoEssenciais: 6 },
			{ essenciais: 8, naoEssenciais: 11 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 7, naoEssenciais: 10 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 4, naoEssenciais: 6 },
			{ essenciais: 8, naoEssenciais: 11 },
			{ essenciais: 8, naoEssenciais: 10 },
			{ essenciais: 7, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 7, naoEssenciais: 10 },
			{ essenciais: 6, naoEssenciais: 9 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 6, naoEssenciais: 9 },
		],
		xLabels: [
			{ label: "1 Mai", index: 0 },
			{ label: "5 Mai", index: 5 },
			{ label: "10 Mai", index: 9 },
			{ label: "15 Mai", index: 14 },
			{ label: "20 Mai", index: 19 },
			{ label: "25 Mai", index: 24 },
			{ label: "30 Mai", index: 29 },
		],
		yTicks: defaultMainFlowYTicks,
	},
	"2026-04": {
		total: 398_000,
		description: "Total movimentado em abril de 2026",
		change: 0.8,
		legend: ["Essenciais", "Não essenciais"],
		bars: [
			{ essenciais: 5, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 9 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 4, naoEssenciais: 6 },
			{ essenciais: 5, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 4, naoEssenciais: 6 },
			{ essenciais: 3, naoEssenciais: 6 },
			{ essenciais: 5, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 4, naoEssenciais: 6 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 5 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 9 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 7, naoEssenciais: 9 },
			{ essenciais: 7, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 9 },
			{ essenciais: 5, naoEssenciais: 8 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 5, naoEssenciais: 8 },
		],
		xLabels: [
			{ label: "1 Abr", index: 0 },
			{ label: "5 Abr", index: 5 },
			{ label: "10 Abr", index: 9 },
			{ label: "15 Abr", index: 14 },
			{ label: "20 Abr", index: 19 },
			{ label: "25 Abr", index: 24 },
			{ label: "29 Abr", index: 28 },
		],
		yTicks: defaultMainFlowYTicks,
	},
	"2026-03": {
		total: 372_000,
		description: "Total movimentado em março de 2026",
		change: -1.2,
		legend: ["Essenciais", "Não essenciais"],
		bars: [
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 3, naoEssenciais: 5 },
			{ essenciais: 3, naoEssenciais: 5 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 4, naoEssenciais: 4 },
			{ essenciais: 3, naoEssenciais: 4 },
			{ essenciais: 7, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 3, naoEssenciais: 4 },
			{ essenciais: 7, naoEssenciais: 8 },
			{ essenciais: 7, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 6 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 4, naoEssenciais: 4 },
			{ essenciais: 5, naoEssenciais: 7 },
		],
		xLabels: [
			{ label: "1 Mar", index: 0 },
			{ label: "5 Mar", index: 5 },
			{ label: "10 Mar", index: 9 },
			{ label: "15 Mar", index: 14 },
			{ label: "20 Mar", index: 19 },
			{ label: "25 Mar", index: 24 },
			{ label: "30 Mar", index: 29 },
		],
		yTicks: defaultMainFlowYTicks,
	},
	"2026-02": {
		total: 356_000,
		description: "Total movimentado em fevereiro de 2026",
		change: 2.4,
		legend: ["Essenciais", "Não essenciais"],
		bars: [
			{ essenciais: 4, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 3, naoEssenciais: 5 },
			{ essenciais: 3, naoEssenciais: 5 },
			{ essenciais: 5, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 4, naoEssenciais: 5 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 4, naoEssenciais: 4 },
			{ essenciais: 3, naoEssenciais: 4 },
			{ essenciais: 7, naoEssenciais: 8 },
			{ essenciais: 6, naoEssenciais: 7 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 6, naoEssenciais: 8 },
			{ essenciais: 5, naoEssenciais: 6 },
			{ essenciais: 3, naoEssenciais: 4 },
		],
		xLabels: [
			{ label: "1 Fev", index: 0 },
			{ label: "4 Fev", index: 4 },
			{ label: "8 Fev", index: 7 },
			{ label: "12 Fev", index: 11 },
			{ label: "16 Fev", index: 15 },
			{ label: "20 Fev", index: 19 },
			{ label: "24 Fev", index: 21 },
		],
		yTicks: defaultMainFlowYTicks,
	},
};

const defaultSecondaryFlow: TopOverviewSecondaryFlow = {
	total: 92_500,
	description: "Reservado para metas em agosto",
	change: 5.2,
	bars: monthlyCampaignBars,
	xLabels: [
		{ label: "Jan", index: 0 },
		{ label: "Mar", index: 2 },
		{ label: "Mai", index: 4 },
		{ label: "Jul", index: 6 },
		{ label: "Set", index: 8 },
		{ label: "Nov", index: 10 },
	],
	highlightedIndex: 7,
	highlightedValueLabel: "R$ 93K",
};

function _formatCurrency(value: number) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

function formatCompactCurrency(value: number) {
	const absoluteValue = Math.abs(value);

	if (absoluteValue >= 1_000_000) {
		return `R$ ${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
	}

	if (absoluteValue >= 1_000) {
		return `R$ ${(value / 1_000).toFixed(0)}K`;
	}

	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		maximumFractionDigits: 0,
	}).format(value);
}

function formatInteger(value: number) {
	return new Intl.NumberFormat("pt-BR", {
		maximumFractionDigits: 0,
	}).format(value);
}

function TrendLabel({
	change,
	description,
}: {
	change: number;
	description: string;
}) {
	const positive = change >= 0;

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 whitespace-nowrap text-sm",
				positive ? "text-emerald-400" : "text-rose-400",
			)}
		>
			{positive ? (
				<TrendingUpIcon className="size-3.5" />
			) : (
				<TrendingDownIcon className="size-3.5" />
			)}
			<span className="font-medium">{description}</span>
		</div>
	);
}

function OverviewColumnSegment({
	status,
	className,
}: {
	status: OverviewColumnStatus;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"shrink-0 rounded-[2px]",
				status === "primary" ? "bg-white/88" : "bg-white/24",
				className,
			)}
		/>
	);
}

function OverviewSegmentedColumn({
	segments,
	height,
	gapClassName = "gap-[3px]",
	widthClassName = "w-full",
	segmentClassName,
	className,
}: {
	segments: readonly OverviewSegmentedColumnSegment[];
	height: string;
	gapClassName?: string;
	widthClassName?: string;
	segmentClassName?: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"shrink-0 flex flex-col justify-end",
				widthClassName,
				gapClassName,
				className,
			)}
			style={{ height }}
		>
			{segments.map((segment, index) => (
				<OverviewColumnSegment
					key={`${segment.status}-${index}`}
					status={segment.status}
					className={segmentClassName}
				/>
			))}
		</div>
	);
}

function MiniBars({ bars }: { bars: readonly number[] }) {
	const targetColumnCount = Math.min(5, bars.length);
	const groupedBars = Array.from(
		{ length: targetColumnCount },
		(_, groupIndex) => {
			const start = Math.floor((groupIndex * bars.length) / targetColumnCount);
			const end = Math.floor(
				((groupIndex + 1) * bars.length) / targetColumnCount,
			);
			const slice = bars.slice(start, Math.max(start + 1, end));

			return Math.max(...slice, 1);
		},
	);
	const max = Math.max(...groupedBars, 1);
	const highlightedColumnIndex = groupedBars.indexOf(max);

	return (
		<div className="flex h-[5.5rem] shrink-0 items-end gap-[4px]">
			{groupedBars.map((bar, index) => (
				<OverviewSegmentedColumn
					key={`mini-bar-${index}`}
					segments={Array.from({ length: bar }, () => ({
						status:
							index === highlightedColumnIndex
								? ("primary" as const)
								: ("secondary" as const),
					}))}
					height={`${(bar / max) * 100}%`}
					widthClassName="w-[10px]"
					gapClassName="gap-[2px]"
					segmentClassName="h-[8px] rounded-none"
				/>
			))}
		</div>
	);
}

function _SummaryCard({
	title,
	value,
	description,
	change,
	icon,
	format,
	bars,
	isMonetary = false,
	detailHref,
}: SummaryCard) {
	return (
		<Card className="financial-panel-border !pt-0 !pb-0 gap-0 p-0 ring-0">
			<CardHeader className="px-4 py-3">
				<div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
					<div className="flex items-center gap-2">
						<span className="opacity-80">{icon}</span>
						<span>{title}</span>
					</div>
					{detailHref ? (
						<DashboardCardLinkButton
							className="size-7 text-muted-foreground/80"
							label={`Abrir ${title}`}
							to={detailHref}
						/>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="flex items-end justify-between gap-4 px-4 py-4">
				<div className="min-w-0 flex-1 space-y-2">
					<div className="text-[2rem] leading-none whitespace-nowrap font-semibold tracking-tight text-foreground">
						{isMonetary ? (
							<MaskedMonetaryValue animated format={format} value={value} />
						) : (
							<AnimatedNumber value={value} format={format} />
						)}
					</div>
					<TrendLabel change={change} description={description} />
				</div>
				<MiniBars bars={bars} />
			</CardContent>
		</Card>
	);
}

function MonthSelect({
	value,
	options,
	onChange,
}: {
	value: string;
	options: MonthOption[];
	onChange: (value: string) => void;
}) {
	return (
		<Select value={value} onValueChange={(v) => v && onChange(v)}>
			<SelectTrigger className="h-9 w-[160px] border-white/10 bg-transparent text-sm">
				<CalendarIcon className="mr-2 size-3.5 text-muted-foreground" />
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function AxisLabels({
	barCount,
	labels,
	offsetLeft = 0,
	offsetRight = 0,
	className,
	denseLabelClassName,
}: {
	barCount: number;
	labels: readonly TopOverviewAxisLabel[];
	offsetLeft?: number;
	offsetRight?: number;
	className?: string;
	denseLabelClassName?: string;
}) {
	const denseMode = labels.length === barCount;

	if (denseMode) {
		const labelByIndex = new Map(
			labels.map((item) => [item.index, item.label]),
		);

		return (
			<div
				className={cn("mt-3 text-sm text-muted-foreground", className)}
				style={{ paddingLeft: offsetLeft, paddingRight: offsetRight }}
			>
				<div
					className="grid"
					style={{ gridTemplateColumns: `repeat(${barCount}, minmax(0, 1fr))` }}
				>
					{Array.from({ length: barCount }, (_, index) => (
						<span
							key={`dense-axis-${index}`}
							className={cn(
								"min-w-0 text-center text-[0.6rem] leading-none whitespace-nowrap text-muted-foreground/95",
								denseLabelClassName,
							)}
						>
							{labelByIndex.get(index) ?? ""}
						</span>
					))}
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"relative mt-3 h-5 text-sm text-muted-foreground",
				className,
			)}
		>
			{labels.map((item) => {
				const ratio = barCount <= 1 ? 0 : item.index / (barCount - 1);
				const left = `calc(${offsetLeft}px + (${ratio} * (100% - ${offsetLeft + offsetRight}px)))`;
				const alignClassName =
					item.index === 0
						? "-translate-x-0 text-left"
						: item.index === barCount - 1
							? "-translate-x-full text-right"
							: "-translate-x-1/2 text-center";

				return (
					<span
						key={`${item.label}-${item.index}`}
						className={cn("absolute top-0 whitespace-nowrap", alignClassName)}
						style={{ left }}
					>
						{item.label}
					</span>
				);
			})}
		</div>
	);
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

function LargeBarChart({
	bars,
	xLabels,
	yTicks,
}: {
	bars: readonly TopOverviewMainFlowBar[];
	xLabels: readonly TopOverviewAxisLabel[];
	yTicks: readonly TopOverviewYAxisTick[];
}) {
	const maxBarValue = Math.max(
		...bars.map((bar) => bar.essenciais + bar.naoEssenciais),
		1,
	);
	const maxTickValue = Math.max(...yTicks.map((tick) => tick.value), 1);
	const chartMax = getChartMaxWithHeadroom(maxBarValue, maxTickValue, 1.08);
	const axisWidth = 44;

	return (
		<div className="mt-3">
			<div className="relative h-[18rem]">
				<div className="pointer-events-none absolute inset-y-2 left-0 w-11">
					{yTicks.map((tick) => {
						const bottom = chartMax <= 0 ? 0 : (tick.value / chartMax) * 100;

						return (
							<span
								key={tick.label}
								className="absolute left-0 -translate-y-1/2 text-xs font-medium tracking-[0.02em] text-white/42"
								style={{ bottom: `${bottom}%` }}
							>
								{tick.label}
							</span>
						);
					})}
				</div>

				<div
					className="absolute inset-y-0 right-0 left-11 grid items-end gap-1.5"
					style={{
						gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`,
					}}
				>
					<div className="pointer-events-none absolute inset-0 rounded-[0.45rem] border border-white/[0.04] bg-[linear-gradient(to_right,rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:calc(100%/30)_100%,100%_25%]" />
					{yTicks.map((tick) => {
						const bottom = chartMax <= 0 ? 0 : (tick.value / chartMax) * 100;

						return (
							<div
								key={`main-grid-${tick.label}`}
								className="pointer-events-none absolute inset-x-0 border-t border-white/[0.02]"
								style={{ bottom: `${bottom}%` }}
							/>
						);
					})}

					{bars.map((bar, index) => (
						<div
							key={`daily-bar-${index}`}
							className="relative z-10 flex h-full items-end justify-center"
						>
							<OverviewSegmentedColumn
								segments={[
									...Array.from({ length: bar.naoEssenciais }, () => ({
										status: "secondary" as const,
									})),
									...Array.from({ length: bar.essenciais }, () => ({
										status: "primary" as const,
									})),
								]}
								height={`${((bar.essenciais + bar.naoEssenciais) / chartMax) * 100}%`}
								widthClassName="w-full max-w-[1.15rem]"
								segmentClassName="h-[7px]"
							/>
						</div>
					))}
				</div>
			</div>

			<AxisLabels
				barCount={bars.length}
				labels={xLabels}
				offsetLeft={axisWidth}
				offsetRight={8}
				className="mt-2"
				denseLabelClassName="text-[0.52rem] md:text-[0.58rem]"
			/>
		</div>
	);
}

function MonthlyBarChart({
	bars,
	xLabels,
	highlightedIndex = 0,
	highlightedValueLabel,
}: {
	bars: readonly number[];
	xLabels: readonly TopOverviewAxisLabel[];
	highlightedIndex?: number;
	highlightedValueLabel?: React.ReactNode;
}) {
	const max = Math.max(...bars, 1);
	const chartMax = getChartMaxWithHeadroom(max, 1, 1.12, 2);
	const highlightedLeft =
		bars.length <= 1
			? "0%"
			: `calc(${(highlightedIndex / (bars.length - 1)) * 100}% - 0px)`;

	return (
		<div className="mt-6">
			<div className="relative h-[16rem]">
				<div className="pointer-events-none absolute inset-0 rounded-[0.45rem] border border-white/[0.04] bg-[linear-gradient(to_right,rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:calc(100%/12)_100%,100%_25%]" />
				{highlightedValueLabel ? (
					<span
						className="pointer-events-none absolute top-2 z-20 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-foreground"
						style={{ left: highlightedLeft }}
					>
						{highlightedValueLabel}
					</span>
				) : null}
				<div
					className="absolute inset-x-0 bottom-0 top-8 grid items-end gap-3 px-px"
					style={{
						gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`,
					}}
				>
					{bars.map((bar, index) => (
						<div
							key={`month-bar-${index}`}
							className="relative z-10 flex h-full items-end justify-center"
						>
							<OverviewSegmentedColumn
								segments={Array.from({ length: bar }, () => ({
									status:
										index === highlightedIndex
											? ("primary" as const)
											: ("secondary" as const),
								}))}
								height={`${(bar / chartMax) * 100}%`}
								widthClassName="w-full max-w-[0.95rem]"
								segmentClassName={cn(
									"h-[6px]",
									index === highlightedIndex && "bg-white/88",
									index !== highlightedIndex && "bg-white/24",
								)}
							/>
						</div>
					))}
				</div>
			</div>

			<AxisLabels
				barCount={bars.length}
				labels={xLabels}
				offsetRight={4}
				className="mt-2 h-4"
			/>
		</div>
	);
}

function MainFlowCard({
	data,
	initialMonth,
}: {
	data: Record<MonthKey, TopOverviewMainFlowMonth>;
	initialMonth?: string;
}) {
	const currentMonth = getMonthValue();
	const [selectedMonth, setSelectedMonth] = useState<MonthKey>(
		initialMonth ?? currentMonth,
	);
	const monthOptions = useMemo(() => generateMonthOptions(6), []);
	const currentData = data[selectedMonth];
	const legend = currentData?.legend ?? ["Essenciais", "Não essenciais"];

	if (!currentData) {
		return (
			<Card className="financial-panel-border top-overview-card gap-0 p-0 ring-0">
				<CardContent className="px-5 pt-4 pb-5">
					<p className="text-sm text-muted-foreground">
						Sem dados para este mês.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="financial-panel-border top-overview-card gap-0 p-0 ring-0">
			<CardContent className="px-5 pt-4 pb-5">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
						<div className="space-y-3">
							<div className="text-[2.25rem] leading-none font-semibold tracking-tight">
								<MaskedMonetaryValue
									animated
									format={formatCompactCurrency}
									value={currentData.total}
								/>
							</div>
							<p className="text-sm text-muted-foreground">
								{currentData.description}
							</p>
							<div className="flex items-center gap-5 text-sm text-muted-foreground">
								<div className="flex items-center gap-2">
									<span className="size-2 rounded-full bg-white/88" />
									<span>{legend[0]}</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="size-2 rounded-full bg-white/32" />
									<span>{legend[1]}</span>
								</div>
							</div>
						</div>

						<div className="flex flex-col items-start gap-3 lg:items-end">
							<MonthSelect
								value={selectedMonth}
								options={monthOptions}
								onChange={setSelectedMonth}
							/>
							<TrendLabel
								change={currentData.change}
								description={`${currentData.change.toFixed(1)}% vs mês anterior`}
							/>
						</div>
					</div>

					<LargeBarChart
						bars={currentData.bars}
						xLabels={currentData.xLabels}
						yTicks={currentData.yTicks}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

function SecondaryFlowCard({ data }: { data: TopOverviewSecondaryFlow }) {
	return (
		<Card className="financial-panel-border top-overview-card gap-0 p-0 ring-0">
			<CardContent className="px-5 pt-4 pb-5">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-3">
						<div className="text-[2.25rem] leading-none font-semibold tracking-tight">
							<MaskedMonetaryValue
								animated
								format={formatCompactCurrency}
								value={data.total}
							/>
						</div>
						<TrendLabel
							change={data.change}
							description={`${data.change.toFixed(1)}% vs período anterior`}
						/>
						<p className="text-sm text-muted-foreground">{data.description}</p>
					</div>
				</div>

				<MonthlyBarChart
					bars={data.bars}
					xLabels={data.xLabels}
					highlightedIndex={data.highlightedIndex}
					highlightedValueLabel={
						data.highlightedValueLabel ? (
							<MaskedMonetaryText>
								{data.highlightedValueLabel}
							</MaskedMonetaryText>
						) : undefined
					}
				/>
			</CardContent>
		</Card>
	);
}

export function TopOverviewSection({
	title = "Bem-vindo de volta, Victor.",
	mainFlowData: mainFlow = mainFlowData,
	secondaryFlow,
	rightContent,
	extraRightContent,
	initialMonth,
	showMainFlow = true,
}: TopOverviewSectionProps) {
	const hasCustomSidePanels = rightContent || extraRightContent;
	const hasTwoTopCards = rightContent && extraRightContent;

	return (
		<section className="space-y-4">
			<h2 className="text-4xl font-semibold tracking-tight text-foreground">
				{title}
			</h2>

			{hasCustomSidePanels ? (
				<>
					{hasTwoTopCards ? (
						<>
							<div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
								<div className="h-full">{extraRightContent}</div>
								<div className="h-full">{rightContent}</div>
							</div>
							{showMainFlow ? (
								<MainFlowCard data={mainFlow} initialMonth={initialMonth} />
							) : null}
						</>
					) : (
						<div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
							{showMainFlow ? (
								<div className="xl:col-span-2">
									<MainFlowCard data={mainFlow} initialMonth={initialMonth} />
								</div>
							) : null}
							{rightContent ? (
								<div className="h-full">{rightContent}</div>
							) : null}
							{extraRightContent ? (
								<div className="h-full">{extraRightContent}</div>
							) : null}
						</div>
					)}

					{secondaryFlow ? <SecondaryFlowCard data={secondaryFlow} /> : null}
				</>
			) : showMainFlow ? (
				<div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
					<MainFlowCard data={mainFlow} initialMonth={initialMonth} />
					<SecondaryFlowCard data={secondaryFlow ?? defaultSecondaryFlow} />
				</div>
			) : secondaryFlow ? (
				<SecondaryFlowCard data={secondaryFlow} />
			) : null}
		</section>
	);
}
