"use client";

import { Link } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { Skeleton } from "@vault/ui/components/skeleton";
import { TargetIcon } from "lucide-react";
import { MaskedMonetaryText, MaskedMonetaryValue } from "@/components/monetary-visibility";
import { formatMonthlySpendingGoal, formatSpendingGoalMonth } from "@/components/monthly-spending-goal-utils";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
	OverviewCardLoadingState,
} from "@/components/overview/shared/overview-card-state";
import {
	useFinanceMonthlyOverview,
	useMonthlySpendingGoal,
} from "@/features/finance/sdk";

function GoalProgress({ target, spent }: { target: number; spent: number }) {
	const percentage = target > 0 ? (spent / target) * 100 : 0;
	const isOverTarget = percentage > 100;

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
				<span>Gasto acumulado</span>
				<span className="tabular-nums">{Math.round(percentage)}%</span>
			</div>
			<div
				aria-label={`${Math.round(percentage)}% da meta utilizada`}
				aria-valuemax={100}
				aria-valuemin={0}
				aria-valuenow={Math.min(percentage, 100)}
				className="h-2 w-full overflow-hidden bg-muted"
				role="progressbar"
			>
				<div
					className={isOverTarget ? "h-full bg-destructive" : "h-full bg-primary"}
					style={{ width: `${Math.min(percentage, 100)}%` }}
				/>
			</div>
			<p className={isOverTarget ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
				{isOverTarget ? (
					<>
						Acima da meta em{" "}
						<MaskedMonetaryText>{formatMonthlySpendingGoal(spent - target)}</MaskedMonetaryText>
					</>
				) : (
					<>
						<MaskedMonetaryText>{formatMonthlySpendingGoal(Math.max(target - spent, 0))}</MaskedMonetaryText>{" "}
						disponíveis até a meta
					</>
				)}
			</p>
		</div>
	);
}

function MonthlySpendingGoalLoading() {
	return (
		<OverviewCardShell
			title="Meta de gastos"
			icon={<TargetIcon className="size-4 text-muted-foreground" />}
			tooltip="Acompanhe o gasto do mês em relação à sua meta"
		>
			<div className="space-y-4">
				<Skeleton className="h-3 w-28" />
				<Skeleton className="h-9 w-44" />
				<Skeleton className="h-2 w-full" />
			</div>
		</OverviewCardShell>
	);
}

export function MonthlySpendingGoalCard({ month }: { month: string }) {
	const goalQuery = useMonthlySpendingGoal(month);
	const overviewQuery = useFinanceMonthlyOverview(month);

	if (goalQuery.isPending || overviewQuery.isPending) {
		return <MonthlySpendingGoalLoading />;
	}

	if (goalQuery.isError || overviewQuery.isError) {
		return (
			<OverviewCardShell
				title="Meta de gastos"
				icon={<TargetIcon className="size-4 text-muted-foreground" />}
				tooltip="Acompanhe o gasto do mês em relação à sua meta"
			>
				<OverviewCardErrorState message="Não foi possível carregar a meta de gastos." />
			</OverviewCardShell>
		);
	}

	const target = goalQuery.data?.targetAmount ?? null;
	const spent = overviewQuery.data?.spent ?? 0;

	return (
		<OverviewCardShell
			title="Meta de gastos"
			icon={<TargetIcon className="size-4 text-muted-foreground" />}
			tooltip="Acompanhe o gasto do mês em relação à sua meta"
			className="h-full"
			contentClassName="flex min-h-0 flex-1 flex-col justify-between gap-5"
		>
			{target === null ? (
				<div className="flex min-h-32 flex-col items-start justify-between gap-4">
					<OverviewCardEmptyState
						className="flex-none text-left"
						message={`Nenhuma meta definida para ${formatSpendingGoalMonth(month)}.`}
					/>
					<Button
						nativeButton={false}
						size="sm"
						render={<Link to="/spending-goal" search={{ month }} />}
					>
						Definir meta
					</Button>
				</div>
			) : (
				<div className="space-y-5">
					<div className="flex items-start justify-between gap-3">
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground">{formatSpendingGoalMonth(month)}</p>
							<p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
								<MaskedMonetaryValue format={formatMonthlySpendingGoal} value={target} />
							</p>
						</div>
						<Button
							className="shrink-0"
							nativeButton={false}
							size="sm"
							variant="outline"
							render={<Link to="/spending-goal" search={{ month }} />}
						>
							Editar
						</Button>
					</div>
					<p className="text-sm text-muted-foreground">
						Gasto acumulado: <MaskedMonetaryText>{formatMonthlySpendingGoal(spent)}</MaskedMonetaryText>
					</p>
					<GoalProgress spent={spent} target={target} />
				</div>
			)}
		</OverviewCardShell>
	);
}
