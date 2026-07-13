"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@vault/ui/components/badge";
import { Checkbox } from "@vault/ui/components/checkbox";
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
				<Checkbox
					aria-label="Selecionar transação"
					checked={row.getIsSelected()}
					className="size-4 shrink-0 rounded-sm"
					onCheckedChange={(checked) => {
						row.toggleSelected(checked === true);
					}}
					onClick={(event) => event.stopPropagation()}
				/>
				<InstitutionMark
					name={row.original.sourceAccountName}
					provider={row.original.sourceProvider}
					size="lg"
				/>
				<p className="min-w-0 truncate text-base font-medium text-foreground">
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
						"h-7 gap-1 rounded-sm border-0 px-2 text-sm font-medium",
						getCategoryColor(category),
					)}
					variant="secondary"
				>
					<Icon aria-hidden className="size-3.5 shrink-0" />
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
			<div className="text-right text-base font-medium tabular-nums whitespace-nowrap text-red-500">
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
			<span className="block text-right text-base font-medium whitespace-nowrap text-muted-foreground">
				{formatExpenseDate(row.original.expenseDate)}
			</span>
		),
	},
];
