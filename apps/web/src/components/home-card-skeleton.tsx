import { Card, CardContent, CardHeader } from "@vault/ui/components/card";
import { Skeleton } from "@vault/ui/components/skeleton";
import { cn } from "@vault/ui/lib/utils";
import type * as React from "react";

type HomeCardSkeletonVariant =
	| "savings"
	| "mix"
	| "heatmap"
	| "bills"
	| "category"
	| "investment";

type HomeCardSkeletonProps = {
	variant: HomeCardSkeletonVariant;
	className?: string;
};

function HeaderBlock({
	left,
	right,
	className,
}: {
	left: React.ReactNode;
	right?: React.ReactNode;
	className?: string;
}) {
	return (
		<CardHeader className={cn("gap-5", className)}>
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">{left}</div>
				{right ? <div className="shrink-0">{right}</div> : null}
			</div>
		</CardHeader>
	);
}

function SavingsSkeleton() {
	return (
		<>
			<HeaderBlock
				left={
					<div className="space-y-3">
						<Skeleton className="h-5 w-40" />
						<div className="flex flex-wrap items-end gap-3">
							<Skeleton className="h-10 w-36" />
							<Skeleton className="h-7 w-44" />
						</div>
					</div>
				}
			/>
			<CardContent className="flex h-full flex-col">
				<div className="relative h-56">
					<Skeleton className="h-full w-full" />
					<div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-4">
						<Skeleton className="h-2.5 w-10" />
						<Skeleton className="h-2.5 w-10" />
						<Skeleton className="h-2.5 w-10" />
						<Skeleton className="h-2.5 w-10" />
					</div>
				</div>
			</CardContent>
		</>
	);
}

function MixSkeleton() {
	return (
		<>
			<HeaderBlock
				className="gap-4"
				left={
					<div className="space-y-2">
						<Skeleton className="h-10 w-32" />
						<Skeleton className="h-6 w-52" />
					</div>
				}
				right={
					<div className="space-y-2 text-right">
						<Skeleton className="ml-auto h-8 w-16" />
						<Skeleton className="ml-auto h-5 w-36" />
					</div>
				}
			/>
			<CardContent>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
					<Skeleton className="mx-auto h-72 w-full max-w-72 rounded-full" />
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, index) => (
							<div
								key={`mix-row-${index}`}
								className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4"
							>
								<Skeleton className="h-3 w-3" />
								<Skeleton className="h-5 w-full" />
								<Skeleton className="h-5 w-12" />
								<Skeleton className="h-5 w-20" />
								<Skeleton className="h-5 w-5" />
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</>
	);
}

function HeatmapSkeleton() {
	return (
		<>
			<HeaderBlock
				left={
					<div className="space-y-5">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-28" />
						</div>
						<div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
							<div className="space-y-2">
								<Skeleton className="h-10 w-36" />
								<Skeleton className="h-4 w-28" />
							</div>
							<div className="space-y-2 text-right">
								<Skeleton className="ml-auto h-6 w-20" />
								<Skeleton className="ml-auto h-4 w-[4.5rem]" />
							</div>
						</div>
					</div>
				}
			/>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-[1.8rem_minmax(0,1fr)] items-start gap-3">
					<div className="grid gap-2 pt-0.5">
						{Array.from({ length: 7 }).map((_, index) => (
							<Skeleton key={`heatmap-label-${index}`} className="h-3 w-5" />
						))}
					</div>
					<div className="grid gap-2">
						{Array.from({ length: 7 }).map((_, rowIndex) => (
							<div
								key={`heatmap-row-${rowIndex}`}
								className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1"
							>
								{Array.from({ length: 24 }).map((_, colIndex) => (
									<Skeleton
										key={`heatmap-cell-${rowIndex}-${colIndex}`}
										className="h-3 w-full rounded-[2px]"
									/>
								))}
							</div>
						))}
					</div>
				</div>
				<div className="grid grid-cols-[1.8rem_minmax(0,1fr)] gap-3">
					<span />
					<div className="grid grid-cols-5 gap-2">
						{Array.from({ length: 5 }).map((_, index) => (
							<Skeleton key={`heatmap-hour-${index}`} className="h-3 w-full" />
						))}
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Skeleton className="h-3 w-10" />
					<div className="flex items-center gap-1.5">
						{Array.from({ length: 5 }).map((_, index) => (
							<Skeleton
								key={`heatmap-legend-${index}`}
								className="h-2.5 w-3.5"
							/>
						))}
					</div>
					<Skeleton className="h-3 w-10" />
				</div>
			</CardContent>
		</>
	);
}

