"use client";

import { Link } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@vault/ui/components/chart";
import { Skeleton } from "@vault/ui/components/skeleton";
import { cn } from "@vault/ui/lib/utils";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import {
	MaskedMonetaryText,
	MaskedMonetaryValue,
	useMonetaryVisibility,
} from "@/components/monetary-visibility";
import {
	formatMonthlySpendingGoal,
	formatSpendingGoalMonth,
} from "@/components/monthly-spending-goal-utils";
import {
	type BalanceProjection,
	PROJECTION_HORIZONS,
	type ProjectionCertainty,
	type ProjectionEvent,
	type ProjectionEventKind,
	type ProjectionHorizon,
	useBalanceProjection,
} from "@/features/finance/projection-sdk";
import { formatApiError } from "@/utils/api";

const chartConfig = {
	balance: { label: "Saldo projetado", color: "var(--chart-1)" },
} satisfies ChartConfig;

const KIND_LABEL: Record<ProjectionEventKind, string> = {
	income: "Receitas recorrentes",
	fixed_bill: "Contas fixas",
	closed_card_bill: "Faturas fechadas",
	open_card_bill: "Fatura em aberto",
	installments: "Parcelas",
	card_spending: "Compras no cartão",
	variable: "Gastos variáveis",
};

const KIND_ORDER: ProjectionEventKind[] = [
	"income",
	"fixed_bill",
	"closed_card_bill",
	"open_card_bill",
	"installments",
	"card_spending",
	"variable",
];

const CERTAINTY_LABEL: Record<ProjectionCertainty, string> = {
	fact: "Confirmado pelo banco",
	registered: "Cadastrado por você",
	estimate: "Estimativa",
};

function formatShortMonth(month: string) {
	const [year, monthNumber] = month.split("-").map(Number);
	return new Date(year, monthNumber - 1, 1)
		.toLocaleDateString("pt-BR", { month: "short" })
		.replace(".", "");
}

function formatDay(date: string) {
	const [, month, day] = date.split("-");
	return `${day}/${month}`;
}

function formatCompact(value: number) {
	return new Intl.NumberFormat("pt-BR", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value);
}

function SummaryItem({
	label,
	children,
	tone,
}: {
	label: string;
	children: React.ReactNode;
	tone?: "danger";
}) {
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p
				className={cn(
					"text-xl font-medium tabular-nums sm:text-2xl",
					tone === "danger" && "text-destructive",
				)}
			>
				{children}
			</p>
		</div>
	);
}

function ProjectionChart({ projection }: { projection: BalanceProjection }) {
	const { isVisible } = useMonetaryVisibility();
	const data = useMemo(
		() => [
			{
				label: "Hoje",
				balance: projection.startBalance ?? 0,
			},
			...projection.months.map((month) => ({
				label: formatShortMonth(month.month),
				balance: month.endBalance,
			})),
		],
		[projection],
	);

	return (
		<ChartContainer
			aria-label="Saldo projetado ao fim de cada mês"
			className="aspect-auto h-64 w-full sm:h-80"
			config={chartConfig}
		>
			<LineChart
				accessibilityLayer
				data={data}
				margin={{ left: 4, right: 12, top: 12, bottom: 0 }}
			>
				<CartesianGrid horizontal strokeDasharray="3 3" vertical={false} />
				<XAxis
					axisLine={false}
					dataKey="label"
					interval="preserveStartEnd"
					minTickGap={12}
					tickLine={false}
					tickMargin={8}
				/>
				<YAxis
					axisLine={false}
					tickFormatter={(value: number) =>
						isVisible ? formatCompact(value) : "•••"
					}
					tickLine={false}
					width={52}
				/>
				<ReferenceLine stroke="var(--destructive)" strokeDasharray="4 4" y={0} />
				<ChartTooltip
					content={({ active, payload }) => {
						const point = payload?.[0];
						if (!active || !point) return null;
						const value = Number(point.value);
						return (
							<div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
								<p className="text-muted-foreground">{point.payload.label}</p>
								<p
									className={cn(
										"mt-0.5 text-sm font-medium tabular-nums",
										value < 0 && "text-destructive",
									)}
								>
									<MaskedMonetaryValue
										format={formatMonthlySpendingGoal}
										value={value}
									/>
								</p>
							</div>
						);
					}}
				/>
				<Line
					dataKey="balance"
					dot={{ r: 3, fill: "var(--chart-1)" }}
					stroke="var(--color-balance)"
					strokeWidth={2}
					type="monotone"
				/>
			</LineChart>
		</ChartContainer>
	);
}

