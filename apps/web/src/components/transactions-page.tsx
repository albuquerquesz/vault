"use client";

import { Button } from "@vault/ui/components/button";
import { useMemo, useState } from "react";
import { DataQueryToolbar } from "@/components/shared/data-query-toolbar";
import { FinancialPanel } from "@/components/shared/financial-panel";
import { formatFinanceMonth, buildFinanceMonthOptions } from "@/components/shared/finance-month-options";
import { FinanceMonthSelect } from "@/components/shared/finance-month-select";
import { getMonthValue, useFinanceTransactions } from "@/features/finance/sdk";
import { TransactionsCategoryBarChart } from "./transactions-page/transactions-category-bar-chart";
import { TransactionsFilterMenu } from "./transactions-page/transactions-filter-menu";
import { TransactionsSkeleton } from "./transactions-page/transactions-skeleton";
import { TransactionsTable } from "./transactions-page/transactions-table";
import { CreateTransactionSheet } from "./transactions-page/create-transaction-sheet";
import {
	applyTransactionFilters,
	EMPTY_TRANSACTIONS_FILTERS,
	hasActiveTransactionFilters,
	type TransactionsFilters,
} from "./transactions-page/utils";

export function TransactionsPage() {
	const [selectedMonth, setSelectedMonth] = useState(() => getMonthValue());
	const [searchQuery, setSearchQuery] = useState("");
	const [appliedFilters, setAppliedFilters] = useState<TransactionsFilters>(
		EMPTY_TRANSACTIONS_FILTERS,
	);

	const transactionsQuery = useFinanceTransactions(selectedMonth);
	const monthOptions = useMemo(() => buildFinanceMonthOptions(), []);

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

	const monthLabel = useMemo(() => formatFinanceMonth(selectedMonth), [selectedMonth]);

	const hasActiveFilters =
		searchQuery.trim().length > 0 ||
		hasActiveTransactionFilters(appliedFilters);

	const clearQuery = () => {
		setSearchQuery("");
		setAppliedFilters(EMPTY_TRANSACTIONS_FILTERS);
	};

	if (transactionsQuery.isPending) {
		return (
			<div className="grid w-full min-w-0 gap-6 py-4 sm:py-6">
				<TransactionsSkeleton />
			</div>
		);
	}

	if (transactionsQuery.isError) {
		return (
			<div className="grid w-full min-w-0 gap-6 py-4 sm:py-6">
				<FinancialPanel
					header={<div><p className="text-base font-medium">Não foi possível abrir o extrato</p></div>}
					headerClassName="border-b p-5"
					contentClassName="grid gap-4 p-5"
				>
						<p className="max-w-xl text-sm text-muted-foreground">
							As transações não puderam ser carregadas agora. Tente novamente
							para recarregar a lista deste mês.
						</p>
						<div>
							<Button onClick={() => void transactionsQuery.refetch()}>
								Tentar novamente
							</Button>
						</div>
				</FinancialPanel>
			</div>
		);
	}

	return (
		<div className="grid w-full min-w-0 gap-6 py-4 sm:py-6">
			<div className="grid min-w-0 gap-6">
				<FinancialPanel className="min-w-0 !border-0" contentClassName="min-w-0 p-0">
					<TransactionsCategoryBarChart
						transactions={filteredTransactions}
						headerAction={<FinanceMonthSelect value={selectedMonth} options={monthOptions} onValueChange={setSelectedMonth} triggerClassName="!min-w-[112px] border-0 px-0.5" />}
					/>
				</FinancialPanel>
				<FinancialPanel
					className="min-w-0 !border-0"
					header={
						<div className="grid gap-4">
							<div className="flex items-center justify-between gap-3">
								<div className="space-y-1">
									<p className="text-2xl font-medium tracking-tight">Movimentações</p>
									<p className="text-sm text-muted-foreground">Consulte, filtre e registre entradas e despesas.</p>
								</div>
								<CreateTransactionSheet month={selectedMonth} />
							</div>
							<DataQueryToolbar
								activeFilters={Object.values(appliedFilters).reduce((total, values) => total + values.length, 0)}
								filterControl={<TransactionsFilterMenu appliedFilters={appliedFilters} transactions={transactions} onAppliedFiltersChange={setAppliedFilters} />}
								onClear={clearQuery}
								onValueChange={setSearchQuery}
								placeholder="Buscar por nota ou categoria"
								value={searchQuery}
							/>
						</div>
					}
					headerClassName="p-4 sm:p-5"
					contentClassName="min-w-0 p-3 sm:p-5"
				>
					<TransactionsTable transactions={filteredTransactions} hasActiveFilters={hasActiveFilters} monthLabel={monthLabel} onClearFilters={clearQuery} />
				</FinancialPanel>
			</div>
		</div>
	);
}
