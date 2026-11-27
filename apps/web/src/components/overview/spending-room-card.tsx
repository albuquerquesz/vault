"use client";

import { Link } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { Skeleton } from "@vault/ui/components/skeleton";
import { cn } from "@vault/ui/lib/utils";
import { WalletIcon } from "lucide-react";
import { MaskedMonetaryText, MaskedMonetaryValue } from "@/components/monetary-visibility";
import { formatMonthlySpendingGoal } from "@/components/monthly-spending-goal-utils";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
} from "@/components/overview/shared/overview-card-state";
import { type MonthlySpendingGoal, useMonthlySpendingGoal } from "@/features/finance/sdk";

const TITLE = "Quanto você ainda pode gastar";
const TOOLTIP = "O que sobra do teto de gastos do mês e o ritmo até aqui";

function daysInMonth(month: string) {
	const [year, monthNumber] = month.split("-").map(Number);
	return new Date(year, monthNumber, 0).getDate();
}

/** Spending the target allows by the end of today if spread evenly over the month. */
export function idealSpentSoFar(goal: MonthlySpendingGoal, target: number) {
	const total = daysInMonth(goal.month);
	// remainingDays counts today, so today is already part of the elapsed days.
	const elapsed = Math.min(Math.max(total - goal.remainingDays + 1, 0), total);
	return (target * elapsed) / total;
}

function PaceLine({ ideal, spent, target }: { ideal: number; spent: number; target: number }) {
	const spentPercent = target > 0 ? Math.min((spent / target) * 100, 100) : 0;
	const idealPercent = target > 0 ? Math.min((ideal / target) * 100, 100) : 0;
	const isAhead = spent > ideal;

	return (
		<div className="space-y-2">
			<div
				aria-label={`Gasto realizado: ${Math.round(spentPercent)}% do teto. Ritmo ideal: ${Math.round(idealPercent)}%.`}
				className="relative h-3 w-full"
				role="img"
			>
				<div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
				<div
					className={cn(
						"absolute top-1/2 left-0 h-0.5 -translate-y-1/2",
						isAhead ? "bg-destructive" : "bg-foreground",
					)}
					style={{ width: `${spentPercent}%` }}
				/>
				<div
					className="absolute top-0 h-3 w-px bg-muted-foreground"
					style={{ left: `${idealPercent}%` }}
				/>
			</div>
			<div className="flex items-center gap-4 text-xs text-muted-foreground">
				<span className="inline-flex items-center gap-1.5">
					<span
						className={cn("h-0.5 w-3", isAhead ? "bg-destructive" : "bg-foreground")}
					/>
					Realizado
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="h-3 w-px bg-muted-foreground" />
					Ritmo ideal
				</span>
			</div>
		</div>
	);
}

export function SpendingRoomCard({ month }: { month: string }) {
	const query = useMonthlySpendingGoal(month);
	const icon = <WalletIcon className="size-4 text-muted-foreground" />;

	if (query.isPending) {
		return (
			<OverviewCardShell
				className="sm:min-h-0 xl:min-h-0"
				icon={icon}
				title={TITLE}
				tooltip={TOOLTIP}
			>
				<div aria-busy="true" className="space-y-3">
					<Skeleton className="h-9 w-48" />
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-4 w-64" />
				</div>
			</OverviewCardShell>
		);
	}

	if (query.isError) {
		return (
			<OverviewCardShell
				className="sm:min-h-0 xl:min-h-0"
				icon={icon}
				title={TITLE}
				tooltip={TOOLTIP}
			>
				<OverviewCardErrorState message="Não foi possível carregar o teto de gastos." />
			</OverviewCardShell>
		);
	}

	const goal = query.data;
	const target = goal.targetAmount;

	if (target === null) {
		return (
			<OverviewCardShell
				className="sm:min-h-0 xl:min-h-0"
				icon={icon}
				title={TITLE}
				tooltip={TOOLTIP}
			>
				<div className="flex flex-col items-start gap-4">
					<OverviewCardEmptyState
						className="flex-none text-left"
						message="Defina um teto de gastos para ver quanto ainda pode gastar neste mês."
					/>
					<Button
						nativeButton={false}
						render={<Link search={{ month }} to="/spending-goal" />}
						size="sm"
					>
						Definir teto do mês
					</Button>
				</div>
			</OverviewCardShell>
		);
	}

	const remaining = goal.remainingAmount ?? target - goal.spent;
	const ideal = idealSpentSoFar(goal, target);
	// Positive when below the even pace.
	const paceGap = Math.round((ideal - goal.spent) * 100) / 100;
	const isOver = goal.isOverTarget || remaining < 0;

	return (
		<OverviewCardShell
			className="sm:min-h-0 xl:min-h-0"
			contentClassName="space-y-4"
			icon={icon}
			title={TITLE}
			tooltip={TOOLTIP}
		>
			<div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
				<div className="space-y-1">
					<p
						className={cn(
							"text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl",
							isOver && "text-destructive",
						)}
					>
						<MaskedMonetaryValue
							format={formatMonthlySpendingGoal}
							value={isOver ? Math.abs(remaining) : remaining}
						/>
					</p>
					<p className="text-sm text-muted-foreground">
						{isOver ? "acima do teto de " : "restantes de "}
						<MaskedMonetaryText>{formatMonthlySpendingGoal(target)}</MaskedMonetaryText>
					</p>
				</div>
				<div className="space-y-1 sm:text-right">
					<p
						className={cn(
							"text-sm font-medium",
							paceGap < 0 ? "text-destructive" : "text-foreground",
						)}
					>
						{paceGap === 0 ? (
							"No ritmo"
						) : (
							<>
								<MaskedMonetaryText>
									{formatMonthlySpendingGoal(Math.abs(paceGap))}
								</MaskedMonetaryText>{" "}
								{paceGap > 0 ? "abaixo do ritmo" : "acima do ritmo"}
							</>
						)}
					</p>
					<p className="text-xs text-muted-foreground">
						{isOver || goal.dailyLimit === null || goal.remainingDays === 0 ? (
							isOver ? "Sem folga até o fim do mês" : "Mês encerrado"
						) : (
							<>
								Dá{" "}
								<MaskedMonetaryText>
									{formatMonthlySpendingGoal(goal.dailyLimit)}
								</MaskedMonetaryText>{" "}
								por dia até o fim do mês
							</>
						)}
					</p>
				</div>
			</div>
			<PaceLine ideal={ideal} spent={goal.spent} target={target} />
		</OverviewCardShell>
	);
}
