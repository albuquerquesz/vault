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
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
	MaskedMonetaryValue,
	useMonetaryVisibility,
} from "@/components/monetary-visibility";
import {
	formatMonthlySpendingGoal,
	formatSpendingGoalMonth,
} from "@/components/monthly-spending-goal-utils";
import { ListSkeleton, ProgressBar, SectionError } from "@/components/shared/page-state";
import {
	type Portfolio,
	useInvestmentHistory,
	usePortfolio,
} from "@/features/finance/investments-sdk";
import { formatApiError } from "@/utils/api";

const chartConfig = {
	balance: { label: "Patrimônio", color: "var(--chart-1)" },
} satisfies ChartConfig;

const SUBTYPE_LABEL: Record<string, string> = {
	TREASURY: "Tesouro Direto",
	STOCK: "Ação",
	REAL_ESTATE_FUND: "Fundo imobiliário",
	RETIREMENT: "Previdência",
	PGBL: "PGBL",
	VGBL: "VGBL",
};

function formatPercent(value: number) {
	return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function formatCompact(value: number) {
	return new Intl.NumberFormat("pt-BR", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value);
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="text-xl font-medium tabular-nums sm:text-2xl">{children}</p>
		</div>
	);
}

function EmptyState() {
	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="p-4 sm:p-6">
				<CardTitle className="text-xl sm:text-2xl">Nenhum investimento por aqui ainda</CardTitle>
				<CardDescription>Isso não é um erro.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0 text-sm text-muted-foreground sm:p-6 sm:pt-0">
				<p>
					O Vault lê seus investimentos pela Pluggy. A Pluggy só entrega esse dado quando o
					produto de investimentos (INVESTMENTS) está habilitado para o aplicativo do Vault
					e a conexão do banco ou da corretora inclui investimentos.
				</p>
				<p>
					Enquanto isso não estiver ativo, a carteira fica vazia. Assim que a Pluggy liberar,
					os valores aparecem aqui depois da próxima sincronização, sem precisar reconectar.
				</p>
				<Button nativeButton={false} render={<Link to="/pluggy" />} size="sm" variant="outline">
					Ver conexões
				</Button>
			</CardContent>
		</Card>
	);
}

