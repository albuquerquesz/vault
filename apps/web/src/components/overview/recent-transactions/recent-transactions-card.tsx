"use client";

import { ReceiptTextIcon } from "lucide-react";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
} from "@/components/overview/shared/overview-card-state";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import {
	RecentTransactionsList,
	RecentTransactionsLoadingList,
} from "./recent-transactions-list";
import { useRecentTransactionsCard } from "./use-recent-transactions-card";

export function RecentTransactionsCard() {
	const { transactions, isError, isLoading } = useRecentTransactionsCard();

	return (
		<OverviewCardShell
			title="Registros Recentes"
			icon={<ReceiptTextIcon className="size-4 text-muted-foreground" />}
			tooltip="Últimas transações bancárias sincronizadas"
			contentClassName="flex flex-1 flex-col"
		>
			{isLoading ? (
				<RecentTransactionsLoadingList />
			) : isError ? (
				<OverviewCardErrorState message="Não foi possível carregar as transações bancárias." />
			) : transactions.length === 0 ? (
				<OverviewCardEmptyState message="Nenhuma transação bancária encontrada" />
			) : (
				<RecentTransactionsList transactions={transactions} />
			)}
		</OverviewCardShell>
	);
}
