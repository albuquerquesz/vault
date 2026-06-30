"use client";

import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardHeader } from "@vault/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@vault/ui/components/dropdown-menu";
import { cn } from "@vault/ui/lib/utils";
import {
	BarChart3Icon,
	CalendarIcon,
	ChevronsUpDownIcon,
	EllipsisIcon,
	GlobeIcon,
	LayoutPanelTopIcon,
	MegaphoneIcon,
	MoveUpRightIcon,
	Settings2Icon,
	TimerResetIcon,
	TrendingDownIcon,
	TrendingUpIcon,
} from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";

type OverviewStat = {
	title: string;
	value: number;
	prefix?: string;
	suffix?: string;
	change: number;
	icon: React.ReactNode;
	formatter?: (value: number) => string;
};

const overviewStats: OverviewStat[] = [
	{
		title: "Campanhas ativas",
		value: 24,
		change: 12.4,
		icon: <MegaphoneIcon className="size-3.5" />,
	},
	{
		title: "Posts publicados",
		value: 147,
		change: 7.8,
		icon: <CalendarIcon className="size-3.5" />,
	},
	{
		title: "Alcance total",
		value: 412_800,
		change: 4.3,
		icon: <GlobeIcon className="size-3.5" />,
		formatter: (value) =>
			new Intl.NumberFormat("en-US", {
				notation: "compact",
				maximumFractionDigits: 1,
			}).format(value),
	},
	{
		title: "Engajamento médio",
		value: 4.18,
		change: -0.6,
		icon: <BarChart3Icon className="size-3.5" />,
		suffix: "%",
		formatter: (value) => `${value.toFixed(2)}%`,
	},
];

const grossRevenueBars = [
	52, 76, 68, 84, 81, 102, 93, 116, 77, 96, 97, 122, 116, 142, 128, 164, 98,
	121, 115, 132, 121, 145, 112, 138,
] as const;

const grossRevenueYesterdayBars = [
	24, 36, 32, 38, 37, 46, 42, 50, 35, 43, 45, 53, 51, 61, 56, 69, 44, 50, 49,
	57, 54, 62, 58, 66,
] as const;

const grossRevenueLabels = [
	"19:00",
	"21:00",
	"23:00",
	"01:00",
	"03:00",
	"05:00",
	"07:00",
	"09:00",
	"11:00",
	"13:00",
	"15:00",
	"17:00",
] as const;

const peakHoursBars = [
	20, 15, 10, 8, 12, 20, 34, 58, 82, 96, 112, 124, 136, 130, 122, 114, 106,
	98, 110, 122, 112, 90, 66, 42,
] as const;

function surfaceClassName(className?: string) {
	return cn(
		"overflow-hidden rounded-[1.1rem] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_24px_60px_rgba(0,0,0,0.35)] [background-image:radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]",
		className,
	);
}

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

function StatChange({ value }: { value: number }) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 text-xs font-medium",
				value >= 0 ? "text-emerald-400" : "text-rose-400",
			)}
		>
			<span
				className={cn(
					"inline-flex size-3.5 items-center justify-center rounded-full",
					value >= 0 ? "bg-emerald-400/18" : "bg-rose-400/18",
				)}
			>
				{value >= 0 ? (
					<TrendingUpIcon className="size-2.5" />
				) : (
					<TrendingDownIcon className="size-2.5" />
				)}
			</span>
			{Math.abs(value).toFixed(1)}%
			<span className="text-muted-foreground">desde o mês passado</span>
		</div>
	);
}

function StatCard({ title, value, suffix, change, icon, formatter }: OverviewStat) {
	return (
		<Card className={surfaceClassName("gap-0 rounded-[1rem] p-0")}>
			<CardHeader className="border-b border-white/8 px-4 py-2.5">
				<div className="flex items-center justify-between gap-3 text-muted-foreground">
					<div className="flex items-center gap-2 text-[0.8rem]">
						<span className="opacity-80">{icon}</span>
						<span>{title}</span>
					</div>
					<EllipsisIcon className="size-4 opacity-80" />
				</div>
			</CardHeader>
			<CardContent className="space-y-3 px-4 py-3.5">
				<div className="text-[2rem] leading-none font-semibold tracking-tight text-foreground">
					<AnimatedNumber
						value={value}
						format={formatter ?? ((next) => `${Math.round(next)}${suffix ?? ""}`)}
					/>
				</div>
				<StatChange value={change} />
			</CardContent>
		</Card>
	);
}

function PanelShell({
	title,
	icon,
	children,
	className,
}: {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Card className={surfaceClassName(cn("gap-0 p-0", className))}>
			<CardHeader className="border-b border-white/8 px-4 py-3">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span className="opacity-80">{icon}</span>
						<span>{title}</span>
					</div>
					<MoveUpRightIcon className="size-3.5 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent className="px-4 py-4">{children}</CardContent>
		</Card>
	);
}