function BillsSkeleton() {
	return (
		<>
			<HeaderBlock
				className="gap-4"
				left={
					<div className="space-y-4">
						<Skeleton className="h-5 w-28" />
						<div className="space-y-2">
							<Skeleton className="h-12 w-40" />
							<div className="flex flex-wrap items-center gap-3">
								<Skeleton className="h-5 w-28" />
								<Skeleton className="h-5 w-5" />
								<Skeleton className="h-5 w-24" />
							</div>
						</div>
					</div>
				}
			/>
			<CardContent className="flex h-full flex-col">
				<div className="mt-2 flex items-center justify-between gap-4">
					<div className="flex min-w-0 items-center gap-3">
						<Skeleton className="h-9 w-9 rounded-xl" />
						<Skeleton className="h-6 w-20" />
					</div>
					<div className="flex items-center gap-3">
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-8 w-14 rounded-full" />
					</div>
				</div>
				<Skeleton className="mt-5 h-px w-full" />
			</CardContent>
		</>
	);
}

function CategorySkeleton() {
	return (
		<>
			<HeaderBlock
				className="gap-2"
				left={
					<div className="space-y-2">
						<Skeleton className="h-7 w-56" />
						<Skeleton className="h-5 w-28" />
					</div>
				}
			/>
			<CardContent className="my-auto p-0">
				<div className="flex h-80 w-full flex-col items-center justify-center gap-8 px-4">
					<Skeleton className="h-52 w-52 rounded-full" />
					<div className="flex w-full flex-wrap justify-center gap-3">
						{Array.from({ length: 5 }).map((_, index) => (
							<Skeleton key={`category-legend-${index}`} className="h-6 w-24" />
						))}
					</div>
				</div>
			</CardContent>
		</>
	);
}

function InvestmentSkeleton() {
	return (
		<>
			<HeaderBlock
				left={
					<div className="space-y-3">
						<Skeleton className="h-5 w-28" />
						<div className="flex flex-wrap items-end gap-3">
							<Skeleton className="h-10 w-40" />
							<Skeleton className="h-7 w-20" />
						</div>
					</div>
				}
				right={<Skeleton className="h-5 w-24" />}
			/>
			<CardContent className="flex h-full flex-col">
				<div className="mb-4 flex items-center justify-between gap-3">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-4 w-32" />
				</div>
				<div className="relative h-[15.5rem]">
					<Skeleton className="absolute inset-0" />
					<div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
						{Array.from({ length: 6 }).map((_, index) => (
							<Skeleton
								key={`investment-bar-${index}`}
								className="h-16 w-full rounded-t-xl"
							/>
						))}
					</div>
				</div>
			</CardContent>
		</>
	);
}

const skeletonByVariant: Record<
	HomeCardSkeletonVariant,
	() => React.ReactNode
> = {
	savings: SavingsSkeleton,
	mix: MixSkeleton,
	heatmap: HeatmapSkeleton,
	bills: BillsSkeleton,
	category: CategorySkeleton,
	investment: InvestmentSkeleton,
};

export function HomeCardSkeleton({
	variant,
	className,
}: HomeCardSkeletonProps) {
	const SkeletonContent = skeletonByVariant[variant];

	return (
		<Card
			className={cn(
				"financial-panel-border h-full min-h-[32rem] ring-0",
				className,
			)}
		>
			<SkeletonContent />
		</Card>
	);
}

export type { HomeCardSkeletonProps, HomeCardSkeletonVariant };
