"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@vault/ui/components/badge";
import { Checkbox } from "@vault/ui/components/checkbox";
import { cn } from "@vault/ui/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { InstitutionMark } from "@/components/institution-mark";
import type { FinanceTransaction } from "@/features/finance/sdk";
import { formatBRL, getCategoryColor, getCategoryIcon } from "./utils";

function isExpenseAmount(amount: number) {
	return amount < 0;
}

export const transactionsColumns: ColumnDef<FinanceTransaction>[] = [
	{
		accessorKey: "description",
		header: "Descrição",
		enableSorting: false,
		cell: ({ row }) => {
			const selectable =
				row.original.isDeletable || row.original.isHideable;

			return (
				<div className="flex min-w-0 max-w-[19rem] items-center gap-2 lg:max-w-[16rem] xl:max-w-[19rem]">
					<Checkbox
						aria-label="Selecionar transação"
						checked={row.getIsSelected()}
						className="size-3.5 shrink-0 aspect-square rounded-[2px]"
						disabled={!selectable}
						onCheckedChange={(checked) => {
							if (!selectable) {
								return;
							}
							row.toggleSelected(checked === true);
						}}
						onClick={(event) => event.stopPropagation()}
					/>
					<InstitutionMark
						name={row.original.sourceAccountName}
						provider={row.original.sourceProvider}
						size="md"
					/>
					<p
						className="min-w-0 flex-1 truncate text-xs font-medium text-foreground sm:text-sm"
						title={
							row.original.description ||
							(row.original.kind === "income" ? "Entrada" : "Despesa")
						}
					>
						{row.original.description ||
							(row.original.kind === "income" ? "Entrada" : "Despesa")}
					</p>
				</div>
			);
		},
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
						"h-5 max-w-[11rem] gap-1 rounded-sm border-0 px-1.5 text-[11px] font-medium sm:h-6 sm:max-w-[12rem] sm:text-xs",
						getCategoryColor(category),
					)}
					title={category}
					variant="secondary"
				>
					<Icon aria-hidden className="size-2.5 shrink-0 sm:size-3" />
					<span className="truncate">{category}</span>
				</Badge>
			);
		},
	},
	{
		accessorKey: "amount",
		header: () => <div className="w-full text-right">Valor</div>,
		enableSorting: false,
		cell: ({ row }) => {
			const amount = row.original.amount;
			const isExpense = isExpenseAmount(amount);
			const DirectionIcon = isExpense ? ArrowDownIcon : ArrowUpIcon;

			return (
				<div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center justify-end gap-1.5 text-xs font-medium tabular-nums whitespace-nowrap sm:text-sm">
					<DirectionIcon
						aria-label={isExpense ? "Saída" : "Entrada"}
						className={cn(
							"size-3.5 shrink-0 sm:size-4",
							isExpense ? "text-red-500" : "text-emerald-500",
						)}
					/>
					<span className="text-right text-foreground">
						{formatBRL(Math.abs(amount))}
					</span>
				</div>
			);
		},
	},
];
