"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@vault/ui/components/badge";
import { Checkbox } from "@vault/ui/components/checkbox";
import { cn } from "@vault/ui/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { InstitutionMark } from "@/components/institution-mark";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import type { FinanceExpense } from "@/features/finance/sdk";
import { formatBRL, getCategoryColor, getCategoryIcon } from "./utils";

/** All `FinanceExpense` rows are outflows today; keep the branch for future income. */
function isExpenseAmount(amount: number) {
	return amount >= 0;
}

export const transactionsColumns: ColumnDef<FinanceExpense>[] = [
	{
		accessorKey: "note",
		header: "Descrição",
		enableSorting: false,
		cell: ({ row }) => (
			<div className="flex min-w-0 max-w-md items-center gap-2">
				<Checkbox
					aria-label="Selecionar transação"
					checked={row.getIsSelected()}
					className="size-3.5 shrink-0 aspect-square rounded-[2px]"
					onCheckedChange={(checked) => {
						row.toggleSelected(checked === true);
					}}
					onClick={(event) => event.stopPropagation()}
				/>
				<InstitutionMark
					name={row.original.sourceAccountName}
					provider={row.original.sourceProvider}
					size="md"
				/>
				<p className="min-w-0 truncate text-xs font-medium text-foreground sm:text-sm">
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
						"h-5 gap-1 rounded-sm border-0 px-1.5 text-[11px] font-medium sm:h-6 sm:text-xs",
						getCategoryColor(category),
					)}
					variant="secondary"
				>
					<Icon aria-hidden className="size-2.5 shrink-0 sm:size-3" />
					{category}
				</Badge>
			);
		},
	},
	{
		accessorKey: "amount",
		header: () => <div className="w-full text-right">Valor</div>,
		enableSorting: false,
		cell: ({ row }) => {
			const amount = Number(row.original.amount);
			const isExpense = isExpenseAmount(amount);
			const DirectionIcon = isExpense ? ArrowDownIcon : ArrowUpIcon;

			return (
				<div className="flex items-center justify-end gap-1 text-xs font-medium tabular-nums whitespace-nowrap text-white sm:text-sm">
					<DirectionIcon
						aria-label={isExpense ? "Saída" : "Entrada"}
						className={cn(
							"size-3.5 shrink-0 sm:size-4",
							isExpense ? "text-red-500" : "text-emerald-500",
						)}
					/>
					<span className="text-white">
						<MaskedMonetaryValue
							format={formatBRL}
							prefix="R$"
							value={Math.abs(amount)}
						/>
					</span>
				</div>
			);
		},
	},
];