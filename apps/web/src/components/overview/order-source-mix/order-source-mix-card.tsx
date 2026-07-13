"use client";

import { PieChartIcon } from "lucide-react";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
	OverviewCardLoadingState,
} from "@/components/overview/shared/overview-card-state";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import { OrderSourceMixContent } from "./order-source-mix-content";
import { useOrderSourceMix } from "./hooks/use-order-source-mix";

type OrderSourceMixCardProps = {
	month: string;
	title?: string;
};

export function OrderSourceMixCard({
	month,
	title = "Distribuição dos gastos",
}: OrderSourceMixCardProps) {
	const { sourceData, isLoading, isError } = useOrderSourceMix(month);

	if (isLoading) {
		return (
			<OverviewCardLoadingState fallback={<HomeCardSkeleton variant="mix" />} />
		);
	}

	return (
		<OverviewCardShell
			title={title}
			icon={<PieChartIcon className="size-4 text-muted-foreground" />}
			tooltip="Resumo da distribuição dos gastos por categoria"
			contentClassName="flex flex-1 p-4"
		>
			{isError ? (
				<OverviewCardErrorState message="Não foi possível carregar as despesas do mês." />
			) : sourceData.length === 0 ? (
				<OverviewCardEmptyState message="Nenhuma despesa registrada" />
			) : (
				<OrderSourceMixContent month={month} sourceData={sourceData} />
			)}
		</OverviewCardShell>
	);
}
