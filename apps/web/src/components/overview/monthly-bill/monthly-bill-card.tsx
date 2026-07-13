"use client";

import { CreditCardIcon } from "lucide-react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { MonthlyBillContent } from "@/components/overview/monthly-bill/monthly-bill-content";
import { useMonthlyBillCard } from "@/components/overview/monthly-bill/use-monthly-bill-card";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
	OverviewCardLoadingState,
} from "@/components/overview/shared/overview-card-state";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";

export function MonthlyBillCard({ month }: { month: string }) {
	const { bill, isError, isLoading, items } = useMonthlyBillCard(month);

	if (isLoading) {
		return (
			<OverviewCardLoadingState fallback={<HomeCardSkeleton variant="bills" />} />
		);
	}

	return (
		<OverviewCardShell
			title="Faturas do mês"
			icon={<CreditCardIcon className="size-4 text-muted-foreground" />}
			tooltip="Resumo das faturas e pagamentos do mês"
			contentClassName="flex flex-1 flex-col"
		>
			{isError ? (
				<OverviewCardErrorState message="Não foi possível carregar as faturas do mês." />
			) : !bill || items.length === 0 ? (
				<OverviewCardEmptyState message="Nenhuma fatura registrada." />
			) : (
				<MonthlyBillContent totalBill={bill.totalBill} items={items} />
			)}
		</OverviewCardShell>
	);
}
