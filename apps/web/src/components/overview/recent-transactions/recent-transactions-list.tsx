"use client";

import { Badge } from "@vault/ui/components/badge";
import { Button } from "@vault/ui/components/button";
import { Skeleton } from "@vault/ui/components/skeleton";
import { formatDate } from "@/components/formater";
import type { PluggyTransaction } from "@/features/pluggy/sdk";

function formatBRL(value: number) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

function formatBRLSigned(value: number) {
	const formatted = formatBRL(Math.abs(value));
	return value >= 0 ? formatted : `-${formatted}`;
}

function formatOrigin(transaction: PluggyTransaction) {
	const parts = [transaction.provider, transaction.accountName].filter(
		(part): part is string => Boolean(part?.trim()),
	);
	return parts.join(" · ");
}

function SkeletonRow() {
	return (
		<div className="flex items-center justify-between gap-4 py-3">
			<div className="min-w-0 flex-1 space-y-1.5">
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-3 w-24" />
			</div>
			<Skeleton className="h-4 w-16 shrink-0" />
			<Skeleton className="h-5 w-20 shrink-0" />
			<Skeleton className="h-4 w-20 shrink-0" />
		</div>
	);
}

export function RecentTransactionsLoadingList() {
	return (
		<div className="divide-y">
			<SkeletonRow />
			<SkeletonRow />
			<SkeletonRow />
			<SkeletonRow />
			<SkeletonRow />
		</div>
	);
}

export function RecentTransactionsList({
	transactions,
}: {
	transactions: PluggyTransaction[];
}) {
	return (
		<div className="relative">
			<div className="divide-y">
				{transactions.map((transaction) => {
					const amount = Number(transaction.amount);
					const origin = formatOrigin(transaction);

					return (
						<div
							key={transaction.id}
							className="flex items-center justify-between gap-4 py-3"
						>
							<div className="min-w-0 flex-1">
								<span className="block truncate text-sm">
									{transaction.description ?? "—"}
								</span>
								{origin ? (
									<span className="mt-0.5 block truncate text-xs text-muted-foreground">
										{origin}
									</span>
								) : null}
							</div>

							<span className="shrink-0 text-sm text-muted-foreground tabular-nums">
								{formatDate(transaction.date, "day-month")}
							</span>

							<Badge className="shrink-0" variant="outline">
								{transaction.category ?? "—"}
							</Badge>

							<span
								className={`shrink-0 text-sm tabular-nums ${amount >= 0 ? "text-emerald-500" : "text-red-500"}`}
							>
								{formatBRLSigned(amount)}
							</span>
						</div>
					);
				})}
			</div>

			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />

			<div className="flex justify-center pt-2">
				<Button className="text-muted-foreground" size="xs" variant="ghost">
					Ver mais
				</Button>
			</div>
		</div>
	);
}
