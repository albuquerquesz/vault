"use client";

import { Badge } from "@vault/ui/components/badge";
import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@vault/ui/components/tooltip";
import { cn } from "@vault/ui/lib/utils";
import {
	ArrowDownIcon,
	CalendarIcon,
	FilterIcon,
	Info,
	ReceiptTextIcon,
	SearchIcon,
	WalletIcon,
	XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	MaskedMonetaryValue,
	MonetaryVisibilityProvider,
} from "@/components/monetary-visibility";
import {
	type FinanceExpense,
	getMonthValue,
	useFinanceExpenses,
	useFinanceMonthlyOverview,
} from "@/features/finance/sdk";

const CATEGORIES = [
	"Moradia",
	"Alimentação",
	"Transporte",
	"Saúde",
	"Lazer",
	"Outros",
];

const CATEGORY_COLORS: Record<string, string> = {
	Moradia: "bg-amber-500/10 text-amber-500 border-amber-500/20",
	Alimentação: "bg-orange-500/10 text-orange-500 border-orange-500/20",
	Transporte: "bg-blue-500/10 text-blue-500 border-blue-500/20",
	Saúde: "bg-red-500/10 text-red-500 border-red-500/20",
	Lazer: "bg-purple-500/10 text-purple-500 border-purple-500/20",
	Outros: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

function getCategoryColor(category: string) {
	return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Outros;
}

function formatBRL(value: number) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

function formatBRLNegative(value: number) {
	return `-${formatBRL(value).replace("-", "")}`;
}

function formatFullDateBR(isoDate: string): string {
	const date = new Date(`${isoDate}T12:00:00`);
	return date.toLocaleDateString("pt-BR", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function groupByDate(
	expenses: FinanceExpense[],
): Map<string, FinanceExpense[]> {
	const groups = new Map<string, FinanceExpense[]>();
	for (const expense of expenses) {
		const existing = groups.get(expense.expenseDate);
		if (existing) {
			existing.push(expense);
		} else {
			groups.set(expense.expenseDate, [expense]);
		}
	}
	return groups;
}

function sumExpenses(expenses: FinanceExpense[]) {
	return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

function TransactionsSkeleton() {
	return (
		<div className="grid gap-4">
			<Card className="financial-panel-border ring-0">
				<CardHeader className="border-b">
					<div className="flex items-center gap-2">
						<FilterIcon className="size-4 text-muted-foreground" />
						<CardDescription className="text-base">Filtros</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 md:grid-cols-[auto_auto_1fr_auto] md:items-center">
						<div className="h-10 w-full rounded-md border border-border/60 bg-muted/40 md:w-[160px]" />
						<div className="h-10 w-full rounded-md border border-border/60 bg-muted/40 md:w-[180px]" />
						<div className="h-10 w-full rounded-md border border-border/60 bg-muted/40 md:min-w-[240px]" />
						<div className="h-10 w-full rounded-md border border-border/60 bg-muted/40 md:w-[130px]" />
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4 sm:grid-cols-3">
				{Array.from({ length: 3 }).map((_, index) => (
					<Card key={`summary-skeleton-${index}`} className="financial-panel-border ring-0">
						<CardHeader className="border-b">
							<div className="h-4 w-28 rounded-md bg-muted/40" />
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="h-10 w-32 rounded-md bg-muted/40" />
							<div className="h-4 w-40 rounded-md bg-muted/40" />
						</CardContent>
					</Card>
				))}
			</div>

			<Card className="financial-panel-border ring-0">
				<CardHeader className="border-b">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<ReceiptTextIcon className="size-4 text-muted-foreground" />
							<CardDescription className="text-base">Extrato</CardDescription>
						</div>
						<div className="h-4 w-4 rounded-full bg-muted/40" />
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{Array.from({ length: 4 }).map((_, groupIndex) => (
						<div key={`transaction-group-${groupIndex}`} className="space-y-3">
							<div className="flex items-center justify-between gap-3">
								<div className="h-3 w-44 rounded bg-muted/40" />
								<div className="h-3 w-16 rounded bg-muted/40" />
							</div>
							<div className="space-y-2">
								{Array.from({ length: 3 }).map((__, rowIndex) => (
									<div
										key={`transaction-row-${groupIndex}-${rowIndex}`}
										className="rounded-lg border border-border/60 px-3 py-3"
									>
										<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
											<div className="space-y-2">
												<div className="h-4 w-44 rounded bg-muted/40" />
												<div className="h-4 w-20 rounded bg-muted/40" />
											</div>
											<div className="h-5 w-24 rounded bg-muted/40" />
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

export function TransactionsPage() {
	const currentMonth = useMemo(() => getMonthValue(), []);
	const [selectedMonth, setSelectedMonth] = useState(currentMonth);
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");

	const expensesQuery = useFinanceExpenses(selectedMonth);
	const overviewQuery = useFinanceMonthlyOverview(selectedMonth);

	const filteredExpenses = useMemo(() => {
		const data = expensesQuery.data;
		if (!data) return [];

		let filtered = [...data];
		if (categoryFilter !== "all") {
			filtered = filtered.filter((expense) => expense.category === categoryFilter);
		}

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(expense) =>
					expense.category.toLowerCase().includes(query) ||
					expense.note?.toLowerCase().includes(query),
			);
		}

		return filtered;
	}, [expensesQuery.data, categoryFilter, searchQuery]);

	const groupedExpenses = useMemo(
		() => groupByDate(filteredExpenses),
		[filteredExpenses],
	);

	const groupedDays = useMemo(
		() =>
			[...groupedExpenses.entries()]
				.sort((a, b) => b[0].localeCompare(a[0]))
				.map(([date, expenses]) => ({
					date,
					expenses,
					total: sumExpenses(expenses),
				})),
		[groupedExpenses],
	);

	const totalSpent = useMemo(
		() => filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
		[filteredExpenses],
	);

	const monthLabel = useMemo(() => {
		const date = new Date(`${selectedMonth}-01T12:00:00`);
		return date.toLocaleDateString("pt-BR", {
			month: "long",
			year: "numeric",
		});
	}, [selectedMonth]);

	const monthOptions = useMemo(() => {
		const options: Array<{ value: string; label: string }> = [];
		const date = new Date();
		for (let index = 0; index < 6; index++) {
			const next = new Date(date.getFullYear(), date.getMonth() - index, 1);
			const value = getMonthValue(next);
			const label = next.toLocaleDateString("pt-BR", {
				month: "short",
				year: "numeric",
			});
			options.push({ value, label });
		}
		return options;
	}, []);

	const hasActiveFilters =
		categoryFilter !== "all" || searchQuery.trim().length > 0;

	const clearFilters = () => {
		setCategoryFilter("all");
		setSearchQuery("");
	};

	if (expensesQuery.isPending) {
		return <TransactionsSkeleton />;
	}

	if (expensesQuery.isError) {
		return (
			<Card className="financial-panel-border ring-0">
				<CardHeader className="border-b">
					<CardDescription className="text-base">Erro ao carregar</CardDescription>
					<CardTitle className="text-2xl">Não foi possível abrir o extrato</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<p className="max-w-xl text-sm text-muted-foreground">
						As transações não puderam ser carregadas agora. Tente novamente para
						recarregar a lista deste mês.
					</p>
					<div>
						<Button onClick={() => void expensesQuery.refetch()}>
							Tentar novamente
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<MonetaryVisibilityProvider>
			<div className="grid gap-4 pt-6">
				<section className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
						Extrato e filtros do mês
					</h1>
				</section>

				<Card className="financial-panel-border ring-0">
					<CardHeader className="border-b">
						<div className="flex items-center gap-2">
							<FilterIcon className="size-4 text-muted-foreground" />
							<CardDescription className="text-base">Filtros</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 md:grid-cols-[auto_auto_minmax(0,1fr)_auto] md:items-center">
							<Select
								value={selectedMonth}
								onValueChange={(value) => value && setSelectedMonth(value)}
							>
								<SelectTrigger className="w-full rounded-md md:w-[160px]">
									<CalendarIcon className="mr-2 h-4 w-4" />
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{monthOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={categoryFilter}
								onValueChange={(value) => value && setCategoryFilter(value)}
							>
								<SelectTrigger className="w-full rounded-md md:w-[180px]">
									<SelectValue placeholder="Todas categorias" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todas categorias</SelectItem>
									{CATEGORIES.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<div className="relative min-w-0">
								<SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									aria-label="Buscar transações"
									className="w-full rounded-md pl-10"
									placeholder="Buscar por nota ou categoria"
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
								/>
							</div>

							<Button
								className="w-full md:w-auto"
								disabled={!hasActiveFilters}
								onClick={clearFilters}
								variant="outline"
							>
								<XIcon className="mr-2 size-4" />
								Limpar filtros
							</Button>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 sm:grid-cols-3">
					<Card className="financial-panel-border ring-0 sm:col-span-2">
						<CardHeader className="border-b">
							<CardDescription className="text-base">
								Total filtrado
							</CardDescription>
							<CardTitle className="text-3xl sm:text-4xl">
								<MaskedMonetaryValue
									format={formatBRLNegative}
									prefix="-R$"
									value={totalSpent}
								/>
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-3 sm:grid-cols-2 sm:items-end">
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground">
									{filteredExpenses.length} {filteredExpenses.length === 1 ? "lançamento" : "lançamentos"}
								</p>
								<p className="text-sm text-muted-foreground">
									{hasActiveFilters
										? `Filtrado em ${monthLabel}`
										: `Consolidado de ${monthLabel}`}
								</p>
							</div>
							<div className="flex items-center gap-2 justify-start sm:justify-end">
								<ArrowDownIcon className="size-4 text-red-500" />
								<span className="text-sm text-muted-foreground">
									Despesa registrada
								</span>
							</div>
						</CardContent>
					</Card>

					<Card className="financial-panel-border ring-0">
						<CardHeader className="border-b">
							<CardDescription className="text-base">
								Orçamento diário
							</CardDescription>
						</CardHeader>
						<CardContent className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-2">
								<WalletIcon className="size-4 text-muted-foreground" />
								{overviewQuery.data ? (
									<MaskedMonetaryValue
										className="text-2xl font-semibold tabular-nums"
										format={formatBRL}
										value={overviewQuery.data.dailyCap}
									/>
								) : (
									<span className="text-2xl font-semibold text-muted-foreground">
										—
									</span>
								)}
							</div>
						</CardContent>
					</Card>

					<Card className="financial-panel-border ring-0">
						<CardHeader className="border-b">
							<CardDescription className="text-base">
								Transações
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-1">
							<p className="text-2xl font-semibold tabular-nums">
								{filteredExpenses.length}
							</p>
							<p className="text-sm text-muted-foreground">itens neste mês</p>
						</CardContent>
					</Card>
				</div>

				<Card className="financial-panel-border ring-0">
					<CardHeader className="border-b">
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<ReceiptTextIcon className="size-4 text-muted-foreground" />
									<CardDescription className="text-base">Extrato</CardDescription>
								</div>
								<p className="max-w-2xl text-sm text-muted-foreground">
									Linha do tempo agrupada por dia, com cada lançamento visível
									no contexto do período selecionado.
								</p>
							</div>
							<Tooltip>
								<TooltipTrigger
									render={() => <Info className="mt-0.5 size-4 text-muted-foreground" />}
								/>
								<TooltipContent>
									Despesas registradas no período selecionado
								</TooltipContent>
							</Tooltip>
						</div>
					</CardHeader>
					<CardContent>
						{groupedDays.length === 0 ? (
							<div className="grid gap-3 py-12 text-center">
								<p className="text-sm font-medium text-foreground">
									{hasActiveFilters
										? "Nenhum resultado para esses filtros"
										: "Nenhuma transação encontrada"}
								</p>
								<p className="max-w-md justify-self-center text-sm text-muted-foreground">
									{hasActiveFilters
										? "Tente limpar a busca ou trocar a categoria para expandir a lista."
										: "Adicione despesas para ver o extrato consolidado deste mês aqui."}
								</p>
								{hasActiveFilters ? (
									<div>
										<Button onClick={clearFilters} variant="outline">
											Limpar filtros
										</Button>
									</div>
								) : null}
							</div>
						) : (
							<div className="space-y-5">
								{groupedDays.map((group) => (
									<section key={group.date} className="space-y-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="space-y-1">
												<h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
													{formatFullDateBR(group.date)}
												</h2>
												<p className="text-sm text-muted-foreground">
													{group.expenses.length}{" "}
													{group.expenses.length === 1 ? "lançamento" : "lançamentos"}
												</p>
											</div>
											<div className="flex items-center gap-2 text-sm tabular-nums text-muted-foreground">
												<span className="hidden sm:inline">Subtotal</span>
												<span className="font-medium text-foreground">
													<MaskedMonetaryValue
														format={formatBRLNegative}
														prefix="-R$"
														value={group.total}
													/>
												</span>
											</div>
										</div>

										<div className="divide-y overflow-hidden rounded-xl border border-border/60">
											{group.expenses.map((expense) => (
												<div
													key={expense.id}
													className={cn(
														"grid gap-3 px-3 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_auto]",
														"hover:bg-accent/40",
													)}
												>
													<div className="min-w-0 space-y-2">
														<div className="flex flex-wrap items-center gap-2">
															<p className="min-w-0 truncate text-sm font-medium text-foreground">
																{expense.note || "Despesa"}
															</p>
															<Badge
																variant="outline"
																className={cn(
																	"shrink-0 text-xs",
																	getCategoryColor(expense.category),
																)}
															>
																{expense.category}
															</Badge>
														</div>
														<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
															<span className="tabular-nums">
																{formatBRL(Number(expense.amount))}
															</span>
															<span className="hidden sm:inline">•</span>
															<span>{formatFullDateBR(expense.expenseDate)}</span>
														</div>
													</div>
													<div className="flex items-start justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
														<p className="text-base font-semibold leading-tight tabular-nums text-red-500 sm:text-right">
															<MaskedMonetaryValue
																format={formatBRLNegative}
																prefix="-R$"
																value={Number(expense.amount)}
															/>
														</p>
													</div>
												</div>
											))}
										</div>
									</section>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</MonetaryVisibilityProvider>
	);
}
