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
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import {
	formatMonthlySpendingGoal,
	maskMonthlySpendingGoalInput,
	parseMonthlySpendingGoalInput,
} from "@/components/monthly-spending-goal-utils";
import { ListSkeleton, ProgressBar, SectionError } from "@/components/shared/page-state";
import {
	useAddGoalContribution,
	useDeleteGoalContribution,
	useGoalContributions,
	useGoalPlan,
} from "@/features/finance/goals-sdk";
import {
	type Goal,
	getMonthValue,
	getTodayValue,
	useCreateGoal,
	useDeleteGoal,
	useGoals,
	useUpdateGoal,
} from "@/features/finance/sdk";
import { formatApiError } from "@/utils/api";

function formatDeadline(date: string) {
	const [year, month, day] = date.split("-");
	return `${day}/${month}/${year}`;
}

function GoalForm({ goal, onDone }: { goal?: Goal; onDone: () => void }) {
	const formId = useId();
	const create = useCreateGoal();
	const update = useUpdateGoal();
	const [name, setName] = useState(goal?.name ?? "");
	const [target, setTarget] = useState(
		goal ? formatMonthlySpendingGoal(goal.targetAmount) : "",
	);
	const [current, setCurrent] = useState("");
	const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
	const [url, setUrl] = useState(goal?.url ?? "");
	const pending = create.isPending || update.isPending;

	async function submit(event: FormEvent) {
		event.preventDefault();
		const targetAmount = parseMonthlySpendingGoalInput(target);
		if (!name.trim()) return;
		if (!(targetAmount > 0)) {
			toast.error("Informe um valor maior que zero.");
			return;
		}
		try {
			if (goal) {
				await update.mutateAsync({
					id: goal.id,
					name: name.trim(),
					targetAmount,
					targetDate: targetDate || null,
					url: url.trim() || null,
				});
				toast.success("Meta atualizada.");
			} else {
				const currentAmount = current ? parseMonthlySpendingGoalInput(current) : 0;
				await create.mutateAsync({
					name: name.trim(),
					targetAmount,
					currentAmount: Number.isFinite(currentAmount) ? currentAmount : 0,
					targetDate: targetDate || null,
					url: url.trim() || null,
				});
				toast.success("Meta criada.");
			}
			onDone();
		} catch {
			// Handled globally.
		}
	}

	return (
		<form
			className="grid gap-3 border border-border/60 p-3 sm:grid-cols-2 sm:p-4"
			onSubmit={submit}
		>
			<div className="space-y-2">
				<Label htmlFor={`${formId}-name`}>Nome</Label>
				<Input
					id={`${formId}-name`}
					maxLength={128}
					onChange={(event) => setName(event.target.value)}
					placeholder="Ex.: Viagem"
					required
					value={name}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${formId}-target`}>Valor da meta</Label>
				<Input
					id={`${formId}-target`}
					inputMode="decimal"
					onChange={(event) => setTarget(maskMonthlySpendingGoalInput(event.target.value))}
					placeholder="R$ 0,00"
					required
					value={target}
				/>
			</div>
			{goal ? null : (
				<div className="space-y-2">
					<Label htmlFor={`${formId}-current`}>Já guardado (opcional)</Label>
					<Input
						id={`${formId}-current`}
						inputMode="decimal"
						onChange={(event) =>
							setCurrent(maskMonthlySpendingGoalInput(event.target.value))
						}
						placeholder="R$ 0,00"
						value={current}
					/>
				</div>
			)}
			<div className="space-y-2">
				<Label htmlFor={`${formId}-date`}>Prazo (opcional)</Label>
				<Input
					id={`${formId}-date`}
					onChange={(event) => setTargetDate(event.target.value)}
					type="date"
					value={targetDate}
				/>
			</div>
			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor={`${formId}-url`}>Link (opcional)</Label>
				<Input
					id={`${formId}-url`}
					onChange={(event) => setUrl(event.target.value)}
					placeholder="https://..."
					type="url"
					value={url}
				/>
			</div>
			<div className="flex gap-2 sm:col-span-2">
				<Button disabled={pending} type="submit">
					{pending ? "Salvando..." : goal ? "Salvar" : "Criar meta"}
				</Button>
				<Button onClick={onDone} type="button" variant="ghost">
					Cancelar
				</Button>
			</div>
		</form>
	);
}

const KIND_LABEL = { deposit: "Aporte", withdrawal: "Retirada" } as const;

function ContributionPanel({ goal }: { goal: Goal }) {
	const formId = useId();
	const add = useAddGoalContribution();
	const remove = useDeleteGoalContribution();
	const history = useGoalContributions(goal.id);
	const [amount, setAmount] = useState("");
	const [kind, setKind] = useState<"deposit" | "withdrawal">("deposit");
	const [date, setDate] = useState(getTodayValue());
	const [note, setNote] = useState("");

	async function submit(event: FormEvent) {
		event.preventDefault();
		const value = parseMonthlySpendingGoalInput(amount);
		if (!(value > 0)) {
			toast.error("Informe um valor maior que zero.");
			return;
		}
		try {
			await add.mutateAsync({
				goalId: goal.id,
				amount: value,
				kind,
				date,
				note: note.trim() || undefined,
			});
			toast.success(kind === "deposit" ? "Aporte registrado." : "Retirada registrada.");
			setAmount("");
			setNote("");
		} catch {
			// Handled globally.
		}
	}

	return (
		<div className="space-y-4 border border-border/60 p-3 sm:p-4">
			<form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
				<div className="space-y-2">
					<Label htmlFor={`${formId}-kind`}>Tipo</Label>
					<Select
						onValueChange={(next) => next && setKind(next as "deposit" | "withdrawal")}
						value={kind}
					>
						<SelectTrigger className="w-full" id={`${formId}-kind`}>
							<SelectValue>
								{(selected) => KIND_LABEL[selected as keyof typeof KIND_LABEL]}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="deposit">Aporte</SelectItem>
							<SelectItem value="withdrawal">Retirada</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${formId}-amount`}>Valor</Label>
					<Input
						id={`${formId}-amount`}
						inputMode="decimal"
						onChange={(event) => setAmount(maskMonthlySpendingGoalInput(event.target.value))}
						placeholder="R$ 0,00"
						required
						value={amount}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${formId}-date`}>Data</Label>
					<Input
						id={`${formId}-date`}
						max={getTodayValue()}
						onChange={(event) => setDate(event.target.value)}
						required
						type="date"
						value={date}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${formId}-note`}>Nota (opcional)</Label>
					<Input
						id={`${formId}-note`}
						maxLength={280}
						onChange={(event) => setNote(event.target.value)}
						value={note}
					/>
				</div>
				<div className="sm:col-span-2">
					<Button disabled={add.isPending} type="submit">
						{add.isPending ? "Registrando..." : "Registrar"}
					</Button>
				</div>
			</form>

			{history.isPending ? (
				<ListSkeleton rows={2} />
			) : history.isError ? (
				<SectionError
					message={`Não foi possível carregar o histórico. ${formatApiError(history.error)}`}
					onRetry={() => history.refetch()}
				/>
			) : history.data.length === 0 ? (
				<p className="text-sm text-muted-foreground">Nenhum aporte registrado ainda.</p>
			) : (
				<ul className="divide-y divide-border/60 border-y border-border/60">
					{history.data.map((entry) => (
						<li
							className="flex items-center justify-between gap-3 py-2 text-sm"
							key={entry.id}
						>
							<div className="min-w-0">
								<p>
									{KIND_LABEL[entry.kind]} ·{" "}
									<span className="tabular-nums">
										{entry.kind === "withdrawal" ? "-" : "+"}
										<MaskedMonetaryValue
											format={formatMonthlySpendingGoal}
											value={entry.amount}
										/>
									</span>
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{formatDeadline(entry.date)}
									{entry.note ? ` · ${entry.note}` : ""}
								</p>
							</div>
							<Button
								disabled={remove.isPending}
								onClick={async () => {
									if (!window.confirm("Apagar este lançamento? O valor da meta volta ao que era."))
										return;
									try {
										await remove.mutateAsync({
											goalId: goal.id,
											contributionId: entry.id,
										});
										toast.success("Lançamento apagado.");
									} catch {
										// Handled globally.
									}
								}}
								size="sm"
								variant="ghost"
							>
								Apagar
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function PlanLine({ goal }: { goal: Goal }) {
	const plan = useGoalPlan(goal);
	if (goal.isCompleted || plan.isError || !plan.data) return null;
	const data = plan.data;
	if (data.isComplete) return null;
	if (!data.targetDate) {
		return (
			<p className="text-xs text-muted-foreground">
				Defina um prazo para ver quanto guardar por mês.
			</p>
		);
	}
	if (data.isPastDue) {
		return (
			<p className="text-xs text-destructive">
				Prazo vencido em {formatDeadline(data.targetDate)}. Faltam{" "}
				<MaskedMonetaryValue format={formatMonthlySpendingGoal} value={data.remaining} />.
			</p>
		);
	}
	return (
		<p className="text-xs text-muted-foreground">
			Guarde{" "}
			<MaskedMonetaryValue
				className="text-foreground"
				format={formatMonthlySpendingGoal}
				value={data.perMonth ?? 0}
			/>{" "}
			por mês até {formatDeadline(data.targetDate)} ({data.monthsLeft}{" "}
			{data.monthsLeft === 1 ? "mês" : "meses"}).
		</p>
	);
}

function GoalRow({ goal }: { goal: Goal }) {
	const [panel, setPanel] = useState<"edit" | "contribute" | null>(null);
	const update = useUpdateGoal();
	const remove = useDeleteGoal();
	const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

	function toggle(next: "edit" | "contribute") {
		setPanel((current) => (current === next ? null : next));
	}

	return (
		<li className="space-y-3 py-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-medium">
						{goal.url ? (
							<a
								className="underline-offset-4 hover:underline"
								href={goal.url}
								rel="noopener noreferrer"
								target="_blank"
							>
								{goal.name}
							</a>
						) : (
							goal.name
						)}
					</p>
					<p className="text-xs text-muted-foreground">
						{goal.isCompleted ? "Concluída" : "Em andamento"}
						{goal.targetDate ? ` · prazo ${formatDeadline(goal.targetDate)}` : ""}
					</p>
				</div>
				<p className="shrink-0 text-right text-sm tabular-nums">
					<MaskedMonetaryValue format={formatMonthlySpendingGoal} value={goal.currentAmount} />
					<span className="block text-xs text-muted-foreground">
						de{" "}
						<MaskedMonetaryValue format={formatMonthlySpendingGoal} value={goal.targetAmount} />
					</span>
				</p>
			</div>
			<ProgressBar
				label={`${Math.round(percent)}% da meta ${goal.name}`}
				percent={percent}
			/>
			<PlanLine goal={goal} />
			<div className="flex flex-wrap gap-1">
				<Button onClick={() => toggle("contribute")} size="sm" variant="outline">
					Registrar aporte
				</Button>
				<Button onClick={() => toggle("edit")} size="sm" variant="ghost">
					Editar
				</Button>
				<Button
					disabled={update.isPending}
					onClick={() => update.mutate({ id: goal.id, isCompleted: !goal.isCompleted })}
					size="sm"
					variant="ghost"
				>
					{goal.isCompleted ? "Reabrir" : "Concluir"}
				</Button>
				<Button
					disabled={remove.isPending}
					onClick={async () => {
						if (!window.confirm(`Apagar a meta ${goal.name}? O histórico de aportes também some.`))
							return;
						try {
							await remove.mutateAsync(goal.id);
							toast.success("Meta apagada.");
						} catch {
							// Handled globally.
						}
					}}
					size="sm"
					variant="ghost"
				>
					Apagar
				</Button>
			</div>
			{panel === "edit" ? <GoalForm goal={goal} onDone={() => setPanel(null)} /> : null}
			{panel === "contribute" ? <ContributionPanel goal={goal} /> : null}
		</li>
	);
}

export function GoalsPage() {
	const goals = useGoals();
	const [adding, setAdding] = useState(false);

	return (
		<div className="grid min-w-0 gap-4 py-4 sm:gap-6 sm:py-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Metas</h1>
					<p className="max-w-[65ch] text-sm text-muted-foreground sm:text-base">
						Acompanhe o que você está juntando e quanto guardar por mês.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						nativeButton={false}
						render={<Link search={{ month: getMonthValue() }} to="/spending-goal" />}
						variant="outline"
					>
						Meta de gastos
					</Button>
					<Button onClick={() => setAdding((value) => !value)} variant={adding ? "outline" : "default"}>
						{adding ? "Fechar" : "Nova meta"}
					</Button>
				</div>
			</header>

			{adding ? <GoalForm onDone={() => setAdding(false)} /> : null}

			<Card className="financial-panel-border ring-0">
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-xl sm:text-2xl">Suas metas</CardTitle>
					<CardDescription>
						O aporte soma ao valor guardado. Não é uma saída do gasto do mês.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
					{goals.isPending ? (
						<ListSkeleton />
					) : goals.isError ? (
						<SectionError
							message={`Não foi possível carregar as metas. ${formatApiError(goals.error)}`}
							onRetry={() => goals.refetch()}
						/>
					) : goals.data.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Nenhuma meta ainda. Crie uma com valor e prazo para ver quanto guardar por mês.
						</p>
					) : (
						<ul className="divide-y divide-border/60 border-y border-border/60">
							{goals.data.map((goal) => (
								<GoalRow goal={goal} key={goal.id} />
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
