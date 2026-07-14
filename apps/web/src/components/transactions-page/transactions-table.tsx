"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import {
	type FinanceTransaction,
	useDeleteExpenses,
	useHideTransactions,
} from "@/features/finance/sdk";
import { transactionsColumns } from "./columns";
import { DataTable } from "./data-table";
import { TransactionsSelectionToolbar } from "./selection-toolbar";
import { formatTransactionDayLabel } from "./utils";

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
