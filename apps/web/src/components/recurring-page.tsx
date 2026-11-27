"use client";

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
import { cn } from "@vault/ui/lib/utils";
import { type FormEvent, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import {
	formatMonthlySpendingGoal,
	formatSpendingGoalMonth,
	maskMonthlySpendingGoalInput,
	parseMonthlySpendingGoalInput,
} from "@/components/monthly-spending-goal-utils";
import { formatShortDate, ListSkeleton, SectionError } from "@/components/shared/page-state";
import {
	type RecurringInput,
	type RecurringItem,
	type RecurringKind,
	type RecurringOccurrence,
	useAllRecurringItems,
	useCreateRecurring,
	useDeleteRecurring,
	useRecurringMonth,
	useSetRecurringPaid,
	useSubscriptions,
	useUpdateRecurring,
} from "@/features/finance/recurring-sdk";
import { getMonthValue } from "@/features/finance/sdk";
import { formatApiError } from "@/utils/api";

const KIND_LABEL: Record<RecurringKind, string> = {
	bill: "Conta fixa",
	income: "Receita recorrente",
};

const STATUS_LABEL = {
	expected: "Esperado",
	realized: "Já aconteceu",
	paid_manual: "Marcado como pago",
} as const;

function addMonths(month: string, delta: number) {
	const [year, monthNumber] = month.split("-").map(Number);
	const date = new Date(year, monthNumber - 1 + delta, 1);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function todayValue() {
	const now = new Date();
	return `${getMonthValue()}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Add or edit form. Editing changes the terms from `effectiveFrom` on. */
function RecurringForm({
	item,
	month,
	onDone,
}: {
	item?: RecurringItem;
	month: string;
	onDone: () => void;
}) {
	const formId = useId();
	const create = useCreateRecurring();
	const update = useUpdateRecurring();
	const [kind, setKind] = useState<RecurringKind>(item?.kind ?? "bill");
	const [name, setName] = useState(item?.name ?? "");
	const [amount, setAmount] = useState(
		item ? formatMonthlySpendingGoal(item.amount) : "",
	);
	const [day, setDay] = useState(String(item?.dayOfMonth ?? 5));
	const [category, setCategory] = useState(item?.category ?? "");
	const [matchText, setMatchText] = useState(item?.matchText ?? "");
	const [startMonth, setStartMonth] = useState(month);
	const [endMonth, setEndMonth] = useState("");
	const [effectiveFrom, setEffectiveFrom] = useState(month);
	const pending = create.isPending || update.isPending;

	async function submit(event: FormEvent) {
		event.preventDefault();
		const value = parseMonthlySpendingGoalInput(amount);
		const dayOfMonth = Number(day);
		if (!name.trim() || !category.trim()) return;
		if (!(value > 0)) {
			toast.error("Informe um valor maior que zero.");
			return;
		}
		if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
			toast.error("O dia do mês deve ficar entre 1 e 31.");
			return;
		}
		try {
			if (item) {
				await update.mutateAsync({
					id: item.id,
					name: name.trim(),
					amount: value,
					dayOfMonth,
					category: category.trim(),
					matchText: matchText.trim() || null,
					effectiveFrom,
				});
				toast.success("Item atualizado.");
			} else {
				const input: RecurringInput = {
					kind,
					name: name.trim(),
					amount: value,
					dayOfMonth,
					category: category.trim(),
					startMonth,
					endMonth: endMonth || null,
					matchText: matchText.trim() || null,
				};
				await create.mutateAsync(input);
				toast.success("Item cadastrado.");
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
			{item ? null : (
				<div className="space-y-2">
					<Label htmlFor={`${formId}-kind`}>Tipo</Label>
					<Select
						onValueChange={(next) => next && setKind(next as RecurringKind)}
						value={kind}
					>
						<SelectTrigger className="w-full" id={`${formId}-kind`}>
							<SelectValue>{(selected) => KIND_LABEL[selected as RecurringKind]}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{(Object.keys(KIND_LABEL) as RecurringKind[]).map((option) => (
								<SelectItem key={option} value={option}>
									{KIND_LABEL[option]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
			<div className="space-y-2">
				<Label htmlFor={`${formId}-name`}>Nome</Label>
				<Input
					id={`${formId}-name`}
					maxLength={128}
					onChange={(event) => setName(event.target.value)}
					placeholder={kind === "income" ? "Ex.: Salário" : "Ex.: Aluguel"}
					required
					value={name}
				/>
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
				<Label htmlFor={`${formId}-day`}>Dia do mês</Label>
				<Input
					id={`${formId}-day`}
					inputMode="numeric"
					max={31}
					min={1}
					onChange={(event) => setDay(event.target.value)}
					required
					type="number"
					value={day}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${formId}-category`}>Categoria</Label>
				<Input
					id={`${formId}-category`}
					maxLength={64}
					onChange={(event) => setCategory(event.target.value)}
					placeholder={kind === "income" ? "Ex.: Salário" : "Ex.: Moradia"}
					required
					value={category}
				/>
			</div>
			<div className="space-y-2 sm:col-span-2">
				<Label htmlFor={`${formId}-match`}>
					Texto para reconhecer a transação (opcional)
				</Label>
				<Input
					id={`${formId}-match`}
					maxLength={100}
					onChange={(event) => setMatchText(event.target.value)}
					placeholder="Ex.: imobiliaria"
					value={matchText}
				/>
			</div>
			{item ? (
				<div className="space-y-2">
					<Label htmlFor={`${formId}-from`}>Vale a partir de</Label>
					<Input
						id={`${formId}-from`}
						onChange={(event) => setEffectiveFrom(event.target.value)}
						required
						type="month"
						value={effectiveFrom}
					/>
				</div>
			) : (
				<>
					<div className="space-y-2">
						<Label htmlFor={`${formId}-start`}>Começa em</Label>
						<Input
							id={`${formId}-start`}
							onChange={(event) => setStartMonth(event.target.value)}
							required
							type="month"
							value={startMonth}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={`${formId}-end`}>Termina em (opcional)</Label>
						<Input
							id={`${formId}-end`}
							min={startMonth}
							onChange={(event) => setEndMonth(event.target.value)}
							type="month"
							value={endMonth}
						/>
					</div>
				</>
			)}
			<div className="flex gap-2 sm:col-span-2">
				<Button disabled={pending} type="submit">
					{pending ? "Salvando..." : item ? "Salvar" : "Cadastrar"}
				</Button>
				<Button onClick={onDone} type="button" variant="ghost">
					Cancelar
				</Button>
			</div>
		</form>
	);
}

