"use client";

import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import { Skeleton } from "@vault/ui/components/skeleton";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MaskedMonetaryText, MaskedMonetaryValue } from "@/components/monetary-visibility";
import {
	formatMonthlySpendingGoal,
	formatSpendingGoalMonth,
	getSpendingGoalMonthOptions,
	maskMonthlySpendingGoalInput,
	parseMonthlySpendingGoalInput,
} from "@/components/monthly-spending-goal-utils";
import { OverviewMonthSelect } from "@/components/overview/shared/overview-month-select";
import {
	getMonthValue,
	useMonthlySpendingGoal,
	useUpsertMonthlySpendingGoal,
} from "@/features/finance/sdk";

function GoalProgress({ target, spent }: { target: number; spent: number }) {
	const percentage = target > 0 ? (spent / target) * 100 : 0;
	const isOverTarget = percentage > 100;

	return (
		<div className="space-y-3">
			<div className="flex items-end justify-between gap-4">
				<div>
					<p className="text-xs text-muted-foreground">Gasto acumulado</p>
					<p className="mt-1 text-xl font-medium tabular-nums">
						<MaskedMonetaryValue format={formatMonthlySpendingGoal} value={spent} />
					</p>
				</div>
				<p className={isOverTarget ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"}>
					{Math.round(percentage)}% da meta
				</p>
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
			<p className="text-sm text-muted-foreground">
				{isOverTarget ? (
					<>Você ultrapassou a meta em <MaskedMonetaryText>{formatMonthlySpendingGoal(spent - target)}</MaskedMonetaryText>.</>
				) : (
					<><MaskedMonetaryText>{formatMonthlySpendingGoal(Math.max(target - spent, 0))}</MaskedMonetaryText> restantes até a meta.</>
				)}
			</p>
		</div>
	);
}

export function MonthlySpendingGoalPage({ initialMonth }: { initialMonth?: string }) {
	const [month, setMonth] = useState(initialMonth ?? getMonthValue());
	const [targetInput, setTargetInput] = useState("");
	const monthOptions = useMemo(() => getSpendingGoalMonthOptions(), []);
	const goalQuery = useMonthlySpendingGoal(month);
	const saveGoal = useUpsertMonthlySpendingGoal();

	useEffect(() => {
		const target = goalQuery.data?.targetAmount;
		setTargetInput(target === null || target === undefined ? "" : formatMonthlySpendingGoal(target));
	}, [goalQuery.data]);

	const target = goalQuery.data?.targetAmount ?? null;
	const spent = goalQuery.data?.spent ?? 0;
	const dailyLimit = goalQuery.data?.dailyLimit ?? null;
	const remainingDays = goalQuery.data?.remainingDays ?? 0;
	const isOverTarget = goalQuery.data?.isOverTarget ?? false;
	const isLoading = goalQuery.isPending;
	const inputTarget = parseMonthlySpendingGoalInput(targetInput);
	const previewRemaining = Number.isFinite(inputTarget)
		? inputTarget - spent
		: null;
	const previewDailyLimit =
		previewRemaining === null || remainingDays === 0
			? null
			: Math.max(previewRemaining, 0) / remainingDays;

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const targetAmount = parseMonthlySpendingGoalInput(targetInput);

		if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
			toast.error("Informe uma meta maior que zero.");
			return;
		}

		try {
			await saveGoal.mutateAsync({ month, targetAmount });
			toast.success("Meta de gastos salva.");
		} catch {
			// The global mutation handler shows the sanitized API error.
		}
	}

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-col gap-5 py-5 sm:gap-8 sm:py-8">
			<header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<h1 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">Meta de gastos</h1>
				</div>
				<div className="w-full lg:w-auto">
					<OverviewMonthSelect onValueChange={setMonth} options={monthOptions} value={month} />
				</div>
			</header>

			{isLoading ? (
				<Card className="financial-panel-border">
					<CardContent className="grid gap-8 p-5 lg:grid-cols-[1fr_1.1fr] lg:p-8">
						<div className="space-y-4"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-48" /><Skeleton className="h-4 w-64" /></div>
						<div className="space-y-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-28" /></div>
					</CardContent>
				</Card>
			) : goalQuery.isError ? (
				<Card className="financial-panel-border">
					<CardContent className="p-5 text-sm text-muted-foreground sm:p-8">Não foi possível carregar os dados da meta.</CardContent>
				</Card>
			) : (
				<Card className="financial-panel-border">
					<CardHeader className="border-b px-5 py-5 sm:px-8">
						<CardTitle className="text-lg">{formatSpendingGoalMonth(month)}</CardTitle>
						<CardDescription>Meta e gasto acumulado do período selecionado.</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-8 p-5 lg:grid-cols-[1fr_1.1fr] lg:p-8">
						<section className="flex flex-col justify-between gap-7" aria-label="Resumo da meta">
							<div className="space-y-2">
								<p className="text-sm font-medium text-muted-foreground">Meta definida</p>
								<p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-5xl">
									{target === null ? "Ainda não definida" : <MaskedMonetaryValue format={formatMonthlySpendingGoal} value={target} />}
								</p>
							</div>
							{target === null ? (
								<p className="max-w-sm text-sm leading-6 text-muted-foreground">Comece com um valor realista para este mês. Você poderá ajustar a meta a qualquer momento.</p>
							) : (
								<div className="space-y-7">
									<GoalProgress spent={spent} target={target} />
									<div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
										<div>
											<p className="text-sm font-medium text-muted-foreground">Limite diário recomendado</p>
											<p className={isOverTarget ? "mt-1 text-2xl font-semibold text-destructive tabular-nums" : "mt-1 text-2xl font-semibold tabular-nums"}>
												{dailyLimit === null ? "—" : <MaskedMonetaryValue format={formatMonthlySpendingGoal} value={dailyLimit} />}
											</p>
											<p className="mt-1 text-xs text-muted-foreground">Calculado sobre o saldo restante</p>
										</div>
										<div>
											<p className="text-sm font-medium text-muted-foreground">Janela restante</p>
											<p className="mt-1 text-2xl font-semibold tabular-nums">{remainingDays}</p>
											<p className="mt-1 text-xs text-muted-foreground">{remainingDays === 1 ? "dia para fechar o mês" : "dias incluindo hoje"}</p>
										</div>
									</div>
									{isOverTarget && <p className="text-sm text-destructive">A meta já foi ultrapassada. O limite diário fica zerado até o próximo mês.</p>}
								</div>
							)}
						</section>

						<form className="flex flex-col gap-5 border-t pt-7 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0" onSubmit={handleSubmit}>
							<div className="space-y-2">
								<Label htmlFor="monthly-spending-goal">Teto de gastos do mês</Label>
								<Input
									aria-describedby="monthly-spending-goal-hint"
									id="monthly-spending-goal"
									inputMode="decimal"
									placeholder="R$ 0,00"
									value={targetInput}
									onChange={(event) => setTargetInput(maskMonthlySpendingGoalInput(event.target.value))}
								/>
								<p className="text-xs leading-5 text-muted-foreground" id="monthly-spending-goal-hint">Este valor vale somente para {formatSpendingGoalMonth(month).toLowerCase()}.</p>
							</div>
							<div aria-live="polite" className="border bg-muted/30 p-4">
								<p className="text-sm font-medium text-muted-foreground">Prévia do limite diário</p>
								<p className="mt-1 text-xl font-semibold tabular-nums">
									{previewDailyLimit === null ? "—" : formatMonthlySpendingGoal(previewDailyLimit)}
								</p>
								<p className="mt-1 text-xs leading-5 text-muted-foreground">
									Saldo da meta dividido pelos {remainingDays} dias restantes, incluindo hoje.
								</p>
							</div>
							<Button className="w-full sm:w-fit" disabled={saveGoal.isPending} type="submit">
								{saveGoal.isPending ? "Salvando..." : target === null ? "Definir meta" : "Atualizar meta"}
							</Button>
						</form>
					</CardContent>
				</Card>
			)}
		</main>
	);
}
