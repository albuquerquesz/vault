"use client";

import { Button } from "@vault/ui/components/button";
import { ChartColumnIncreasingIcon, ClipboardListIcon, ArrowDownIcon, ArrowUpIcon, ScaleIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { DataQueryToolbar } from "@/components/shared/data-query-toolbar";
import { FinancialPanel } from "@/components/shared/financial-panel";
import { FinanceMetricStrip } from "@/components/shared/finance-metric-strip";
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
	buildPeriodStats,
	EMPTY_TRANSACTIONS_FILTERS,
	hasActiveTransactionFilters,
	formatBRL,
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

	const periodStats = useMemo(() => buildPeriodStats(transactions), [transactions]);

	const monthLabel = useMemo(() => formatFinanceMonth(selectedMonth), [selectedMonth]);

	const hasActiveFilters =
		searchQuery.trim().length > 0 ||
		hasActiveTransactionFilters(appliedFilters);

	const clearQuery = () => {
		setSearchQuery("");
		setAppliedFilters(EMPTY_TRANSACTIONS_FILTERS);
	};

	const pageHero = (
		<section className="rounded-[18px] bg-zinc-950 p-5 text-zinc-50 sm:p-6" aria-label="Resumo das transações">
			<div className="flex flex-col gap-5">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-zinc-300">
							<ChartColumnIncreasingIcon aria-hidden className="size-5" />
							<h1 className="text-lg font-medium text-zinc-50">Transações</h1>
						</div>
						<p className="text-sm text-zinc-400">Movimentações de {monthLabel}</p>
					</div>
					<div className="flex items-center gap-2">
						<FinanceMonthSelect tone="dark" value={selectedMonth} options={monthOptions} onValueChange={setSelectedMonth} />
						<CreateTransactionSheet month={selectedMonth} />
					</div>
				</div>
				<FinanceMetricStrip
					metrics={[
						{ label: "Lançamentos", value: periodStats.count, icon: ClipboardListIcon },
						{ label: "Entradas", value: <MaskedMonetaryValue format={formatBRL} value={periodStats.totalIn} />, icon: ArrowUpIcon, tone: "income" },
						{ label: "Saídas", value: <MaskedMonetaryValue format={formatBRL} value={periodStats.totalOut} />, icon: ArrowDownIcon, tone: "expense" },
						{ label: "Saldo", value: <MaskedMonetaryValue format={formatBRL} value={periodStats.balance} />, icon: ScaleIcon, tone: periodStats.balance < 0 ? "expense" : "income" },
					]}
				/>
			</div>
		</section>
	);

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
				{pageHero}
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
			{pageHero}
			<div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
				<FinancialPanel
					className="min-w-0 !border-0"
					header={
						<div className="grid gap-4">
							<div className="flex items-baseline justify-between gap-3">
								<div><p className="text-base font-medium">Movimentações</p><p className="text-sm text-muted-foreground">Busque e filtre o extrato do mês.</p></div>
								<p className="shrink-0 text-sm tabular-nums text-muted-foreground">{filteredTransactions.length} de {transactions.length}</p>
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
					headerClassName="border-b p-4 sm:p-5"
					contentClassName="min-w-0 p-3 sm:p-5"
				>
					<TransactionsTable transactions={filteredTransactions} hasActiveFilters={hasActiveFilters} monthLabel={monthLabel} onClearFilters={clearQuery} />
				</FinancialPanel>
				<FinancialPanel className="min-w-0 !border-0" contentClassName="min-w-0 p-0">
					<TransactionsCategoryBarChart transactions={filteredTransactions} periodLabel={monthLabel} />
				</FinancialPanel>
			</div>
		</div>
	);
}