function UpcomingCard({ occurrences }: { occurrences: RecurringOccurrence[] }) {
	const setPaid = useSetRecurringPaid();
	const today = todayValue();
	const upcoming = useMemo(
		() =>
			occurrences
				.filter((item) => item.status === "expected")
				.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
		[occurrences],
	);

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="p-4 sm:p-6">
				<CardTitle className="text-xl sm:text-2xl">Próximos vencimentos</CardTitle>
				<CardDescription>
					O que ainda não apareceu no banco, em ordem de data.
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
				{upcoming.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Nada pendente nos próximos dias.
					</p>
				) : (
					<ul className="divide-y divide-border/60 border-y border-border/60">
						{upcoming.map((item) => (
							<li
								className="flex items-center justify-between gap-3 py-2.5 text-sm"
								key={`${item.id}-${item.month}`}
							>
								<div className="min-w-0">
									<p className="truncate">{item.name}</p>
									<p
										className={cn(
											"text-xs text-muted-foreground",
											item.dueDate < today && item.kind === "bill" && "text-destructive",
										)}
									>
										{formatShortDate(item.dueDate)} · {KIND_LABEL[item.kind]}
										{item.dueDate < today ? " · atrasado" : ""}
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<span
										className={cn(
											"tabular-nums",
											item.kind === "income" ? "text-foreground" : "text-muted-foreground",
										)}
									>
										{item.kind === "income" ? "+" : "-"}
										<MaskedMonetaryValue
											format={formatMonthlySpendingGoal}
											value={item.amount}
										/>
									</span>
									<Button
										disabled={setPaid.isPending}
										onClick={() =>
											setPaid.mutate({ id: item.id, month: item.month, paid: true })
										}
										size="sm"
										variant="outline"
									>
										{item.kind === "income" ? "Recebido" : "Pago"}
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}

function ItemRow({
	item,
	occurrence,
	month,
}: {
	item: RecurringItem;
	occurrence?: RecurringOccurrence;
	month: string;
}) {
	const [editing, setEditing] = useState(false);
	const update = useUpdateRecurring();
	const remove = useDeleteRecurring();
	const setPaid = useSetRecurringPaid();
	const isEnded = item.endMonth !== null && item.endMonth < month;
	const isHandMarked = occurrence?.status === "paid_manual";

	async function end() {
		if (item.startMonth >= month) {
			toast.error("Este item começa neste mês. Apague-o ou edite o período.");
			return;
		}
		if (!window.confirm(`Encerrar ${item.name} a partir de ${formatSpendingGoalMonth(month)}?`))
			return;
		try {
			await update.mutateAsync({
				id: item.id,
				// Ending from this month on: the last valid month is the one before.
				endMonth: addMonths(month, -1),
			});
			toast.success("Item encerrado. O histórico foi mantido.");
		} catch {
			// Handled globally.
		}
	}

	async function reactivate() {
		try {
			await update.mutateAsync({ id: item.id, endMonth: null });
			toast.success("Item reativado.");
		} catch {
			// Handled globally.
		}
	}

	async function removeItem() {
		if (!window.confirm(`Apagar ${item.name}? Isso remove o item de vez.`)) return;
		try {
			await remove.mutateAsync(item.id);
			toast.success("Item apagado.");
		} catch {
			// Handled globally.
		}
	}

	return (
		<li className="space-y-3 py-3">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-medium">{item.name}</p>
					<p className="text-xs text-muted-foreground">
						{KIND_LABEL[item.kind]} · dia {item.dayOfMonth} · {item.category}
						{occurrence ? ` · ${STATUS_LABEL[occurrence.status]}` : ""}
					</p>
					<p className="text-xs text-muted-foreground">
						Desde {formatSpendingGoalMonth(item.startMonth)}
						{item.endMonth ? ` até ${formatSpendingGoalMonth(item.endMonth)}` : ""}
					</p>
				</div>
				<p className="shrink-0 text-sm tabular-nums">
					<MaskedMonetaryValue format={formatMonthlySpendingGoal} value={item.amount} />
				</p>
			</div>
			<div className="flex flex-wrap gap-1">
				{isEnded ? (
					<Button disabled={update.isPending} onClick={reactivate} size="sm" variant="outline">
						Reativar
					</Button>
				) : (
					<>
						{isHandMarked ? (
							<Button
								disabled={setPaid.isPending}
								onClick={() => setPaid.mutate({ id: item.id, month, paid: false })}
								size="sm"
								variant="ghost"
							>
								Desfazer marcação
							</Button>
						) : null}
						<Button onClick={() => setEditing((current) => !current)} size="sm" variant="ghost">
							Editar
						</Button>
						<Button disabled={update.isPending} onClick={end} size="sm" variant="ghost">
							Pausar (encerrar)
						</Button>
					</>
				)}
				<Button disabled={remove.isPending} onClick={removeItem} size="sm" variant="ghost">
					Apagar
				</Button>
			</div>
			{editing ? (
				<RecurringForm item={item} month={month} onDone={() => setEditing(false)} />
			) : null}
		</li>
	);
}

function Subscriptions() {
	const query = useSubscriptions();

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="p-4 sm:p-6">
				<CardTitle className="text-xl sm:text-2xl">Assinaturas detectadas</CardTitle>
				<CardDescription>
					Cobranças mensais que se repetem nas suas transações. Parcelas não entram aqui.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
				{query.isPending ? (
					<ListSkeleton />
				) : query.isError ? (
					<SectionError
						message={`Não foi possível carregar as assinaturas. ${formatApiError(query.error)}`}
						onRetry={() => query.refetch()}
					/>
				) : query.data.subscriptions.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Nenhuma assinatura detectada nos últimos {query.data.windowMonths} meses.
					</p>
				) : (
					<>
						<div>
							<p className="text-xs text-muted-foreground">Total por mês</p>
							<p className="text-xl font-medium tabular-nums sm:text-2xl">
								<MaskedMonetaryValue
									format={formatMonthlySpendingGoal}
									value={query.data.monthlyTotal}
								/>
							</p>
						</div>
						<ul className="divide-y divide-border/60 border-y border-border/60">
							{[...query.data.subscriptions]
								.sort((a, b) => a.nextExpectedDate.localeCompare(b.nextExpectedDate))
								.map((subscription) => (
									<li
										className="flex items-center justify-between gap-3 py-2.5 text-sm"
										key={`${subscription.name}-${subscription.accountName}`}
									>
										<div className="min-w-0">
											<p className="truncate">{subscription.name}</p>
											<p className="text-xs text-muted-foreground">
												Próxima cobrança em {formatShortDate(subscription.nextExpectedDate)}
												{subscription.confidence === "medium" ? " · a confirmar" : ""}
											</p>
										</div>
										<span className="shrink-0 tabular-nums">
											<MaskedMonetaryValue
												format={formatMonthlySpendingGoal}
												value={subscription.amount}
											/>
										</span>
									</li>
								))}
						</ul>
					</>
				)}
			</CardContent>
		</Card>
	);
}

export function RecurringPage() {
	const month = getMonthValue();
	const nextMonth = addMonths(month, 1);
	const current = useRecurringMonth(month);
	const next = useRecurringMonth(nextMonth);
	const all = useAllRecurringItems();
	const [adding, setAdding] = useState(false);

	const occurrences = useMemo(
		() => [...(current.data?.items ?? []), ...(next.data?.items ?? [])],
		[current.data, next.data],
	);
	const byItem = useMemo(
		() => new Map((current.data?.items ?? []).map((item) => [item.id, item])),
		[current.data],
	);
	const items = all.data?.items ?? [];
	const live = items.filter((item) => item.endMonth === null || item.endMonth >= month);
	const ended = items.filter((item) => item.endMonth !== null && item.endMonth < month);
	const summary = current.data?.summary;

	return (
		<div className="grid min-w-0 gap-4 py-4 sm:gap-6 sm:py-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Recorrências
					</h1>
					<p className="max-w-[65ch] text-sm text-muted-foreground sm:text-base">
						Contas fixas, receitas e assinaturas que se repetem todo mês.
					</p>
				</div>
				<Button onClick={() => setAdding((value) => !value)} variant={adding ? "outline" : "default"}>
					{adding ? "Fechar" : "Nova recorrência"}
				</Button>
			</header>

			{adding ? <RecurringForm month={month} onDone={() => setAdding(false)} /> : null}

			{summary ? (
				<Card className="financial-panel-border ring-0">
					<CardHeader className="p-4 sm:p-6">
						<CardTitle className="text-xl sm:text-2xl">
							{formatSpendingGoalMonth(month)}
						</CardTitle>
						<CardDescription>O que está cadastrado para este mês.</CardDescription>
					</CardHeader>
					<CardContent className="grid grid-cols-2 gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
						{[
							{ label: "Contas fixas", value: summary.billsPlanned },
							{ label: "Ainda a pagar", value: summary.billsPending },
							{ label: "Receitas previstas", value: summary.incomePlanned },
							{ label: "Ainda a receber", value: summary.incomePending },
						].map((entry) => (
							<div className="min-w-0 space-y-1" key={entry.label}>
								<p className="text-xs text-muted-foreground">{entry.label}</p>
								<p className="text-lg font-medium tabular-nums sm:text-2xl">
									<MaskedMonetaryValue format={formatMonthlySpendingGoal} value={entry.value} />
								</p>
							</div>
						))}
					</CardContent>
				</Card>
			) : null}

			{current.isError || next.isError ? (
				<Card className="financial-panel-border ring-0">
					<CardContent className="p-4 sm:p-6">
						<SectionError
							message={`Não foi possível carregar os vencimentos. ${formatApiError(current.error ?? next.error)}`}
							onRetry={() => {
								current.refetch();
								next.refetch();
							}}
						/>
					</CardContent>
				</Card>
			) : (
				<UpcomingCard occurrences={occurrences} />
			)}

			<Card className="financial-panel-border ring-0">
				<CardHeader className="p-4 sm:p-6">
					<CardTitle className="text-xl sm:text-2xl">Contas fixas e receitas</CardTitle>
					<CardDescription>
						Entram na projeção de saldo. Mudar o valor vale daqui para a frente; os
						meses passados ficam como estavam.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
					{all.isPending ? (
						<ListSkeleton />
					) : all.isError ? (
						<SectionError
							message={`Não foi possível carregar os itens. ${formatApiError(all.error)}`}
							onRetry={() => all.refetch()}
						/>
					) : live.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Nenhum item cadastrado. Cadastre aluguel, salário ou outra conta que se repete
							para o mês e a projeção ficarem mais fiéis.
						</p>
					) : (
						<ul className="divide-y divide-border/60 border-y border-border/60">
							{live.map((item) => (
								<ItemRow
									item={item}
									key={item.id}
									month={month}
									occurrence={byItem.get(item.id)}
								/>
							))}
						</ul>
					)}
				</CardContent>
			</Card>

			<Subscriptions />

			{ended.length > 0 ? (
				<Card className="financial-panel-border ring-0">
					<CardHeader className="p-4 sm:p-6">
						<CardTitle className="text-xl sm:text-2xl">Encerradas</CardTitle>
						<CardDescription>Ficam guardadas e podem ser reativadas.</CardDescription>
					</CardHeader>
					<CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
						<ul className="divide-y divide-border/60 border-y border-border/60">
							{ended.map((item) => (
								<ItemRow item={item} key={item.id} month={month} />
							))}
						</ul>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
