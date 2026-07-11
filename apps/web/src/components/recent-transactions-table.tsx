"use client";

import { Badge } from "@vault/ui/components/badge";
import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@vault/ui/components/card";
import { Skeleton } from "@vault/ui/components/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@vault/ui/components/tooltip";
import { Info, ReceiptTextIcon } from "lucide-react";
import { formatDate } from "@/components/formater";
import { usePluggyTransactions } from "@/features/pluggy/sdk";

const CATEGORY_COLORS: Record<string, string> = {
	Moradia: "bg-amber-500/10 text-amber-500 border-amber-500/20",
	Alimentação: "bg-orange-500/10 text-orange-500 border-orange-500/20",
	Transporte: "bg-blue-500/10 text-blue-500 border-blue-500/20",
	Saúde: "bg-red-500/10 text-red-500 border-red-500/20",
	Lazer: "bg-purple-500/10 text-purple-500 border-purple-500/20",
	Outros: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

function getCategoryColor(category: string) {
	return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Outros;
}

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

function SkeletonRow() {
	return (
		<div className="flex items-center justify-between gap-4 py-3">
			<Skeleton className="h-4 w-24 flex-1" />
			<Skeleton className="h-4 w-16 shrink-0" />
			<Skeleton className="h-5 w-20 shrink-0" />
			<Skeleton className="h-4 w-20 shrink-0" />
		</div>
	);
}

export function RecentTransactionsTable() {
	const transactionsQuery = usePluggyTransactions(5);
	const transactions = transactionsQuery.data ?? [];

	const renderContent = () => {
		if (transactions.length === 0) {
			return (
				<div className="py-8 text-center text-sm text-muted-foreground">
					Nenhuma transação bancária encontrada
				</div>
			);
		}

		return (
			<div className="relative">
				<div className="divide-y">
					{transactions.map((tx) => {
						const amount = Number(tx.amount);

						return (
							<div
								key={tx.id}
								className="flex items-center justify-between gap-4 py-3"
							>
								<span className="min-w-0 flex-1 truncate text-sm">
									{tx.description ?? "—"}
								</span>

								<span className="shrink-0 text-sm text-muted-foreground tabular-nums">
									{formatDate(tx.date, "day-month")}
								</span>

								{tx.category ? (
									<Badge className="shrink-0" variant="outline">
										{tx.category}
									</Badge>
								) : (
									<Badge className="shrink-0" variant="outline">
										—
									</Badge>
								)}

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
	};

	return (
		<Card className="financial-panel-border h-full min-h-[24rem] w-full ring-0">
			<CardHeader className="border-b">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<ReceiptTextIcon className="size-4 text-muted-foreground" />
						<CardDescription className="text-base">
							Registros Recentes
						</CardDescription>
					</div>
					<Tooltip>
						<TooltipTrigger
							delay={800}
							render={() => <Info className="mt-0.5 size-4 text-muted-foreground" />}
						/>
						<TooltipContent>
							Últimas transações bancárias sincronizadas
						</TooltipContent>
					</Tooltip>
				</div>
			</CardHeader>
			<CardContent>
				{transactionsQuery.isPending ? (
					<div className="divide-y">
						<SkeletonRow />
						<SkeletonRow />
						<SkeletonRow />
						<SkeletonRow />
						<SkeletonRow />
					</div>
				) : (
					renderContent()
				)}
			</CardContent>
		</Card>
	);
}
