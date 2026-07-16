"use client";

import type { Row, RowSelectionState } from "@tanstack/react-table";
import { Badge } from "@vault/ui/components/badge";
import { Checkbox } from "@vault/ui/components/checkbox";
import { cn } from "@vault/ui/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { InstitutionMark } from "@/components/institution-mark";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import {
	type FinanceTransaction,
	useDeleteExpenses,
	useHideTransactions,
} from "@/features/finance/sdk";
import { transactionsColumns } from "./columns";
import { DataTable } from "./data-table";
import { TransactionsSelectionToolbar } from "./selection-toolbar";
import {
	formatBRL,
	formatTransactionDayLabel,
	getCategoryColor,
	getCategoryIcon,
	isExpenseTransaction,
} from "./utils";

export function TransactionsTable({
	transactions,
	monthLabel,
	month,
	hasActiveFilters = false,
}: {
	transactions: FinanceTransaction[];
	monthLabel: string;
	/** YYYY-MM — used for cache invalidation after bulk delete. */
	month: string;
	hasActiveFilters?: boolean;
}) {
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const deleteExpenses = useDeleteExpenses(month);
	const hideTransactions = useHideTransactions(month);

	// Keep newest-first display order.
	const orderedTransactions = useMemo(
		() =>
			[...transactions].sort((a, b) => b.date.localeCompare(a.date)),
		[transactions],
	);

	// Drop selection when the visible dataset changes.
	useEffect(() => {
		setRowSelection({});
	}, [orderedTransactions]);

	const selectedTransactions = useMemo(
		() =>
			orderedTransactions.filter((transaction) => rowSelection[transaction.id]),
		[orderedTransactions, rowSelection],
	);
	const selectedManualIds = useMemo(
		() =>
			selectedTransactions
				.filter((transaction) => transaction.isDeletable)
				.map((transaction) => transaction.id),
		[selectedTransactions],
	);
	const selectedHideableIds = useMemo(
		() =>
			selectedTransactions
				.filter((transaction) => transaction.isHideable)
				.map((transaction) => transaction.id),
		[selectedTransactions],
	);
	const selectedCount = selectedTransactions.length;
	const isMutating =
		deleteExpenses.isPending || hideTransactions.isPending;

	const maskMobileDescription = (description: string, maxLength = 24) => {
		if (description.length <= maxLength) {
			return description;
		}

		return `${description.slice(0, maxLength)}…`;
	};

	const renderMobileTransactionRow = (row: Row<FinanceTransaction>) => {
		const transaction = row.original;
		const selectable = transaction.isDeletable || transaction.isHideable;
		const isExpense = isExpenseTransaction(transaction);
		const DirectionIcon = isExpense ? ArrowDownIcon : ArrowUpIcon;
		const CategoryIcon = getCategoryIcon(transaction.category);
		const description =
			transaction.description ||
			(transaction.kind === "income" ? "Entrada" : "Despesa");
		const mobileDescription = maskMobileDescription(description);

		return (
			<div
				className={cn(
					"rounded-2xl border border-border/60 bg-card/70 px-3 py-3 shadow-sm backdrop-blur-sm transition-colors",
					row.getIsSelected() && "border-primary/40 bg-muted/25",
				)}
				data-state={row.getIsSelected() ? "selected" : undefined}
			>
				<div className="flex min-w-0 items-start gap-2.5">
					<Checkbox
						aria-label="Selecionar transação"
						checked={row.getIsSelected()}
						className="mt-1 size-4 shrink-0 rounded-[2px]"
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
						name={transaction.sourceAccountName}
						provider={transaction.sourceProvider}
						size="md"
					/>
					<div className="min-w-0 flex-1 space-y-2">
						<div className="min-w-0">
							<p
								className="min-w-0 truncate pt-0.5 text-sm font-medium text-foreground"
								title={description}
							>
								{mobileDescription}
							</p>
						</div>
						<div className="flex min-w-0 items-center justify-between gap-3">
							<Badge
								className={cn(
									"min-w-0 max-w-full gap-1 rounded-full border-0 px-2.5 py-1 text-[11px] font-medium",
									getCategoryColor(transaction.category),
								)}
								title={transaction.category}
								variant="secondary"
							>
								<CategoryIcon className="size-3 shrink-0" />
								<span className="truncate">{transaction.category}</span>
							</Badge>
							<div className="flex shrink-0 items-center gap-1.5 text-sm font-medium tabular-nums whitespace-nowrap">
								<DirectionIcon
									aria-label={isExpense ? "Saída" : "Entrada"}
									className={cn(
										"size-3.5 shrink-0",
										isExpense ? "text-red-500" : "text-emerald-500",
									)}
								/>
								<MaskedMonetaryValue
									className="text-foreground"
									format={formatBRL}
									value={Math.abs(transaction.amount)}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const handleDelete = async () => {
		if (selectedCount === 0 || isMutating) {
			return;
		}

		try {
			if (selectedManualIds.length > 0) {
				await deleteExpenses.mutateAsync(selectedManualIds);
			}

			if (selectedHideableIds.length > 0) {
				await hideTransactions.mutateAsync(selectedHideableIds);
			}

			setRowSelection({});
		} catch {
			// Mutations already expose their own error state/UI upstream.
		}
	};

	if (transactions.length === 0) {
		return (
			<div className="grid gap-3 px-6 py-12 text-center">
				<p className="text-sm font-medium text-foreground">
					{hasActiveFilters
						? "Nenhum resultado para os filtros atuais"
						: `Nenhuma transação em ${monthLabel}`}
				</p>
				<p className="max-w-md justify-self-center text-sm text-muted-foreground">
					{hasActiveFilters
						? "Tente limpar a busca ou os filtros para expandir a lista."
						: "Quando transações forem sincronizadas ou registradas, elas aparecerão aqui."}
				</p>
			</div>
		);
	}

	return (
		<>
			<DataTable
				columns={transactionsColumns}
				data={orderedTransactions}
				enableRowSelection={(row) => row.isDeletable || row.isHideable}
				getGroupKey={(row) => row.date}
				getRowId={(row) => row.id}
				mobileRowRenderer={renderMobileTransactionRow}
				onRowSelectionChange={setRowSelection}
				pageSize={10}
				renderGroupHeader={(date) => formatTransactionDayLabel(date)}
				rowSelection={rowSelection}
			/>

			{/* Portal docks to viewport bottom — kept after table so it never sits in table layout. */}
			{selectedCount > 0 ? (
				<TransactionsSelectionToolbar
					actionLabel={
						selectedManualIds.length > 0 && selectedHideableIds.length > 0
							? "Excluir e ocultar"
							: selectedHideableIds.length > 0
								? "Ocultar"
								: "Excluir"
					}
					isDeleting={isMutating}
					onClear={() => setRowSelection({})}
					onDelete={() => void handleDelete()}
					selectedCount={selectedCount}
				/>
			) : null}
		</>
	);
}
