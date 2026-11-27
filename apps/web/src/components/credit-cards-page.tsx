"use client";

import { useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { type MonthlyBillItem, MonthlyBillList, formatMonthlyBillCurrency } from "@/components/overview/monthly-bill/monthly-bill-content";
import { buildFinanceMonthOptions } from "@/components/shared/finance-month-options";
import { FinanceMonthSelect } from "@/components/shared/finance-month-select";
import { useMonthlyBillCard } from "@/components/overview/monthly-bill/hooks/use-monthly-bill-card";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import {
	formatMonthlySpendingGoal,
	formatSpendingGoalMonth,
} from "@/components/monthly-spending-goal-utils";
import { formatShortDate, ListSkeleton, ProgressBar, SectionError } from "@/components/shared/page-state";
import { Button } from "@vault/ui/components/button";
import { type InstallmentPlan, useInstallments, useSetBillPaid } from "@/features/finance/cards-sdk";
import { formatApiError } from "@/utils/api";

function BillActions({ item }: { item: MonthlyBillItem }) {
	const setPaid = useSetBillPaid();
	if (!item.pluggyBillId) return null;
	const isPaid = item.totalAmount > 0 && item.paidAmount >= item.totalAmount - 0.01;
	const pluggyBillId = item.pluggyBillId;

	// A bill the bank reports as paid needs no action; only our own mark can be undone.
	if (item.paidSource === "manual") {
		return (
			<Button
				className="self-start"
				disabled={setPaid.isPending}
				onClick={() => setPaid.mutate({ pluggyBillId, paid: false })}
				size="sm"
				variant="ghost"
			>
				Desfazer marcação
			</Button>
		);
	}
	if (isPaid || item.totalAmount <= 0) return null;
	return (
		<Button
			className="self-start"
			disabled={setPaid.isPending}
			onClick={() => setPaid.mutate({ pluggyBillId, paid: true })}
			size="sm"
			variant="outline"
		>
			Marcar como paga
		</Button>
	);
}

function PlanRow({ plan }: { plan: InstallmentPlan }) {
	const percent = (plan.lastNumber / plan.totalInstallments) * 100;
	return (
		<li className="space-y-2 py-3">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-medium">{plan.name}</p>
					<p className="text-xs text-muted-foreground">
						{plan.cardName ? `${plan.cardName} · ` : ""}
						{plan.lastNumber}/{plan.totalInstallments}
						{plan.nextExpectedDate
							? ` · próxima em ${formatShortDate(plan.nextExpectedDate)}`
							: ""}
					</p>
				</div>
				<div className="shrink-0 text-right">
					<p className="text-sm tabular-nums">
						<MaskedMonetaryValue
							format={formatMonthlySpendingGoal}
							value={plan.installmentAmount}
						/>
					</p>
					<p className="text-xs text-muted-foreground">por parcela</p>
				</div>
			</div>
			<ProgressBar
				label={`${plan.lastNumber} de ${plan.totalInstallments} parcelas de ${plan.name}`}
				percent={percent}
			/>
			<p className="text-xs text-muted-foreground">
				Faltam {plan.remainingInstallments}{" "}
				{plan.remainingInstallments === 1 ? "parcela" : "parcelas"}, no total de{" "}
				<MaskedMonetaryValue
					className="text-foreground"
					format={formatMonthlySpendingGoal}
					value={plan.remainingAmount}
				/>
			</p>
		</li>
	);
}

function InstallmentsCard() {
	const query = useInstallments(6);

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="p-4 sm:p-6">
				<CardTitle className="text-xl sm:text-2xl">Compras parceladas</CardTitle>
				<CardDescription>
					Parcelas em andamento no cartão. As próximas são uma projeção: o banco só
					informa a parcela depois que ela é lançada.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
				{query.isPending ? (
					<ListSkeleton />
				) : query.isError ? (
					<SectionError
						message={`Não foi possível carregar as parcelas. ${formatApiError(query.error)}`}
						onRetry={() => query.refetch()}
					/>
				) : query.data.plans.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Nenhuma compra parcelada em andamento.
					</p>
				) : (
					<>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">Ainda a pagar</p>
								<p className="text-xl font-medium tabular-nums sm:text-2xl">
									<MaskedMonetaryValue
										format={formatMonthlySpendingGoal}
										value={query.data.summary.remainingAmount}
									/>
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground">Parcelas restantes</p>
								<p className="text-xl font-medium tabular-nums sm:text-2xl">
									{query.data.summary.remainingInstallments}
								</p>
							</div>
						</div>

						{query.data.upcoming.length > 0 ? (
							<section className="space-y-2">
								<h3 className="text-sm font-medium">Comprometido por mês</h3>
								<ul className="divide-y divide-border/60 border-y border-border/60">
									{query.data.upcoming.map((month) => (
										<li
											className="flex items-center justify-between gap-3 py-2 text-sm"
											key={month.month}
										>
											<span>
												{formatSpendingGoalMonth(month.month)}
												<span className="ml-2 text-xs text-muted-foreground">
													{month.count} {month.count === 1 ? "parcela" : "parcelas"}
												</span>
											</span>
											<span className="tabular-nums">
												<MaskedMonetaryValue
													format={formatMonthlySpendingGoal}
													value={month.total}
												/>
											</span>
										</li>
									))}
								</ul>
							</section>
						) : null}

						<ul className="divide-y divide-border/60 border-y border-border/60">
							{query.data.plans.map((plan) => (
								<PlanRow
									key={`${plan.accountId}-${plan.name}-${plan.totalInstallments}-${plan.installmentAmount}`}
									plan={plan}
								/>
							))}
						</ul>
					</>
				)}
			</CardContent>
		</Card>
	);
}

export function CreditCardsPage({
	initialMonth,
}: {
	initialMonth: string;
}) {
	const [month, setMonth] = useState(initialMonth);
	const monthOptions = useMemo(() => buildFinanceMonthOptions(), []);
	const { bill, isError, isLoading, items } = useMonthlyBillCard(month);

	return (
		<div className="grid min-w-0 gap-4 py-4 sm:gap-6 sm:py-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Cartões
					</h1>
					<p className="max-w-[65ch] text-sm text-muted-foreground sm:text-base">
						Acompanhe todas as faturas e pagamentos do mês.
					</p>
				</div>
				<FinanceMonthSelect
					value={month}
					options={monthOptions}
					onValueChange={setMonth}
				/>
			</header>

			<Card className="financial-panel-border ring-0">
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-xl sm:text-2xl">Faturas</CardTitle>
					<CardDescription>
						Faturas do mês ordenadas pelo maior valor.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5 p-4 sm:p-6">
					{isLoading ? (
						<p className="text-sm text-muted-foreground">Carregando faturas…</p>
					) : isError ? (
						<p className="text-sm text-destructive">
							Não foi possível carregar as faturas.
						</p>
					) : items.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Nenhuma fatura encontrada para este mês.
						</p>
					) : (
						<>
							<div>
								<p className="text-xs text-muted-foreground">Total das faturas</p>
								<p className="text-2xl font-medium tabular-nums sm:text-3xl">
									<MaskedMonetaryValue
										format={formatMonthlyBillCurrency}
										value={bill?.totalBill ?? 0}
									/>
								</p>
							</div>
							<MonthlyBillList
								items={items}
								renderActions={(item) => <BillActions item={item} />}
							/>
						</>
					)}
				</CardContent>
			</Card>

			<InstallmentsCard />
		</div>
	);
}
