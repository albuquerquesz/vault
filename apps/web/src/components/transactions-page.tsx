"use client";

import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { useMemo, useState } from "react";
import { MonetaryVisibilityProvider } from "@/components/monetary-visibility";
import {
	type FinanceExpense,
	getMonthValue,
	useFinanceExpenses,
	useFinanceExpensesYear,
} from "@/features/finance/sdk";
import { buildYearChartData } from "./transactions-page/build-daily-chart-data";
import { TransactionsFilters } from "./transactions-page/transactions-filters";
import { TransactionsSkeleton } from "./transactions-page/transactions-skeleton";
import { TransactionsSpendChart } from "./transactions-page/transactions-spend-chart";
import { TransactionsTable } from "./transactions-page/transactions-table";
import type {
	TransactionsActiveFilterChip,
	TransactionsMonthOption,
} from "./transactions-page/utils";

function applyExpenseFilters(
	expenses: FinanceExpense[],
	categoryFilter: string,
	searchQuery: string,
): FinanceExpense[] {
	let filtered = [...expenses];
	if (categoryFilter !== "all") {
		filtered = filtered.filter(
			(expense) => expense.category === categoryFilter,
		);
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
}

export function TransactionsPage() {
	const currentMonth = useMemo(() => getMonthValue(), []);
	const [selectedMonth, setSelectedMonth] = useState(currentMonth);
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");

	const chartYear = useMemo(
		() => Number(selectedMonth.slice(0, 4)) || new Date().getFullYear(),
		[selectedMonth],
	);

	const expensesQuery = useFinanceExpenses(selectedMonth);
	const yearExpensesQuery = useFinanceExpensesYear(chartYear);

	const filteredExpenses = useMemo(() => {
		const data = expensesQuery.data;
		if (!data) return [];
		return applyExpenseFilters(data, categoryFilter, searchQuery);
	}, [expensesQuery.data, categoryFilter, searchQuery]);

	/** Area chart: full calendar year (default), still respects category/search. */
	const chartData = useMemo(() => {
		const yearExpenses = yearExpensesQuery.data ?? [];
		const filtered = applyExpenseFilters(
			yearExpenses,
			categoryFilter,
			searchQuery,
		);
		return buildYearChartData(chartYear, filtered);
	}, [yearExpensesQuery.data, categoryFilter, searchQuery, chartYear]);

	const categories = useMemo(() => {
		const source = yearExpensesQuery.data ?? expensesQuery.data ?? [];
		const values = new Set(
			source
				.map((expense) => expense.category?.trim())
				.filter((category): category is string => Boolean(category)),
		);

		return Array.from(values).sort((left, right) =>
			left.localeCompare(right, "pt-BR"),
		);
	}, [yearExpensesQuery.data, expensesQuery.data]);

	const monthLabel = useMemo(() => {
		const date = new Date(`${selectedMonth}-01T12:00:00`);
		return date.toLocaleDateString("pt-BR", {
			month: "long",
			year: "numeric",
		});
	}, [selectedMonth]);

	const monthOptions = useMemo(() => {
		const options: TransactionsMonthOption[] = [];
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

	const activeFilterChips = useMemo(() => {
		const chips: TransactionsActiveFilterChip[] = [];
		if (categoryFilter !== "all") {
			chips.push({
				label: `Categoria: ${categoryFilter}`,
				onRemove: () => setCategoryFilter("all"),
			});
		}
		if (searchQuery.trim()) {
			chips.push({
				label: `Busca: ${searchQuery.trim()}`,
				onRemove: () => setSearchQuery(""),
			});
		}
		return chips;
	}, [categoryFilter, searchQuery]);

	const clearFilters = () => {
		setCategoryFilter("all");
		setSearchQuery("");
	};

	if (expensesQuery.isPending) {
		return (
			<div className="w-full min-w-0 pt-6">
				<TransactionsSkeleton />
			</div>
		);
	}

	if (expensesQuery.isError) {
		return (
			<div className="w-full min-w-0 pt-6">
				<Card className="financial-panel-border ring-0">
					<CardHeader className="border-b">
						<CardDescription className="text-base">
							Erro ao carregar
						</CardDescription>
						<CardTitle className="text-2xl">
							Não foi possível abrir o extrato
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<p className="max-w-xl text-sm text-muted-foreground">
							As transações não puderam ser carregadas agora. Tente novamente
							para recarregar a lista deste mês.
						</p>
						<div>
							<Button onClick={() => void expensesQuery.refetch()}>
								Tentar novamente
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<MonetaryVisibilityProvider>
			{/* Full width like overview — no max-w-[1200px] PageContent cap */}
			<div className="grid w-full min-w-0 gap-4 pt-6">
				<Card className="financial-panel-border w-full min-w-0 gap-0 rounded-none ring-0">
					<CardContent className="flex flex-col gap-4 p-3 sm:p-4">
						<TransactionsFilters
							selectedMonth={selectedMonth}
							onSelectedMonthChange={setSelectedMonth}
							monthOptions={monthOptions}
							categoryFilter={categoryFilter}
							onCategoryFilterChange={setCategoryFilter}
							categories={categories}
							searchQuery={searchQuery}
							onSearchQueryChange={setSearchQuery}
							activeFilterChips={activeFilterChips}
						/>

						<TransactionsSpendChart data={chartData} />
					</CardContent>
				</Card>

				<div className="min-w-0">
					<TransactionsTable
						expenses={filteredExpenses}
						hasActiveFilters={hasActiveFilters}
						month={selectedMonth}
						monthLabel={monthLabel}
						activeFilterChips={activeFilterChips}
						onClearFilters={clearFilters}
					/>
				</div>
			</div>
		</MonetaryVisibilityProvider>
	);
}
