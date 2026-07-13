"use client";

import { useFinanceMonthlyBills } from "@/features/finance/sdk";

export function useMonthlyBillCard(month: string) {
	const billsQuery = useFinanceMonthlyBills(month);
	const bills = billsQuery.data;

	return {
		isLoading: billsQuery.isPending,
		isError: billsQuery.isError,
		bill: bills?.bills[0] ?? null,
		items: bills?.items ?? [],
	};
}
