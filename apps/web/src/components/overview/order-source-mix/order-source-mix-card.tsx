"use client";

import { PieChartIcon } from "lucide-react";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { HomeCardSkeleton } from "@/components/home-card-skeleton";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import {
	OverviewCardErrorState,
	OverviewCardLoadingState,
} from "@/components/overview/shared/overview-card-state";
import { useOrderSourceMix } from "./hooks/use-order-source-mix";
import { OrderSourceMixContent } from "./order-source-mix-content";

type OrderSourceMixCardProps = {
	month: string;
	title?: string;
};

export function OrderSourceMixCard({
	month,
	title = "Distribuição dos gastos",
}: OrderSourceMixCardProps) {
	const { sourceData, isLoading, isError } = useOrderSourceMix(month);
	const zeroCurrency = (value: number) =>
		new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);

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
				<div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
					<div className="text-2xl font-sans font-medium tabular-nums">
						<MaskedMonetaryValue format={zeroCurrency} value={0} />
					</div>
					<p className="text-sm text-muted-foreground">Nenhuma despesa registrada</p>
				</div>
			) : (
				<OrderSourceMixContent month={month} sourceData={sourceData} />
			)}
		</OverviewCardShell>
	);
}
