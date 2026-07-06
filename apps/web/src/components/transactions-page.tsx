"use client";

import { Badge } from "@vault/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
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
} from "lucide-react";
import { useMemo, useState } from "react";
import Loader from "@/components/loader";
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
	for (const exp of expenses) {
		const existing = groups.get(exp.expenseDate);
		if (existing) {
			existing.push(exp);
		} else {
			groups.set(exp.expenseDate, [exp]);
		}
	}
	return groups;
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
			filtered = filtered.filter((e) => e.category === categoryFilter);
		}
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(e) =>
					e.category.toLowerCase().includes(query) ||
					e.note?.toLowerCase().includes(query),
			);
		}
		return filtered;
	}, [expensesQuery.data, categoryFilter, searchQuery]);

	const groupedExpenses = useMemo(
		() => groupByDate(filteredExpenses),
		[filteredExpenses],
	);

	const totalSpent = useMemo(
		() => filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
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
		const options = [];
		const date = new Date();
		for (let i = 0; i < 6; i++) {
			const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
			const val = getMonthValue(d);
			const label = d.toLocaleDateString("pt-BR", {
				month: "short",
				year: "numeric",
			});
			options.push({ value: val, label });
		}
		return options;
	}, []);

	if (expensesQuery.isPending) {
		return <Loader />;
	}

	if (expensesQuery.isError) {
		return (
			<Card className="financial-panel-border ring-0">
				<CardHeader className="border-b">
					<CardDescription>Erro ao carregar</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						Não foi possível carregar as transações.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<MonetaryVisibilityProvider>
			<div className="grid gap-4">
				{/* Filters card */}
				<Card className="financial-panel-border ring-0">
					<CardHeader className="border-b">
						<div className="flex items-center justify-between gap-2">
							<CardDescription className="flex items-center gap-2 text-base">
								<FilterIcon className="size-4 text-muted-foreground" />
								Filtros
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-2">
								<Select
									value={selectedMonth}
									onValueChange={(v) => v && setSelectedMonth(v)}
								>
									<SelectTrigger className="rounded-md w-[160px]">
										<CalendarIcon className="mr-2 h-4 w-4" />
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{monthOptions.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select
									value={categoryFilter}
									onValueChange={(v) => v && setCategoryFilter(v)}
								>
									<SelectTrigger className="rounded-md w-[180px]">
										<SelectValue placeholder="Todas categorias" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todas categorias</SelectItem>
										{CATEGORIES.map((cat) => (
											<SelectItem key={cat} value={cat}>
												{cat}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="relative w-full sm:w-auto">
								<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									className="rounded-md pl-10 w-full sm:w-[280px]"
									placeholder="Buscar transações..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Summary cards */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Card className="financial-panel-border ring-0">
						<CardHeader className="border-b">
							<CardDescription className="text-base">
								Total gasto
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<ArrowDownIcon className="h-4 w-4 text-red-500" />
								<MaskedMonetaryValue
									className="text-2xl font-semibold text-red-500"
									format={formatBRLNegative}
									value={totalSpent}
									prefix="-R$"
								/>
							</div>
						</CardContent>
					</Card>

					<Card className="financial-panel-border ring-0">
						<CardHeader className="border-b">
							<CardDescription className="text-base">
								Orçamento diário
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<WalletIcon className="h-4 w-4 text-muted-foreground" />
								{overviewQuery.data ? (
									<MaskedMonetaryValue
										className="text-2xl font-semibold"
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
						<CardContent>
							<span className="text-2xl font-semibold">
								{filteredExpenses.length}
							</span>
							<span className="ml-2 text-sm text-muted-foreground">
								em {monthLabel}
							</span>
						</CardContent>
					</Card>
				</div>

				{/* Transaction list */}
				<Card className="financial-panel-border ring-0">
					<CardHeader className="border-b">
						<div className="flex items-center justify-between gap-2">
							<CardDescription className="flex items-center gap-2 text-base">
								<ReceiptTextIcon className="size-4 text-muted-foreground" />
								Extrato
							</CardDescription>
							<Tooltip>
								<TooltipTrigger
									render={
										<Info className="mt-0.5 size-4 text-muted-foreground" />
									}
								/>
								<TooltipContent>
									Despesas registradas no período selecionado
								</TooltipContent>
							</Tooltip>
						</div>
					</CardHeader>
					<CardContent>
						{groupedExpenses.size === 0 ? (
							<div className="py-12 text-center">
								<p className="text-muted-foreground">
									Nenhuma transação encontrada
								</p>
								<p className="text-sm text-muted-foreground/60">
									{searchQuery || categoryFilter !== "all"
										? "Tente ajustar os filtros"
										: "Adicione despesas para vê-las aqui"}
								</p>
							</div>
						) : (
							<div className="divide-y">
								{[...groupedExpenses.entries()]
									.sort((a, b) => b[0].localeCompare(a[0]))
									.map(([date, expenses]) => (
										<div key={date} className="py-4">
											<div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
												{formatFullDateBR(date)}
											</div>
											<div className="space-y-2">
												{expenses.map((exp) => (
													<div
														key={exp.id}
														className={cn(
															"flex items-center gap-3 rounded-lg px-3 py-2",
															"hover:bg-accent/50 transition-colors",
														)}
													>
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2">
																<p className="truncate text-sm font-medium">
																	{exp.note || "Despesa"}
																</p>
																<Badge
																	variant="outline"
																	className={cn(
																		"text-xs shrink-0",
																		getCategoryColor(exp.category),
																	)}
																>
																	{exp.category}
																</Badge>
															</div>
														</div>
														<div className="shrink-0 text-right">
															<p className="text-sm font-medium text-red-500">
																<MaskedMonetaryValue
																	format={formatBRLNegative}
																	value={Number(exp.amount)}
																	prefix="-R$"
																/>
															</p>
														</div>
													</div>
												))}
											</div>
										</div>
									))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</MonetaryVisibilityProvider>
	);
}
