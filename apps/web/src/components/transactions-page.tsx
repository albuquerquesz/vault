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
import { PageContent } from "@/components/page-content";
import { getMonthValue, useFinanceExpenses } from "@/features/finance/sdk";
import { buildDailyChartData } from "./transactions-page/build-daily-chart-data";
import { TransactionsFilters } from "./transactions-page/transactions-filters";
import { TransactionsSkeleton } from "./transactions-page/transactions-skeleton";
import { TransactionsSpendChart } from "./transactions-page/transactions-spend-chart";
import { TransactionsTable } from "./transactions-page/transactions-table";
import type {
	TransactionsActiveFilterChip,
	TransactionsMonthOption,
} from "./transactions-page/utils";

export function TransactionsPage() {
	const currentMonth = useMemo(() => getMonthValue(), []);
	const [selectedMonth, setSelectedMonth] = useState(currentMonth);
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");

	const expensesQuery = useFinanceExpenses(selectedMonth);

	const filteredExpenses = useMemo(() => {
		const data = expensesQuery.data;
		if (!data) return [];

		let filtered = [...data];
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
	}, [expensesQuery.data, categoryFilter, searchQuery]);

	const chartData = useMemo(
		() => buildDailyChartData(selectedMonth, filteredExpenses),
		[selectedMonth, filteredExpenses],
	);

	const categories = useMemo(() => {
		const values = new Set(
			(expensesQuery.data ?? [])
				.map((expense) => expense.category?.trim())
				.filter((category): category is string => Boolean(category)),
		);

		return Array.from(values).sort((left, right) =>
			left.localeCompare(right, "pt-BR"),
		);
	}, [expensesQuery.data]);

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
			<PageContent className="pt-6">
				<TransactionsSkeleton />
			</PageContent>
		);
	}

	if (expensesQuery.isError) {
		return (
			<PageContent className="pt-6">
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
			</PageContent>
		);
	}

	return (
		<MonetaryVisibilityProvider>
			<PageContent className="grid gap-3 pt-6">
				<div className="flex flex-col gap-4">
					<TransactionsFilters
						selectedMonth={selectedMonth}
						onSelectedMonthChange={setSelectedMonth}
						monthOptions={monthOptions}
						categoryFilter={categoryFilter}
						onCategoryFilterChange={setCategoryFilter}
						categories={categories}
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						hasActiveFilters={hasActiveFilters}
						activeFilterChips={activeFilterChips}
						onClearFilters={clearFilters}
					/>

					<TransactionsSpendChart data={chartData} />

					<TransactionsTable
						expenses={filteredExpenses}
						hasActiveFilters={hasActiveFilters}
						month={selectedMonth}
						monthLabel={monthLabel}
						activeFilterChips={activeFilterChips}
						onClearFilters={clearFilters}
					/>
				</div>
			</PageContent>
		</MonetaryVisibilityProvider>
	);
}
