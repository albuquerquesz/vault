"use client";

import { usePluggyTransactions } from "@/features/pluggy/sdk";

export function useRecentTransactionsCard() {
	const transactionsQuery = usePluggyTransactions({ limit: 5 });

	return {
		transactions: transactionsQuery.data ?? [],
		isLoading: transactionsQuery.isPending,
		isError: transactionsQuery.isError,
	};
}