function History() {
	const { isVisible } = useMonetaryVisibility();
	const history = useInvestmentHistory();
	// The history is a bonus: any failure or a single point just hides it.
	const snapshots = history.data?.snapshots ?? [];
	if (snapshots.length < 2) return null;
	const data = snapshots.map((snapshot) => ({
		label: formatSpendingGoalMonth(snapshot.month).slice(0, 3),
		month: snapshot.month,
		balance: snapshot.totalBalance,
	}));

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="p-4 sm:p-6">
				<CardTitle className="text-xl sm:text-2xl">Evolução</CardTitle>
				<CardDescription>Um registro por mês, a partir da primeira sincronização.</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
				<ChartContainer
					aria-label="Patrimônio ao fim de cada mês"
					className="aspect-auto h-56 w-full sm:h-72"
					config={chartConfig}
				>
					<LineChart accessibilityLayer data={data} margin={{ left: 4, right: 12, top: 12 }}>
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
							tickFormatter={(value: number) => (isVisible ? formatCompact(value) : "•••")}
							tickLine={false}
							width={52}
						/>
						<ChartTooltip
							content={({ active, payload }) => {
								const point = payload?.[0];
								if (!active || !point) return null;
								return (
									<div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
										<p className="text-muted-foreground">
											{formatSpendingGoalMonth(point.payload.month)}
										</p>
										<p className="mt-0.5 text-sm font-medium tabular-nums">
											<MaskedMonetaryValue
												format={formatMonthlySpendingGoal}
												value={Number(point.value)}
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
			</CardContent>
		</Card>
	);
}

function PortfolioContent({ portfolio }: { portfolio: Portfolio }) {
	return (
		<>
			<Card className="financial-panel-border ring-0">
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-xl sm:text-2xl">Carteira</CardTitle>
					<CardDescription>Posições abertas em reais, como a Pluggy informa.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
					<div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-3">
						<Metric label="Valor atual">
							<MaskedMonetaryValue
								format={formatMonthlySpendingGoal}
								value={portfolio.totalBalance}
							/>
						</Metric>
						<Metric label="Valor aplicado">
							{portfolio.totalInvested > 0 ? (
								<MaskedMonetaryValue
									format={formatMonthlySpendingGoal}
									value={portfolio.totalInvested}
								/>
							) : (
								"—"
							)}
						</Metric>
						<Metric label="Rentabilidade">
							{portfolio.returnPercent === null || portfolio.returnAmount === null ? (
								"—"
							) : (
								<>
									{formatPercent(portfolio.returnPercent)}
									<span className="block text-xs font-normal text-muted-foreground">
										<MaskedMonetaryValue
											format={formatMonthlySpendingGoal}
											value={portfolio.returnAmount}
										/>
									</span>
								</>
							)}
						</Metric>
					</div>
					{portfolio.returnPercent === null ? (
						<p className="text-xs text-muted-foreground">
							Sem o valor aplicado não dá para calcular a rentabilidade. Algumas conexões
							não informam esse valor.
						</p>
					) : null}
					{portfolio.otherCurrencyCount > 0 || portfolio.redeemedCount > 0 ? (
						<p className="text-xs text-muted-foreground">
							Fora dos totais:{" "}
							{[
								portfolio.otherCurrencyCount > 0
									? `${portfolio.otherCurrencyCount} em outra moeda`
									: null,
								portfolio.redeemedCount > 0
									? `${portfolio.redeemedCount} já resgatado${portfolio.redeemedCount > 1 ? "s" : ""}`
									: null,
							]
								.filter(Boolean)
								.join(", ")}
							.
						</p>
					) : null}
				</CardContent>
			</Card>

			<Card className="financial-panel-border ring-0">
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-xl sm:text-2xl">Por tipo</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
					<ul className="divide-y divide-border/60 border-y border-border/60">
						{portfolio.byType.map((entry) => (
							<li className="space-y-2 py-3" key={entry.type}>
								<div className="flex items-baseline justify-between gap-3 text-sm">
									<span>
										{entry.label}
										<span className="ml-2 text-xs text-muted-foreground">
											{entry.count} {entry.count === 1 ? "posição" : "posições"}
										</span>
									</span>
									<span className="tabular-nums">
										<MaskedMonetaryValue
											format={formatMonthlySpendingGoal}
											value={entry.balance}
										/>
									</span>
								</div>
								<ProgressBar
									label={`${entry.label}: ${formatPercent(entry.percent)} da carteira`}
									percent={entry.percent}
								/>
								<p className="text-xs text-muted-foreground">
									{formatPercent(entry.percent)} da carteira
								</p>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>

			<History />

			<Card className="financial-panel-border ring-0">
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-xl sm:text-2xl">Posições</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
					<ul className="divide-y divide-border/60 border-y border-border/60">
						{portfolio.positions.map((position) => (
							<li
								className="flex items-start justify-between gap-3 py-3 text-sm"
								key={position.id}
							>
								<div className="min-w-0">
									<p className="truncate">{position.name}</p>
									<p className="truncate text-xs text-muted-foreground">
										{[
											position.institution,
											position.subtype
												? (SUBTYPE_LABEL[position.subtype] ?? position.subtype)
												: null,
										]
											.filter(Boolean)
											.join(" · ")}
									</p>
									{position.amountInvested !== null ? (
										<p className="text-xs text-muted-foreground">
											Aplicado{" "}
											<MaskedMonetaryValue
												format={formatMonthlySpendingGoal}
												value={position.amountInvested}
											/>
										</p>
									) : null}
								</div>
								<div className="shrink-0 text-right">
									<p className="tabular-nums">
										<MaskedMonetaryValue
											format={formatMonthlySpendingGoal}
											value={position.balance}
										/>
									</p>
									{position.returnPercent !== null ? (
										<p className="text-xs text-muted-foreground tabular-nums">
											{formatPercent(position.returnPercent)}
										</p>
									) : null}
								</div>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</>
	);
}

export function InvestmentsPage() {
	const query = usePortfolio();

	return (
		<div className="grid min-w-0 gap-4 py-4 sm:gap-6 sm:py-6">
			<header className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Patrimônio</h1>
				<p className="max-w-[65ch] text-sm text-muted-foreground sm:text-base">
					Seus investimentos em um só lugar. O Vault não recomenda investimentos.
				</p>
			</header>

			{query.isPending ? (
				<Card className="financial-panel-border ring-0">
					<CardContent className="p-4 sm:p-6">
						<ListSkeleton />
					</CardContent>
				</Card>
			) : query.isError ? (
				<Card className="financial-panel-border ring-0">
					<CardContent className="p-4 sm:p-6">
						<SectionError
							message={`Não foi possível carregar o patrimônio agora. O resto do Vault segue funcionando. ${formatApiError(query.error)}`}
							onRetry={() => query.refetch()}
						/>
					</CardContent>
				</Card>
			) : query.data.positions.length === 0 ? (
				<EmptyState />
			) : (
				<PortfolioContent portfolio={query.data} />
			)}
		</div>
	);
}