function GrossRevenuePanel() {
	const maxBar = Math.max(...grossRevenueBars, ...grossRevenueYesterdayBars, 1);

	return (
		<PanelShell
			className="min-h-[27.5rem]"
			icon={<ChevronsUpDownIcon className="size-3.5" />}
			title="Receita bruta"
		>
			<div className="flex h-full flex-col gap-5">
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-wrap items-start gap-6">
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span className="size-2 rounded-full bg-white/28" />
								Hoje
							</div>
							<div className="text-[2rem] leading-none font-semibold tracking-tight">
								<AnimatedNumber value={243.65} format={formatCurrency} />
							</div>
						</div>
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span className="size-2 rounded-full bg-white/76" />
								Ontem
							</div>
							<div className="text-[2rem] leading-none font-semibold tracking-tight text-white/88">
								<AnimatedNumber value={208.19} format={formatCurrency} />
							</div>
						</div>
					</div>
					<div className="pt-2">
						<StatChange value={17} />
					</div>
				</div>

				<div className="relative flex-1">
					<div className="absolute inset-0 [background-image:linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:10%_100%]" />
					<div className="absolute inset-y-0 left-0 right-0 [background-image:linear-gradient(180deg,transparent,rgba(255,255,255,0.03)_98%,transparent)] [background-size:100%_25%]" />
					<div className="relative flex h-[19rem] items-end gap-1.5 overflow-hidden rounded-[0.8rem] border border-white/6 px-3 pb-4 pt-6 [background-image:radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_25%)]">
						{grossRevenueBars.map((bar, index) => (
							<div
								key={`gross-bar-${grossRevenueLabels[index] ?? index}`}
								className="flex min-w-0 flex-1 flex-col justify-end gap-0.5"
							>
								<div
									className="rounded-t-[2px] bg-white/78"
									style={{
										height: `${(grossRevenueYesterdayBars[index] / maxBar) * 100}%`,
									}}
								/>
								<div
									className="rounded-t-[2px] bg-white/18"
									style={{ height: `${(bar / maxBar) * 100}%` }}
								/>
							</div>
						))}
					</div>
					<div className="mt-3 grid grid-cols-6 text-sm text-muted-foreground">
						{grossRevenueLabels.map((label, index) => (
							<span
								key={label}
								className={cn(
									index === 0 && "text-left",
									index > 0 && index < grossRevenueLabels.length - 1 && "text-center",
									index === grossRevenueLabels.length - 1 && "text-right",
								)}
							>
								{label}
							</span>
						))}
					</div>
				</div>
			</div>
		</PanelShell>
	);
}

function TodayBudgetPanel() {
	return (
		<PanelShell
			className="min-h-[13rem]"
			icon={<TimerResetIcon className="size-3.5" />}
			title="Orçamento de hoje"
		>
			<div className="flex h-full flex-col gap-5">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<div className="text-sm text-muted-foreground">Usado hoje</div>
						<div className="text-[2rem] leading-none font-semibold tracking-tight">
							<AnimatedNumber value={223.65} format={formatCurrency} />
						</div>
					</div>
					<div className="space-y-1 border-l border-white/10 pl-4">
						<div className="text-sm text-muted-foreground">Limite do dia</div>
						<div className="text-[2rem] leading-none font-semibold tracking-tight">
							<AnimatedNumber value={480} format={formatCurrency} />
						</div>
					</div>
				</div>
				<div className="grid flex-1 grid-cols-[1.15fr_1fr] overflow-hidden rounded-[0.9rem] border border-white/8">
					<div className="flex items-end border-r border-white/10 [background-image:radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.05),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
						<div className="h-[27%] w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.05))]" />
					</div>
					<div className="flex items-center px-4 [background-image:linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
						<div className="space-y-1">
							<div className="text-[2.15rem] leading-none font-semibold tracking-tight">
								47% usado
							</div>
						</div>
					</div>
				</div>
			</div>
		</PanelShell>
	);
}

function PeakHoursPanel() {
	const maxBar = Math.max(...peakHoursBars, 1);

	return (
		<PanelShell
			className="min-h-[13rem]"
			icon={<TimerResetIcon className="size-3.5" />}
			title="Pico de horário"
		>
			<div className="flex h-full flex-col gap-5">
				<div className="space-y-1">
					<div className="text-[1.65rem] leading-none font-semibold tracking-tight">
						11 AM – 1 PM
					</div>
					<div className="text-sm text-muted-foreground">
						~8% dos pedidos no horário mais intenso
					</div>
				</div>
				<div className="relative flex h-28 items-end gap-1 overflow-hidden rounded-[0.8rem] border border-white/6 px-3 pb-3 pt-4 [background-image:linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:8%_100%]">
					{peakHoursBars.map((value, index) => (
						<div
							key={`peak-bar-${index}`}
							className="flex-1 rounded-t-[2px] bg-[linear-gradient(180deg,rgba(255,255,255,0.32),rgba(255,255,255,0.04))]"
							style={{ height: `${(value / maxBar) * 100}%` }}
						/>
					))}
				</div>
			</div>
		</PanelShell>
	);
}

export function TopOverviewSection() {
	return (
		<section className="top-overview-section space-y-6">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				{overviewStats.map((stat) => (
					<StatCard key={stat.title} {...stat} />
				))}
			</div>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-4xl font-semibold tracking-tight text-foreground">Hoje</h2>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					<Button
						className="rounded-[0.9rem] border-white/12 px-4 text-sm text-foreground [background-image:linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
						size="lg"
						variant="outline"
					>
						<Settings2Icon className="size-4" />
						Customizar
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									className="rounded-[0.9rem] border-white/12 [background-image:linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
									size="icon-lg"
									variant="outline"
								/>
							}
						>
							<EllipsisIcon className="size-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent className="rounded-xl border border-white/10 bg-zinc-950 text-foreground">
							<DropdownMenuItem>Duplicar section</DropdownMenuItem>
							<DropdownMenuItem>Editar métricas</DropdownMenuItem>
							<DropdownMenuItem>Reordenar cards</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
				<GrossRevenuePanel />
				<div className="grid grid-cols-1 gap-4">
					<TodayBudgetPanel />
					<PeakHoursPanel />
				</div>
			</div>
		</section>
	);
}
