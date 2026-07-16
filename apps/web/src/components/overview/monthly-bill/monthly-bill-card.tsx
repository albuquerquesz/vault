"use client";

import { CreditCardIcon } from "lucide-react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { useMonthlyBillCard } from "@/components/overview/monthly-bill/hooks/use-monthly-bill-card";
import { MonthlyBillContent } from "@/components/overview/monthly-bill/monthly-bill-content";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
	OverviewCardLoadingState,
} from "@/components/overview/shared/overview-card-state";

export function MonthlyBillCard({ month }: { month?: string }) {
	const { bill, isError, isLoading, items } = useMonthlyBillCard(month);

	if (isLoading) {
		return (
			<OverviewCardLoadingState
				fallback={<HomeCardSkeleton variant="bills" />}
			/>
		);
	}

	return (
		<OverviewCardShell
			title="Cartões"
			icon={<CreditCardIcon className="size-4 text-muted-foreground" />}
			tooltip="Faturas de cartão de crédito do mês selecionado (Open Finance)"
			className="h-[18rem] sm:h-auto"
			contentClassName="flex min-h-0 flex-1 flex-col p-4 sm:px-(--card-spacing) sm:pb-(--card-spacing) sm:pt-0"
		>
			{isError ? (
				<OverviewCardErrorState message="Não foi possível carregar as faturas de cartão." />
			) : !bill || items.length === 0 ? (
				<OverviewCardEmptyState message="Nenhuma fatura de cartão neste mês." />
			) : (
				<MonthlyBillContent totalBill={bill.totalBill} items={items} />
			)}
		</OverviewCardShell>
	);
}
