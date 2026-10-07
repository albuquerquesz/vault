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
import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { getMonthValue, useFinanceTransactions } from "@/features/finance/sdk";
import { TransactionsCategoryBarChart } from "./transactions-page/transactions-category-bar-chart";
import { TransactionsFilterMenu } from "./transactions-page/transactions-filter-menu";
import { TransactionsPeriodStats } from "./transactions-page/transactions-period-stats";
import { TransactionsSkeleton } from "./transactions-page/transactions-skeleton";
import { TransactionsTable } from "./transactions-page/transactions-table";
import { CreateTransactionSheet } from "./transactions-page/create-transaction-sheet";
import {
	applyTransactionFilters,
	buildPeriodStats,
	EMPTY_TRANSACTIONS_FILTERS,
	filterLastNDays,
	getPreviousMonthValue,
	hasActiveTransactionFilters,
	type TransactionsFilters,
} from "./transactions-page/utils";

export function TransactionsPage() {
	const selectedMonth = useMemo(() => getMonthValue(), []);
	const previousMonth = useMemo(
		() => getPreviousMonthValue(selectedMonth),
		[selectedMonth],
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [appliedFilters, setAppliedFilters] = useState<TransactionsFilters>(
		EMPTY_TRANSACTIONS_FILTERS,
	);

	const transactionsQuery = useFinanceTransactions(selectedMonth);
	const previousMonthQuery = useFinanceTransactions(previousMonth);

	const transactions = transactionsQuery.data ?? [];

	const filteredTransactions = useMemo(() => {
		let next = applyTransactionFilters(transactions, appliedFilters);

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			next = next.filter(
				(transaction) =>
					transaction.category.toLowerCase().includes(query) ||
					transaction.description?.toLowerCase().includes(query),
			);
		}

		return next;
	}, [transactions, appliedFilters, searchQuery]);

	const periodStats = useMemo(() => {
		const merged = [
			...(previousMonthQuery.data ?? []),
			...(transactionsQuery.data ?? []),
		];
		return buildPeriodStats(filterLastNDays(merged, 30));
	}, [transactionsQuery.data, previousMonthQuery.data]);

	const monthLabel = useMemo(() => {
		const date = new Date(`${selectedMonth}-01T12:00:00`);
		return date.toLocaleDateString("pt-BR", {
			month: "long",
			year: "numeric",
		});
	}, [selectedMonth]);

	const hasActiveFilters =
		searchQuery.trim().length > 0 ||
		hasActiveTransactionFilters(appliedFilters);

	if (transactionsQuery.isPending) {
		return (
			<div className="w-full min-w-0 pt-6">
				<TransactionsSkeleton />
			</div>
		);
	}

	if (transactionsQuery.isError) {
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
							<Button onClick={() => void transactionsQuery.refetch()}>
								Tentar novamente
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Full width like overview — no max-w-[1200px] PageContent cap.
	return (
		<div className="w-full min-w-0 overflow-x-clip pt-4 sm:pt-6 md:overflow-x-visible">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div className="min-w-0">
					<h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">Transações</h1>
				</div>
				<CreateTransactionSheet month={selectedMonth} />
			</div>
			<div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
			<div className="flex min-w-0 flex-col gap-4">
				<div className="flex w-full min-w-0 flex-col items-stretch gap-3 p-4 sm:gap-4">
					<div className="flex w-full min-w-0 items-center gap-2">
						<div className="relative min-w-0 flex-1">
							<SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								aria-label="Buscar transações"
								className="min-h-11 w-full rounded-md border-border/70 !bg-transparent pl-10 shadow-none dark:!bg-transparent dark:hover:!bg-transparent dark:focus-visible:!bg-transparent"
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder="Buscar por nota ou categoria"
								value={searchQuery}
							/>
						</div>
						<TransactionsFilterMenu
							appliedFilters={appliedFilters}
							transactions={transactions}
							onAppliedFiltersChange={setAppliedFilters}
						/>
					</div>
					<TransactionsPeriodStats
						periodLabel="Últimos 30d"
						stats={periodStats}
					/>
				</div>
				<TransactionsTable
					transactions={filteredTransactions}
					hasActiveFilters={hasActiveFilters}
					monthLabel={monthLabel}
				/>
			</div>
			<div className="min-w-0 lg:pt-5">
				<div className="flex w-full min-w-0 flex-col overflow-hidden">
					<TransactionsCategoryBarChart
						transactions={filteredTransactions}
						periodLabel={monthLabel}
					/>
				</div>
			</div>
			</div>
		</div>
	);
}
