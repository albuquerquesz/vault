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
import { Skeleton } from "@vault/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@vault/ui/components/tabs";
import { cn } from "@vault/ui/lib/utils";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { MaskedMonetaryText, MaskedMonetaryValue } from "@/components/monetary-visibility";
import {
	formatMonthlySpendingGoal,
	maskMonthlySpendingGoalInput,
	parseMonthlySpendingGoalInput,
} from "@/components/monthly-spending-goal-utils";
import { buildFinanceMonthOptions } from "@/components/shared/finance-month-options";
import { FinanceMonthSelect } from "@/components/shared/finance-month-select";
import {
	type CategoryEntry,
	type CategoryRuleInput,
	type RuleMatchType,
	type RulePreview,
	useCategoryCatalog,
	useCategoryLimits,
	useCategoryRules,
	useCopyCategoryLimits,
	useCreateCategory,
	useCreateCategoryRule,
	useCreateTag,
	useDeleteCategory,
	useDeleteCategoryLimit,
	useDeleteCategoryRule,
	useDeleteTag,
	usePreviewCategoryRule,
	useRenameCategory,
	useTags,
	useUpsertCategoryLimit,
} from "@/features/finance/categories-sdk";
import { getMonthValue } from "@/features/finance/sdk";
import { formatApiError } from "@/utils/api";

const MATCH_LABEL: Record<RuleMatchType, string> = {
	contains: "contém",
	starts_with: "começa com",
	equals: "é igual a",
};

function previousMonth(month: string) {
	const [year, monthNumber] = month.split("-").map(Number);
	return getMonthValue(new Date(year, monthNumber - 2, 1));
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
	return (
		<div className="space-y-3">
			<p className="text-sm text-destructive" role="alert">
				{message}
			</p>
			<Button onClick={onRetry} size="sm" variant="outline">
				Tentar de novo
			</Button>
		</div>
	);
}

function ListSkeleton() {
	return (
		<div aria-busy="true" className="space-y-3">
			<Skeleton className="h-12 w-full" />
			<Skeleton className="h-12 w-full" />
			<Skeleton className="h-12 w-full" />
		</div>
	);
}

/** Expense category names for the suggestion lists. */
function useCategoryNames() {
	const catalog = useCategoryCatalog();
	return useMemo(() => {
		const names = new Set<string>();
		for (const entry of catalog.data ?? []) {
			if (entry.kind === "expense" && !entry.archived) names.add(entry.category);
		}
		return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
	}, [catalog.data]);
}

function CategoryInput({
	id,
	value,
	onChange,
	names,
	placeholder = "Categoria",
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	names: string[];
	placeholder?: string;
}) {
	const listId = `${id}-list`;
	return (
		<>
			<Input
				autoComplete="off"
				id={id}
				list={listId}
				maxLength={64}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				value={value}
			/>
			<datalist id={listId}>
				{names.map((name) => (
					<option key={name} value={name} />
				))}
			</datalist>
		</>
	);
}

// --- Limits ---

