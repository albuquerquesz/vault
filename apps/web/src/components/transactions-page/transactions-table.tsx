"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import { Button } from "@vault/ui/components/button";
import { useEffect, useMemo, useState } from "react";
import type { FinanceExpense } from "@/features/finance/sdk";
import { useDeleteExpenses } from "@/features/finance/sdk";
import { transactionsColumns } from "./columns";
import { DataTable } from "./data-table";
import { TransactionsSelectionToolbar } from "./selection-toolbar";
import type { TransactionsActiveFilterChip } from "./utils";

export function TransactionsTable({
	expenses,
	hasActiveFilters,
	monthLabel,
	month,
	activeFilterChips,
	onClearFilters,
}: {
	expenses: FinanceExpense[];
	hasActiveFilters: boolean;
	monthLabel: string;
	/** YYYY-MM — used for cache invalidation after bulk delete. */
	month: string;
	activeFilterChips: TransactionsActiveFilterChip[];
	onClearFilters: () => void;
}) {
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const deleteExpenses = useDeleteExpenses(month);

	// Page already filters; keep newest-first display order.
	const orderedExpenses = useMemo(
		() =>
			[...expenses].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)),
		[expenses],
	);

	// Drop selection when the visible dataset changes (month / filters).
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
					{hasActiveFilters
						? "Nenhum resultado para os filtros atuais"
						: `Nenhuma transação em ${monthLabel}`}
				</p>
				<p className="max-w-md justify-self-center text-sm text-muted-foreground">
					{hasActiveFilters
						? activeFilterChips.length > 0
							? `Nenhum lançamento corresponde a ${activeFilterChips
									.map((chip) => chip.label.toLowerCase())
									.join(" e ")}.`
							: "Tente limpar os filtros para expandir a lista."
						: "Quando despesas forem registradas, elas aparecerão aqui."}
				</p>
				{hasActiveFilters ? (
					<div>
						<Button onClick={onClearFilters} variant="outline">
							Limpar filtros
						</Button>
					</div>
				) : null}
			</div>
		);
	}

	return (
		<>
			{selectedCount > 0 ? (
				<TransactionsSelectionToolbar
					isDeleting={deleteExpenses.isPending}
					onClear={() => setRowSelection({})}
					onDelete={handleDelete}
					selectedCount={selectedCount}
				/>
			) : null}

			<DataTable
				columns={transactionsColumns}
				data={orderedExpenses}
				getRowId={(row) => row.id}
				onRowSelectionChange={setRowSelection}
				pageSize={10}
				rowSelection={rowSelection}
			/>
		</>
	);
}
