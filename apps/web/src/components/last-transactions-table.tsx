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
import {
	Info,
	ReceiptTextIcon,
} from "lucide-react";
import { formatDate } from "@/components/formater";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { useFinanceExpenses } from "@/features/finance/sdk";

const CATEGORY_COLORS: Record<string, string> = {
	Moradia: "bg-amber-500/10 text-amber-500 border-amber-500/20",
	Alimentação: "bg-orange-500/10 text-orange-500 border-orange-500/20",
	Transporte: "bg-blue-500/10 text-blue-500 border-blue-500/20",
	Saúde: "bg-red-500/10 text-red-500 border-red-500/20",
	Lazer: "bg-purple-500/10 text-purple-500 border-purple-500/20",
	Outros: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

function _getCategoryColor(category: string) {
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

function SkeletonRow() {
	return (
		<div className="flex items-center justify-between gap-4 py-3">
			<Skeleton className="h-4 w-16 shrink-0" />
			<Skeleton className="h-5 w-20 shrink-0" />
			<Skeleton className="h-4 flex-1" />
			<Skeleton className="h-4 w-20 shrink-0" />
		</div>
	);
}

export function LastTransactionsTable() {
	const expensesQuery = useFinanceExpenses();

	if (expensesQuery.isPending) {
		return (
			<Card className="financial-panel-border w-full min-h-[28rem] ring-0">
				<CardHeader className="border-b">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<ReceiptTextIcon className="size-4 text-muted-foreground" />
							<CardDescription className="text-base">Últimas transações</CardDescription>
						</div>
						<Tooltip>
							<TooltipTrigger render={<Info className="size-4 text-muted-foreground" />} />
							<TooltipContent>Últimas transações registradas</TooltipContent>
						</Tooltip>
					</div>
				</CardHeader>
				<CardContent>
					<div className="divide-y">
						<SkeletonRow />
						<SkeletonRow />
						<SkeletonRow />
						<SkeletonRow />
						<SkeletonRow />
					</div>
				</CardContent>
			</Card>
		);
	}

	const expenses = expensesQuery.data ?? [];
	const lastFive = expenses.slice(0, 5);

	return (
		<Card className="financial-panel-border w-full min-h-[28rem] ring-0">
			<CardHeader className="border-b">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<ReceiptTextIcon className="size-4 text-muted-foreground" />
						<CardDescription className="text-base">Últimas transações</CardDescription>
					</div>
					<Tooltip>
						<TooltipTrigger delay={800} render={<Info className="mt-0.5 size-4 text-muted-foreground" />} />
						<TooltipContent>Últimas transações registradas</TooltipContent>
					</Tooltip>
				</div>
			</CardHeader>
			<CardContent>
				{lastFive.length === 0 ? (
					<div className="py-8 text-center text-sm text-muted-foreground">
						Nenhuma transação neste mês
					</div>
				) : (
					<div className="relative">
						<div className="divide-y">
							{lastFive.map((expense) => (
								<div
									key={expense.id}
									className="flex items-center justify-between gap-4 py-3"
								>
									<span className="shrink-0 text-sm text-muted-foreground tabular-nums">
										{formatDate(expense.expenseDate, "day-month")}
									</span>

									<Badge className="shrink-0" variant="outline">
										{expense.category}
									</Badge>

									<span className="min-w-0 flex-1 truncate text-sm">
										{expense.note ?? "--"}
									</span>

									<span className="shrink-0 text-sm tabular-nums">
										<MaskedMonetaryValue
											value={expense.amount}
											format={formatBRL}
										/>
									</span>
								</div>
							))}
						</div>

						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />

						<div className="flex justify-center pt-2">
							<Button
								className="text-muted-foreground"
								size="xs"
								variant="ghost"
							>
								Ver mais
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
