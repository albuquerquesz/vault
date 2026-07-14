"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import type { FinanceExpense } from "@/features/finance/sdk";
import { useDeleteExpenses } from "@/features/finance/sdk";
import { transactionsColumns } from "./columns";
import { DataTable } from "./data-table";
import { TransactionsSelectionToolbar } from "./selection-toolbar";
import { formatTransactionDayLabel } from "./utils";

export function TransactionsTable({
	expenses,
	monthLabel,
	month,
	hasActiveSearch = false,
}: {
	expenses: FinanceExpense[];
	monthLabel: string;
	/** YYYY-MM — used for cache invalidation after bulk delete. */
	month: string;
	hasActiveSearch?: boolean;
}) {
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const deleteExpenses = useDeleteExpenses(month);

	// Keep newest-first display order.
	const orderedExpenses = useMemo(
		() =>
			[...expenses].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)),
		[expenses],
	);

	// Drop selection when the visible dataset changes.
	useEffect(() => {
		setRowSelection({});
	}, [orderedExpenses]);

	const selectedIds = useMemo(
		() => Object.keys(rowSelection).filter((id) => rowSelection[id]),
		[rowSelection],
	);
	const selectedCount = selectedIds.length;

	const handleDelete = () => {
		if (selectedIds.length === 0 || deleteExpenses.isPending) {
			return;
		}

		deleteExpenses.mutate(selectedIds, {
			onSuccess: () => {
				setRowSelection({});
			},
		});
	};

	if (expenses.length === 0) {
		return (
			<div className="grid gap-3 px-6 py-12 text-center">
				<p className="text-sm font-medium text-foreground">
					{hasActiveSearch
						? "Nenhum resultado para a busca"
						: `Nenhuma transação em ${monthLabel}`}
				</p>
				<p className="max-w-md justify-self-center text-sm text-muted-foreground">
					{hasActiveSearch
						? "Tente outro termo de nota ou categoria."
						: "Quando despesas forem registradas, elas aparecerão aqui."}
				</p>
			</div>
		);
	}

	return (
		<>
			<DataTable
				columns={transactionsColumns}
				data={orderedExpenses}
				getGroupKey={(row) => row.expenseDate}
				getRowId={(row) => row.id}
				onRowSelectionChange={setRowSelection}
				pageSize={10}
				renderGroupHeader={(date) => formatTransactionDayLabel(date)}
				rowSelection={rowSelection}
			/>

			{/* Portal docks to viewport bottom — kept after table so it never sits in table layout. */}
			{selectedCount > 0 ? (
				<TransactionsSelectionToolbar
					isDeleting={deleteExpenses.isPending}
					onClear={() => setRowSelection({})}
					onDelete={handleDelete}
					selectedCount={selectedCount}
				/>
			) : null}
		</>
	);
}
