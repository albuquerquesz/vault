"use client";

import { Skeleton } from "@vault/ui/components/skeleton";
import { ChartColumn } from "lucide-react";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
	OverviewCardLoadingState,
} from "@/components/overview/shared/overview-card-state";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import { DailySpendBarContent } from "./daily-spend-bar-content";
import { useDailySpendBar } from "./hooks/use-daily-spend-bar";

type DailySpendBarCardProps = {
	month: string;
	title?: string;
};

function DailySpendBarLoadingSkeleton() {
	return (
		<OverviewCardShell
			title="Gastos por dia"
			icon={<ChartColumn className="size-4 text-muted-foreground" />}
			tooltip="Total gasto em cada dia do mês selecionado"
			contentClassName="flex flex-1 flex-col p-4"
		>
			<div className="flex h-full min-h-[220px] flex-1 flex-col justify-end gap-2">
				<div className="flex h-[180px] items-end gap-1">
					{Array.from({ length: 18 }).map((_, index) => (
						<Skeleton
							className="w-full rounded-sm"
							key={`daily-spend-skel-${index}`}
							style={{ height: `${30 + ((index * 17) % 70)}%` }}
						/>
					))}
				</div>
				<div className="flex justify-between px-1">
					<Skeleton className="h-3 w-6" />
					<Skeleton className="h-3 w-6" />
					<Skeleton className="h-3 w-6" />
					<Skeleton className="h-3 w-6" />
				</div>
			</div>
		</OverviewCardShell>
	);
}

export function DailySpendBarCard({
	month,
	title = "Gastos por dia",
}: DailySpendBarCardProps) {
	const { chartData, totalSpent, isLoading, isError } = useDailySpendBar(month);

	if (isLoading) {
		return (
			<OverviewCardLoadingState fallback={<DailySpendBarLoadingSkeleton />} />
		);
	}

	return (
		<OverviewCardShell
			title={title}
			icon={<ChartColumn className="size-4 text-muted-foreground" />}
			tooltip="Total gasto em cada dia do mês selecionado"
			contentClassName="flex flex-1 flex-col p-4"
		>
			{isError ? (
				<OverviewCardErrorState message="Não foi possível carregar os gastos diários." />
			) : totalSpent <= 0 ? (
				<OverviewCardEmptyState message="Nenhuma despesa neste mês" />
			) : (
				<DailySpendBarContent chartData={chartData} />
			)}
		</OverviewCardShell>
	);
}
