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
			tooltip="Saldos dos cartões de crédito conectados via Open Finance"
			contentClassName="flex flex-1 flex-col"
		>
			{isError ? (
				<OverviewCardErrorState message="Não foi possível carregar os cartões." />
			) : !bill || items.length === 0 ? (
				<OverviewCardEmptyState message="Nenhum cartão conectado." />
			) : (
				<MonthlyBillContent totalBill={bill.totalBill} items={items} />
			)}
		</OverviewCardShell>
	);
}
