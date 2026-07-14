"use client";

import { Card, CardContent } from "@vault/ui/components/card";
import { Skeleton } from "@vault/ui/components/skeleton";
import { cn } from "@vault/ui/lib/utils";
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
	/** Hide the overview link when the card is already on /transactions. */
	showLink?: boolean;
};

function PartialResultLoadingSkeleton({ className }: { className?: string }) {
	return (
		<Card
			className={cn(
				"financial-panel-border flex h-full min-h-0 w-full flex-col ring-0",
				className,
			)}
		>
			<CardContent className="flex flex-1 flex-col justify-between gap-4 p-5">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="size-8 rounded-full" />
					</div>
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
			</CardContent>
		</Card>
	);
}

export function PartialResultCard({
	month,
	className,
	showLink = true,
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
		<Card
			className={cn(
				"financial-panel-border flex h-full min-h-0 w-full flex-col ring-0",
				className,
			)}
		>
			<CardContent className="flex flex-1 flex-col p-5">
				{isError ? (
					<OverviewCardErrorState message="Não foi possível carregar o resultado parcial." />
				) : !metrics ? (
					<OverviewCardEmptyState message="Nenhum dado para este mês." />
				) : (
					<PartialResultContent metrics={metrics} showLink={showLink} />
				)}
			</CardContent>
		</Card>
	);
}
