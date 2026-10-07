"use client";

import { Link } from "@tanstack/react-router";
import { Card } from "@vault/ui/components/card";
import { Skeleton } from "@vault/ui/components/skeleton";
import { ArrowUpRight, Target, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { useMonthlySpendingGoal } from "@/features/finance/sdk";
import { usePartialResult } from "./partial-result/hooks/use-partial-result";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (value: number) => <MaskedMonetaryValue value={value} format={(amount) => currency.format(amount)} />;

function Metric({ title, icon: Icon, loading, error, children }: {
	title: string; icon: LucideIcon; loading: boolean; error: boolean; children: ReactNode;
}) {
	return (
		<Card className="dashboard-metric min-h-40 gap-3 border-0 bg-muted/40 p-4 ring-0 dark:bg-[oklch(0.215_0.005_285)] sm:p-5">
			<div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4 shrink-0" aria-hidden />{title}</div>
			{loading ? <div className="space-y-3"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /></div> : error ? <p className="text-sm text-muted-foreground">Não foi possível carregar.</p> : children}
		</Card>
	);
}

export function DashboardSummary({ month }: { month: string }) {
	const { metrics, isLoading, isError } = usePartialResult(month);
	const goal = useMonthlySpendingGoal(month);
	const target = goal.data?.targetAmount;
	const spent = goal.data?.spent ?? 0;
	const percentage = target && target > 0 ? spent / target * 100 : 0;
	const valueClass = "break-words text-2xl font-semibold tracking-tight tabular-nums";
	return (
		<div className="grid min-w-0 grid-cols-1 gap-6">
			<Metric title="Gasto" icon={ArrowUpRight} loading={isLoading} error={isError}>
				<p className={valueClass}>{metrics ? money(metrics.spent) : "—"}</p>
				<p className="text-xs text-muted-foreground">Saídas do mês</p>
			</Metric>
			<Metric title="Meta de gastos" icon={Target} loading={goal.isPending} error={goal.isError}>
				{target == null ? <><p className="text-sm text-muted-foreground">Nenhuma meta definida.</p><Link className="mt-auto text-sm font-medium underline underline-offset-4" to="/spending-goal" search={{ month }}>Definir meta</Link></> : <>
					<div className="flex flex-wrap items-center justify-between gap-2"><p className={valueClass}>{money(target)}</p><Link className="text-xs underline underline-offset-4" to="/spending-goal" search={{ month }}>Editar</Link></div>
					<div className="space-y-2"><p className={percentage > 100 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{Math.round(percentage)}% utilizado</p><div role="progressbar" aria-label="Meta utilizada" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, percentage))} className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={percentage > 100 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} /></div></div>
					<p className="text-xs text-muted-foreground">Limite diário: {goal.data?.dailyLimit == null ? "—" : money(goal.data.dailyLimit)}</p>
				</>}
			</Metric>
		</div>
	);
}

export function DashboardMonthTotals({ month }: { month: string }) {
	const { metrics, isLoading, isError } = usePartialResult(month);
	const totals = [
		{ label: "Saldo do mês", value: metrics?.result },
		{ label: "Total gasto", value: metrics?.spent },
		{ label: "Total recebido", value: metrics?.income },
	];
	return (
		<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
			{totals.map(({ label, value }) => (
				<div key={label} className="min-w-0 space-y-2">
					<p className="sr-only">{label}</p>
					{isLoading ? <Skeleton className="h-7 w-28" /> : (
						<p className="break-words text-xl font-semibold tracking-tight tabular-nums">
							{value == null || isError ? "—" : money(value)}
						</p>
					)}
				</div>
			))}
		</div>
	);
}
