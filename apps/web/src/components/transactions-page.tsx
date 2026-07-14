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
import { MonetaryVisibilityProvider } from "@/components/monetary-visibility";
import { getMonthValue, useFinanceExpenses } from "@/features/finance/sdk";
import { TransactionsPeriodStats } from "./transactions-page/transactions-period-stats";
import { TransactionsSkeleton } from "./transactions-page/transactions-skeleton";
import { TransactionsTable } from "./transactions-page/transactions-table";
import {
	buildPeriodStats,
	filterLastNDays,
	getPreviousMonthValue,
} from "./transactions-page/utils";

export function TransactionsPage() {
	const selectedMonth = useMemo(() => getMonthValue(), []);
	const previousMonth = useMemo(
		() => getPreviousMonthValue(selectedMonth),
		[selectedMonth],
	);
	const [searchQuery, setSearchQuery] = useState("");

	const expensesQuery = useFinanceExpenses(selectedMonth);
	const previousMonthQuery = useFinanceExpenses(previousMonth);

	const expenses = expensesQuery.data ?? [];

	const filteredExpenses = useMemo(() => {
		if (!searchQuery.trim()) return expenses;
		const query = searchQuery.toLowerCase();
		return expenses.filter(
			(expense) =>
				expense.category.toLowerCase().includes(query) ||
				expense.note?.toLowerCase().includes(query),
		);
	}, [expenses, searchQuery]);

	const periodStats = useMemo(() => {
		const merged = [
			...(previousMonthQuery.data ?? []),
			...(expensesQuery.data ?? []),
		];
		return buildPeriodStats(filterLastNDays(merged, 30));
	}, [expensesQuery.data, previousMonthQuery.data]);

	const monthLabel = useMemo(() => {
		const date = new Date(`${selectedMonth}-01T12:00:00`);
		return date.toLocaleDateString("pt-BR", {
			month: "long",
			year: "numeric",
		});
	}, [selectedMonth]);

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
			<div className="grid w-full min-w-0 grid-cols-1 gap-4 pt-6 lg:grid-cols-[3fr_2fr]">
				<div className="min-w-0">
					<TransactionsTable
						expenses={filteredExpenses}
						hasActiveSearch={searchQuery.trim().length > 0}
						month={selectedMonth}
						monthLabel={monthLabel}
					/>
				</div>

				<div className="flex min-w-0 flex-col gap-8">
					<div className="financial-panel-border flex h-[300px] w-full flex-col items-stretch gap-3 p-3 sm:gap-4 sm:p-4">
						<TransactionsPeriodStats
							periodLabel="Últimos 30d"
							stats={periodStats}
						/>
						<div className="relative w-full min-w-0">
							<SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								aria-label="Buscar transações"
								className="w-full rounded-md border-border/70 !bg-transparent pl-10 shadow-none dark:!bg-transparent dark:hover:!bg-transparent dark:focus-visible:!bg-transparent"
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder="Buscar por nota ou categoria"
								value={searchQuery}
							/>
						</div>
					</div>
					<div className="financial-panel-border h-[300px] w-full" />
				</div>
			</div>
		</MonetaryVisibilityProvider>
	);
}
