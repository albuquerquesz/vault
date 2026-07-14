"use client";

import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { useMemo } from "react";
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

	const expensesQuery = useFinanceExpenses(selectedMonth);
	const previousMonthQuery = useFinanceExpenses(previousMonth);

	const expenses = expensesQuery.data ?? [];

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
						expenses={expenses}
						month={selectedMonth}
						monthLabel={monthLabel}
					/>
				</div>

				<div className="flex min-w-0 flex-col gap-8">
					<div className="financial-panel-border flex h-[300px] w-full items-start p-3 sm:p-4">
						<TransactionsPeriodStats
							periodLabel="Últimos 30d"
							stats={periodStats}
						/>
					</div>
					<div className="financial-panel-border h-[300px] w-full" />
				</div>
			</div>
		</MonetaryVisibilityProvider>
	);
}