function EventGroup({
	kind,
	events,
}: {
	kind: ProjectionEventKind;
	events: ProjectionEvent[];
}) {
	const total = events.reduce((sum, event) => sum + event.amount, 0);
	return (
		<section className="space-y-2">
			<div className="flex items-baseline justify-between gap-3">
				<h3 className="text-sm font-medium">{KIND_LABEL[kind]}</h3>
				<span
					className={cn(
						"text-sm tabular-nums",
						total < 0 ? "text-muted-foreground" : "text-foreground",
					)}
				>
					<MaskedMonetaryValue format={formatMonthlySpendingGoal} value={total} />
				</span>
			</div>
			<ul className="divide-y divide-border/60 border-y border-border/60">
				{events.map((event, index) => (
					<li
						className="flex items-center justify-between gap-3 py-2 text-sm"
						key={`${event.date}-${event.label}-${index}`}
					>
						<div className="min-w-0">
							<p className="truncate">{event.label}</p>
							<p className="text-xs text-muted-foreground">
								{formatDay(event.date)} · {CERTAINTY_LABEL[event.certainty]}
							</p>
						</div>
						<span className="shrink-0 tabular-nums">
							<MaskedMonetaryValue
								format={formatMonthlySpendingGoal}
								value={event.amount}
							/>
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}

function ProjectionContent({ projection }: { projection: BalanceProjection }) {
	const grouped = useMemo(() => {
		return KIND_ORDER.map((kind) => ({
			kind,
			events: projection.events
				.filter((event) => event.kind === kind)
				.sort((a, b) => a.date.localeCompare(b.date)),
		})).filter((group) => group.events.length > 0);
	}, [projection.events]);

	if (projection.startBalance === null) {
		return (
			<Card className="financial-panel-border ring-0">
				<CardContent className="space-y-3 p-4 sm:p-6">
					<p className="text-sm">
						Sem saldo de conta bancária para partir, não dá para projetar.
					</p>
					<p className="text-sm text-muted-foreground">
						Conecte uma conta no Pluggy e aguarde a primeira sincronização.
					</p>
					<Button
						nativeButton={false}
						render={<Link to="/pluggy" />}
						size="sm"
						variant="outline"
					>
						Conectar conta
					</Button>
				</CardContent>
			</Card>
		);
	}

	const lowest = projection.lowest;
	const last = projection.months.at(-1);

	return (
		<>
			<Card className="financial-panel-border ring-0">
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-xl sm:text-2xl">Saldo projetado</CardTitle>
					<CardDescription>
						Estimativa a partir do saldo das contas e do que já é conhecido.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6 p-4 sm:p-6">
					<div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-3">
						<SummaryItem label="Saldo hoje">
							<MaskedMonetaryValue
								format={formatMonthlySpendingGoal}
								value={projection.startBalance}
							/>
						</SummaryItem>
						<SummaryItem
							label={last ? `Saldo em ${formatSpendingGoalMonth(last.month)}` : "Saldo no fim"}
							tone={last && last.endBalance < 0 ? "danger" : undefined}
						>
							<MaskedMonetaryValue
								format={formatMonthlySpendingGoal}
								value={last?.endBalance ?? projection.startBalance}
							/>
						</SummaryItem>
						<SummaryItem
							label={lowest ? `Menor saldo (${formatDay(lowest.date)})` : "Menor saldo"}
							tone={lowest && lowest.balance < 0 ? "danger" : undefined}
						>
							<MaskedMonetaryValue
								format={formatMonthlySpendingGoal}
								value={lowest?.balance ?? projection.startBalance}
							/>
						</SummaryItem>
					</div>
					{projection.firstNegativeDate ? (
						<p className="text-sm text-destructive" role="status">
							O saldo fica negativo a partir de {formatDay(projection.firstNegativeDate)}.
						</p>
					) : null}
					<ProjectionChart projection={projection} />
				</CardContent>
			</Card>

			<Card className="financial-panel-border ring-0">
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-xl sm:text-2xl">Mês a mês</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
					<ul className="divide-y divide-border/60 border-y border-border/60">
						{projection.months.map((month) => (
							<li
								className="flex items-center justify-between gap-3 py-2.5 text-sm"
								key={month.month}
							>
								<div className="min-w-0">
									<p>{formatSpendingGoalMonth(month.month)}</p>
									<p className="text-xs text-muted-foreground">
										Entradas{" "}
										<MaskedMonetaryText>
											{formatMonthlySpendingGoal(month.income)}
										</MaskedMonetaryText>{" "}
										· Saídas{" "}
										<MaskedMonetaryText>
											{formatMonthlySpendingGoal(month.outflow)}
										</MaskedMonetaryText>
									</p>
								</div>
								<span
									className={cn(
										"shrink-0 tabular-nums",
										month.endBalance < 0 && "text-destructive",
									)}
								>
									<MaskedMonetaryValue
										format={formatMonthlySpendingGoal}
										value={month.endBalance}
									/>
								</span>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>

			<Card className="financial-panel-border ring-0">
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-xl sm:text-2xl">O que compõe a projeção</CardTitle>
					<CardDescription>
						Itens conhecidos no período. O gasto variável diário já está somado nos
						meses, por isso não aparece aqui.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
					{grouped.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Nenhum item conhecido no período. Cadastre contas fixas e receitas
							recorrentes para a projeção ficar mais fiel.
						</p>
					) : (
						grouped.map((group) => (
							<EventGroup events={group.events} key={group.kind} kind={group.kind} />
						))
					)}
				</CardContent>
			</Card>

			{projection.assumptions.length > 0 ? (
				<Card className="financial-panel-border ring-0">
					<CardHeader className="p-4 sm:p-6">
						<CardTitle className="text-xl sm:text-2xl">Premissas</CardTitle>
						<CardDescription>
							Leia para concordar ou discordar do número.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
						<ul className="space-y-2 text-sm text-muted-foreground">
							{projection.assumptions.map((assumption) => (
								<li key={assumption.code}>
									{assumption.kind === "warning" ? (
										<span className="text-foreground">Atenção: </span>
									) : null}
									{assumption.text}
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			) : null}
		</>
	);
}

function ProjectionLoading() {
	return (
		<Card className="financial-panel-border ring-0" aria-busy="true">
			<CardContent className="space-y-4 p-4 sm:p-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-64 w-full sm:h-80" />
			</CardContent>
		</Card>
	);
}

export function ProjectionPage() {
	const [horizon, setHorizon] = useState<ProjectionHorizon>(6);
	const query = useBalanceProjection(horizon);

	return (
		<div className="grid min-w-0 gap-4 py-4 sm:gap-6 sm:py-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Projeção
					</h1>
					<p className="max-w-[65ch] text-sm text-muted-foreground sm:text-base">
						Para onde o seu saldo caminha nos próximos meses.
					</p>
				</div>
				<div
					aria-label="Período da projeção"
					className="flex gap-1"
					role="group"
				>
					{PROJECTION_HORIZONS.map((months) => (
						<Button
							aria-pressed={horizon === months}
							key={months}
							onClick={() => setHorizon(months)}
							size="sm"
							variant={horizon === months ? "secondary" : "outline"}
						>
							{months} meses
						</Button>
					))}
				</div>
			</header>

			{query.isPending ? (
				<ProjectionLoading />
			) : query.isError ? (
				<Card className="financial-panel-border ring-0">
					<CardContent className="space-y-3 p-4 sm:p-6">
						<p className="text-sm text-destructive" role="alert">
							Não foi possível carregar a projeção. {formatApiError(query.error)}
						</p>
						<Button onClick={() => query.refetch()} size="sm" variant="outline">
							Tentar de novo
						</Button>
					</CardContent>
				</Card>
			) : (
				<ProjectionContent projection={query.data} />
			)}
		</div>
	);
}
