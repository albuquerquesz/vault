"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@vault/ui/components/badge";
import { cn } from "@vault/ui/lib/utils";
import { InstitutionMark } from "@/components/institution-mark";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import type { FinanceExpense } from "@/features/finance/sdk";
import { formatBRLNegative, getCategoryColor, getCategoryIcon } from "./utils";

function formatExpenseDate(dateStr: string) {
	return new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
	});
}

export const transactionsColumns: ColumnDef<FinanceExpense>[] = [
	{
		accessorKey: "note",
		header: "Descrição",
		enableSorting: false,
		cell: ({ row }) => (
			<div className="flex min-w-0 max-w-md items-center gap-2.5">
				<InstitutionMark
					name={row.original.sourceAccountName}
					provider={row.original.sourceProvider}
					size="lg"
				/>
				<p className="min-w-0 truncate text-sm font-medium text-foreground">
					{row.original.note || "Despesa"}
				</p>
			</div>
		),
	},
	{
		accessorKey: "category",
		header: "Categoria",
		enableSorting: false,
		cell: ({ row }) => {
			const category = row.original.category;
			const Icon = getCategoryIcon(category);

			return (
				<Badge
					className={cn(
						"h-6 gap-1 rounded-sm border-0 px-2 text-xs font-medium",
						getCategoryColor(category),
					)}
					variant="secondary"
				>
					<Icon aria-hidden className="size-3 shrink-0" />
					{category}
				</Badge>
			);
		},
	},
	{
		accessorKey: "amount",
		header: () => <div className="w-full text-right">Valor</div>,
		enableSorting: false,
		cell: ({ row }) => (
			<div className="text-right text-sm font-medium tabular-nums whitespace-nowrap text-red-500">
				<MaskedMonetaryValue
					format={formatBRLNegative}
					prefix="-R$"
					value={Number(row.original.amount)}
				/>
			</div>
		),
	},
	{
		accessorKey: "expenseDate",
		header: () => <div className="w-full text-right">Data</div>,
		enableSorting: false,
		cell: ({ row }) => (
			<span className="block text-right text-sm font-medium whitespace-nowrap text-muted-foreground">
				{formatExpenseDate(row.original.expenseDate)}
			</span>
		),
	},
];
