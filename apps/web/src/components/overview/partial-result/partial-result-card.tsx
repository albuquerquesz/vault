"use client";

import { Skeleton } from "@vault/ui/components/skeleton";
import { ChartNoAxesCombinedIcon } from "lucide-react";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
	OverviewCardLoadingState,
} from "@/components/overview/shared/overview-card-state";
import { usePartialResult } from "./hooks/use-partial-result";
import { PartialResultContent } from "./partial-result-content";

type PartialResultCardProps = {
	month: string;
	className?: string;
};

function PartialResultLoadingSkeleton({ className }: { className?: string }) {
	return (
		<OverviewCardShell
			title="Resultado Parcial"
			icon={
				<ChartNoAxesCombinedIcon className="size-4 text-muted-foreground" />
			}
			tooltip="Resumo do resultado do mês com entradas e saídas consolidadas"
			className={className}
			contentClassName="flex flex-1 flex-col justify-between gap-4 px-4 pb-5 pt-3 sm:px-5"
		>
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-36" />
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
				<Skeleton className="h-4 w-40" />
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-5 w-24" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-14" />
					<Skeleton className="h-5 w-24" />
				</div>
			</div>
		</OverviewCardShell>
	);
}

export function PartialResultCard({
	month,
	className,
}: PartialResultCardProps) {
	const { metrics, isLoading, isError } = usePartialResult(month);

	if (isLoading) {
		return (
			<OverviewCardLoadingState
				fallback={<PartialResultLoadingSkeleton className={className} />}
			/>
		);
	}

	return (
		<OverviewCardShell
			title="Resultado Parcial"
			icon={
				<ChartNoAxesCombinedIcon className="size-4 text-muted-foreground" />
			}
			tooltip="Resumo do resultado do mês com entradas e saídas consolidadas"
			className={className}
			contentClassName="flex flex-1 flex-col px-4 pb-5 pt-3 sm:px-5"
		>
			{isError ? (
				<OverviewCardErrorState message="Não foi possível carregar o resultado parcial." />
			) : !metrics ? (
				<OverviewCardEmptyState message="Nenhum dado para este mês." />
			) : (
				<PartialResultContent metrics={metrics} />
			)}
		</OverviewCardShell>
	);
}