function LimitsSection({ names }: { names: string[] }) {
	const [month, setMonth] = useState(getMonthValue());
	const monthOptions = useMemo(() => buildFinanceMonthOptions(), []);
	const limits = useCategoryLimits(month);
	const upsert = useUpsertCategoryLimit(month);
	const remove = useDeleteCategoryLimit(month);
	const copy = useCopyCategoryLimits();
	const [category, setCategory] = useState("");
	const [amount, setAmount] = useState("");
	const formId = useId();

	async function save(name: string, value: string) {
		const targetAmount = parseMonthlySpendingGoalInput(value);
		if (!name.trim()) {
			toast.error("Informe a categoria.");
			return false;
		}
		if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
			toast.error("Informe um limite maior que zero.");
			return false;
		}
		try {
			await upsert.mutateAsync({ category: name.trim(), targetAmount });
			toast.success("Limite salvo.");
			return true;
		} catch {
			return false;
		}
	}

	async function copyFromPrevious() {
		try {
			const result = await copy.mutateAsync({
				fromMonth: previousMonth(month),
				toMonth: month,
			});
			toast.success(
				result.copied === 0
					? "Nada para copiar do mês anterior."
					: `${result.copied} ${result.copied === 1 ? "limite copiado" : "limites copiados"}.`,
			);
		} catch {
			// The global mutation handler shows the error.
		}
	}

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
				<div className="space-y-1">
					<CardTitle className="text-xl sm:text-2xl">Limite por categoria</CardTitle>
					<CardDescription>
						Defina quanto quer gastar em cada categoria no mês e acompanhe o uso.
					</CardDescription>
				</div>
				<FinanceMonthSelect onValueChange={setMonth} options={monthOptions} value={month} />
			</CardHeader>
			<CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
				<form
					className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end"
					onSubmit={async (event) => {
						event.preventDefault();
						if (await save(category, amount)) {
							setCategory("");
							setAmount("");
						}
					}}
				>
					<div className="space-y-2">
						<Label htmlFor={`${formId}-category`}>Categoria</Label>
						<CategoryInput
							id={`${formId}-category`}
							names={names}
							onChange={setCategory}
							value={category}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={`${formId}-amount`}>Limite do mês</Label>
						<Input
							id={`${formId}-amount`}
							inputMode="decimal"
							onChange={(event) =>
								setAmount(maskMonthlySpendingGoalInput(event.target.value))
							}
							placeholder="R$ 0,00"
							value={amount}
						/>
					</div>
					<Button disabled={upsert.isPending} type="submit">
						{upsert.isPending ? "Salvando..." : "Definir limite"}
					</Button>
				</form>

				{limits.isPending ? (
					<ListSkeleton />
				) : limits.isError ? (
					<SectionError
						message={`Não foi possível carregar os limites. ${formatApiError(limits.error)}`}
						onRetry={() => limits.refetch()}
					/>
				) : limits.data.limits.length === 0 ? (
					<div className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Nenhum limite definido para este mês.
						</p>
						<Button
							disabled={copy.isPending}
							onClick={copyFromPrevious}
							size="sm"
							variant="outline"
						>
							Copiar limites do mês anterior
						</Button>
					</div>
				) : (
					<ul className="divide-y divide-border/60 border-y border-border/60">
						{limits.data.limits.map((limit) => (
							<LimitRow
								key={limit.category}
								limit={limit}
								onRemove={async () => {
									if (!window.confirm(`Remover o limite de ${limit.category}?`)) return;
									try {
										await remove.mutateAsync(limit.category);
										toast.success("Limite removido.");
									} catch {
										// Handled globally.
									}
								}}
								onSave={(value) => save(limit.category, value)}
							/>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}

function LimitRow({
	limit,
	onSave,
	onRemove,
}: {
	limit: { category: string; targetAmount: number; spent: number; remaining: number; percentUsed: number; isOver: boolean };
	onSave: (value: string) => Promise<boolean>;
	onRemove: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [value, setValue] = useState("");
	const percent = Math.min(Math.max(limit.percentUsed, 0), 100);

	return (
		<li className="space-y-2 py-3">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-medium">{limit.category}</p>
					<p className="text-xs text-muted-foreground">
						<MaskedMonetaryText>{formatMonthlySpendingGoal(limit.spent)}</MaskedMonetaryText> de{" "}
						<MaskedMonetaryText>{formatMonthlySpendingGoal(limit.targetAmount)}</MaskedMonetaryText>
					</p>
				</div>
				<div className="flex shrink-0 gap-1">
					<Button
						onClick={() => {
							setValue(formatMonthlySpendingGoal(limit.targetAmount));
							setEditing((current) => !current);
						}}
						size="sm"
						variant="ghost"
					>
						Editar
					</Button>
					<Button onClick={onRemove} size="sm" variant="ghost">
						Remover
					</Button>
				</div>
			</div>
			<div
				aria-label={`${Math.round(limit.percentUsed)}% do limite de ${limit.category} usado`}
				aria-valuemax={100}
				aria-valuemin={0}
				aria-valuenow={Math.round(percent)}
				className="h-1.5 w-full overflow-hidden bg-muted"
				role="progressbar"
			>
				<div
					className={cn("h-full", limit.isOver ? "bg-destructive" : "bg-foreground/70")}
					style={{ width: `${percent}%` }}
				/>
			</div>
			<p className={cn("text-xs", limit.isOver ? "text-destructive" : "text-muted-foreground")}>
				{Math.round(limit.percentUsed)}% usado ·{" "}
				{limit.isOver ? (
					<>
						acima em{" "}
						<MaskedMonetaryText>
							{formatMonthlySpendingGoal(Math.abs(limit.remaining))}
						</MaskedMonetaryText>
					</>
				) : (
					<>
						restam{" "}
						<MaskedMonetaryText>{formatMonthlySpendingGoal(limit.remaining)}</MaskedMonetaryText>
					</>
				)}
			</p>
			{editing ? (
				<form
					className="flex gap-2"
					onSubmit={async (event) => {
						event.preventDefault();
						if (await onSave(value)) setEditing(false);
					}}
				>
					<Input
						aria-label={`Novo limite de ${limit.category}`}
						inputMode="decimal"
						onChange={(event) => setValue(maskMonthlySpendingGoalInput(event.target.value))}
						value={value}
					/>
					<Button size="sm" type="submit">
						Salvar
					</Button>
				</form>
			) : null}
		</li>
	);
}

// --- Rules ---

function RulesSection({ names }: { names: string[] }) {
	const rules = useCategoryRules();
	const create = useCreateCategoryRule();
	const remove = useDeleteCategoryRule();
	const previewRule = usePreviewCategoryRule();
	const [matchType, setMatchType] = useState<RuleMatchType>("contains");
	const [pattern, setPattern] = useState("");
	const [category, setCategory] = useState("");
	const [preview, setPreview] = useState<RulePreview | null>(null);
	const formId = useId();

	function candidate(): CategoryRuleInput | null {
		if (!pattern.trim() || !category.trim()) {
			toast.error("Informe o texto da descrição e a categoria.");
			return null;
		}
		return { matchType, pattern: pattern.trim(), category: category.trim() };
	}

	async function runPreview() {
		const input = candidate();
		if (!input) return;
		try {
			setPreview(await previewRule.mutateAsync(input));
		} catch {
			// Handled globally.
		}
	}

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		const input = candidate();
		if (!input) return;
		try {
			await create.mutateAsync(input);
			toast.success("Regra criada e aplicada.");
			setPattern("");
			setCategory("");
			setPreview(null);
		} catch {
			// Handled globally.
		}
	}

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="p-4 sm:p-6">
				<CardTitle className="text-xl sm:text-2xl">Regras automáticas</CardTitle>
				<CardDescription>
					Quando a descrição de uma transação bater com a regra, ela entra na categoria
					escolhida. As regras valem pela ordem da lista; o que você categorizou à mão
					não muda.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
				<form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[11rem_1fr_1fr]" onSubmit={submit}>
					<div className="space-y-2">
						<Label htmlFor={`${formId}-type`}>Quando a descrição</Label>
						<Select
							onValueChange={(next) => {
								if (next) {
									setMatchType(next as RuleMatchType);
									setPreview(null);
								}
							}}
							value={matchType}
						>
							<SelectTrigger className="w-full" id={`${formId}-type`}>
								<SelectValue>{(selected) => MATCH_LABEL[selected as RuleMatchType]}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{(Object.keys(MATCH_LABEL) as RuleMatchType[]).map((type) => (
									<SelectItem key={type} value={type}>
										{MATCH_LABEL[type]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor={`${formId}-pattern`}>Texto</Label>
						<Input
							id={`${formId}-pattern`}
							maxLength={100}
							onChange={(event) => {
								setPattern(event.target.value);
								setPreview(null);
							}}
							placeholder="Ex.: mercado"
							value={pattern}
						/>
					</div>
					<div className="space-y-2 sm:col-span-2 lg:col-span-1">
						<Label htmlFor={`${formId}-category`}>Categoria</Label>
						<CategoryInput
							id={`${formId}-category`}
							names={names}
							onChange={(value) => {
								setCategory(value);
								setPreview(null);
							}}
							value={category}
						/>
					</div>
					<div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
						<Button
							disabled={previewRule.isPending}
							onClick={runPreview}
							type="button"
							variant="outline"
						>
							{previewRule.isPending ? "Calculando..." : "Pré-visualizar"}
						</Button>
						<Button disabled={create.isPending} type="submit">
							{create.isPending ? "Criando..." : "Criar regra"}
						</Button>
					</div>
				</form>

				{preview ? (
					<div aria-live="polite" className="space-y-3 border bg-muted/30 p-4">
						<p className="text-sm">
							{preview.matched === 0
								? "Nenhuma transação bate com essa regra."
								: `${preview.matched} ${preview.matched === 1 ? "transação bate" : "transações batem"} com a regra; ${preview.wouldChange} ${preview.wouldChange === 1 ? "mudaria" : "mudariam"} de categoria.`}
						</p>
						{preview.examples.length > 0 ? (
							<ul className="divide-y divide-border/60 text-sm">
								{preview.examples.map((example) => (
									<li
										className="flex items-center justify-between gap-3 py-2"
										key={example.id}
									>
										<div className="min-w-0">
											<p className="truncate">{example.description}</p>
											<p className="text-xs text-muted-foreground">
												{example.date.slice(8, 10)}/{example.date.slice(5, 7)} · hoje em{" "}
												{example.currentCategory}
											</p>
										</div>
										<span className="shrink-0 tabular-nums">
											<MaskedMonetaryValue
												format={formatMonthlySpendingGoal}
												value={example.amount}
											/>
										</span>
									</li>
								))}
							</ul>
						) : null}
					</div>
				) : null}

				{rules.isPending ? (
					<ListSkeleton />
				) : rules.isError ? (
					<SectionError
						message={`Não foi possível carregar as regras. ${formatApiError(rules.error)}`}
						onRetry={() => rules.refetch()}
					/>
				) : rules.data.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Nenhuma regra ainda. Crie a primeira acima.
					</p>
				) : (
					<ul className="divide-y divide-border/60 border-y border-border/60">
						{rules.data.map((rule) => (
							<li
								className="flex items-center justify-between gap-3 py-3 text-sm"
								key={rule.id}
							>
								<p className="min-w-0">
									Descrição {MATCH_LABEL[rule.matchType]}{" "}
									<span className="font-medium break-words">"{rule.pattern}"</span> vai para{" "}
									<span className="font-medium break-words">{rule.category}</span>
									{rule.enabled ? null : (
										<span className="text-muted-foreground"> (desativada)</span>
									)}
								</p>
								<Button
									disabled={remove.isPending}
									onClick={async () => {
										if (!window.confirm("Apagar esta regra?")) return;
										try {
											await remove.mutateAsync(rule.id);
											toast.success("Regra apagada.");
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
			</CardContent>
		</Card>
	);
}

// --- Categories and tags ---

function CategoryRow({
	entry,
	others,
}: {
	entry: CategoryEntry;
	others: string[];
}) {
	const rename = useRenameCategory();
	const remove = useDeleteCategory();
	const [mode, setMode] = useState<"idle" | "rename" | "delete">("idle");
	const [name, setName] = useState(entry.category);
	const [moveTo, setMoveTo] = useState("");

	async function submitRename(event: React.FormEvent) {
		event.preventDefault();
		if (!name.trim() || name.trim() === entry.category) {
			setMode("idle");
			return;
		}
		try {
			await rename.mutateAsync({ name: entry.category, newName: name.trim() });
			toast.success("Categoria renomeada.");
			setMode("idle");
		} catch {
			// Handled globally.
		}
	}

	async function submitDelete(event: React.FormEvent) {
		event.preventDefault();
		if (entry.count > 0 && !moveTo.trim()) {
			toast.error("Escolha a categoria que vai ficar com as transações.");
			return;
		}
		try {
			await remove.mutateAsync({
				name: entry.category,
				moveTo: entry.count > 0 ? moveTo.trim() : undefined,
			});
			toast.success("Categoria apagada.");
			setMode("idle");
		} catch {
			// Handled globally.
		}
	}

	return (
		<li className="space-y-2 py-3">
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-sm font-medium">{entry.category}</p>
					<p className="text-xs text-muted-foreground">
						{entry.count} {entry.count === 1 ? "transação" : "transações"}
						{entry.kind === "income" ? " · receita" : ""}
						{entry.archived ? " · arquivada" : ""}
					</p>
				</div>
				<div className="flex shrink-0 gap-1">
					<Button
						onClick={() => setMode(mode === "rename" ? "idle" : "rename")}
						size="sm"
						variant="ghost"
					>
						Renomear
					</Button>
					<Button
						onClick={() => setMode(mode === "delete" ? "idle" : "delete")}
						size="sm"
						variant="ghost"
					>
						Apagar
					</Button>
				</div>
			</div>
			{mode === "rename" ? (
				<form className="flex gap-2" onSubmit={submitRename}>
					<Input
						aria-label={`Novo nome para ${entry.category}`}
						maxLength={64}
						onChange={(event) => setName(event.target.value)}
						value={name}
					/>
					<Button disabled={rename.isPending} size="sm" type="submit">
						Salvar
					</Button>
				</form>
			) : null}
			{mode === "delete" ? (
				<form className="space-y-2" onSubmit={submitDelete}>
					{entry.count > 0 ? (
						<>
							<p className="text-xs text-muted-foreground">
								Esta categoria está em uso. As transações passam para a categoria que você
								escolher.
							</p>
							<CategoryInput
								id={`move-${entry.id ?? entry.category}`}
								names={others}
								onChange={setMoveTo}
								placeholder="Mover para..."
								value={moveTo}
							/>
						</>
					) : null}
					<Button disabled={remove.isPending} size="sm" type="submit" variant="destructive">
						Confirmar exclusão
					</Button>
				</form>
			) : null}
		</li>
	);
}

function CategoriesSection() {
	const catalog = useCategoryCatalog();
	const create = useCreateCategory();
	const [name, setName] = useState("");
	const formId = useId();
	const entries = useMemo(
		() =>
			(catalog.data ?? [])
				.filter((entry) => entry.kind === "expense" && (!entry.archived || entry.count > 0))
				.sort((a, b) => a.category.localeCompare(b.category, "pt-BR")),
		[catalog.data],
	);

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="p-4 sm:p-6">
				<CardTitle className="text-xl sm:text-2xl">Categorias</CardTitle>
				<CardDescription>
					Renomear atualiza todas as transações, regras e limites que usavam o nome antigo.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
				<form
					className="flex gap-2"
					onSubmit={async (event) => {
						event.preventDefault();
						if (!name.trim()) return;
						try {
							await create.mutateAsync(name.trim());
							toast.success("Categoria criada.");
							setName("");
						} catch {
							// Handled globally.
						}
					}}
				>
					<Label className="sr-only" htmlFor={`${formId}-name`}>
						Nova categoria
					</Label>
					<Input
						id={`${formId}-name`}
						maxLength={64}
						onChange={(event) => setName(event.target.value)}
						placeholder="Nova categoria"
						value={name}
					/>
					<Button disabled={create.isPending} type="submit">
						Criar
					</Button>
				</form>
				{catalog.isPending ? (
					<ListSkeleton />
				) : catalog.isError ? (
					<SectionError
						message={`Não foi possível carregar as categorias. ${formatApiError(catalog.error)}`}
						onRetry={() => catalog.refetch()}
					/>
				) : entries.length === 0 ? (
					<p className="text-sm text-muted-foreground">Nenhuma categoria ainda.</p>
				) : (
					<ul className="divide-y divide-border/60 border-y border-border/60">
						{entries.map((entry) => (
							<CategoryRow
								entry={entry}
								key={`${entry.category}-${entry.kind}`}
								others={entries
									.map((other) => other.category)
									.filter((other) => other !== entry.category)}
							/>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}

function TagsSection() {
	const tags = useTags();
	const create = useCreateTag();
	const remove = useDeleteTag();
	const [name, setName] = useState("");
	const formId = useId();

	return (
		<Card className="financial-panel-border ring-0">
			<CardHeader className="p-4 sm:p-6">
				<CardTitle className="text-xl sm:text-2xl">Tags</CardTitle>
				<CardDescription>
					Agrupam transações de várias categorias, como uma viagem. Apagar uma tag não
					apaga as transações.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
				<form
					className="flex gap-2"
					onSubmit={async (event) => {
						event.preventDefault();
						if (!name.trim()) return;
						try {
							await create.mutateAsync(name.trim());
							toast.success("Tag criada.");
							setName("");
						} catch {
							// Handled globally.
						}
					}}
				>
					<Label className="sr-only" htmlFor={`${formId}-name`}>
						Nova tag
					</Label>
					<Input
						id={`${formId}-name`}
						maxLength={48}
						onChange={(event) => setName(event.target.value)}
						placeholder="Nova tag"
						value={name}
					/>
					<Button disabled={create.isPending} type="submit">
						Criar
					</Button>
				</form>
				{tags.isPending ? (
					<ListSkeleton />
				) : tags.isError ? (
					<SectionError
						message={`Não foi possível carregar as tags. ${formatApiError(tags.error)}`}
						onRetry={() => tags.refetch()}
					/>
				) : tags.data.length === 0 ? (
					<p className="text-sm text-muted-foreground">Nenhuma tag ainda.</p>
				) : (
					<ul className="divide-y divide-border/60 border-y border-border/60">
						{tags.data.map((tag) => (
							<li className="flex items-center justify-between gap-3 py-3" key={tag.id}>
								<div className="min-w-0">
									<p className="truncate text-sm font-medium">{tag.name}</p>
									<p className="text-xs text-muted-foreground">
										{tag.transactions} {tag.transactions === 1 ? "transação" : "transações"}
									</p>
								</div>
								<Button
									disabled={remove.isPending}
									onClick={async () => {
										if (!window.confirm(`Apagar a tag ${tag.name}?`)) return;
										try {
											await remove.mutateAsync(tag.id);
											toast.success("Tag apagada.");
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
			</CardContent>
		</Card>
	);
}

export function CategoriesPage() {
	const names = useCategoryNames();

	return (
		<div className="grid min-w-0 gap-4 py-4 sm:gap-6 sm:py-6">
			<header className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Categorias</h1>
				<p className="max-w-[65ch] text-sm text-muted-foreground sm:text-base">
					Limites do mês, regras automáticas, categorias e tags.
				</p>
			</header>
			<Tabs defaultValue="limits">
				<TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
					<TabsTrigger value="limits">Limites</TabsTrigger>
					<TabsTrigger value="rules">Regras</TabsTrigger>
					<TabsTrigger value="catalog">Categorias e tags</TabsTrigger>
				</TabsList>
				<TabsContent className="mt-4" value="limits">
					<LimitsSection names={names} />
				</TabsContent>
				<TabsContent className="mt-4" value="rules">
					<RulesSection names={names} />
				</TabsContent>
				<TabsContent className="mt-4 grid gap-4 sm:gap-6" value="catalog">
					<CategoriesSection />
					<TagsSection />
				</TabsContent>
			</Tabs>
		</div>
	);
}
