"use client";

import { Button } from "@vault/ui/components/button";
import type { FinanceExpense } from "@/features/finance/sdk";
import { transactionsColumns } from "./columns";
import { DataTable } from "./data-table";
import type { TransactionsActiveFilterChip } from "./utils";

export function TransactionsTable({
	expenses,
	hasActiveFilters,
	monthLabel,
	activeFilterChips,
	onClearFilters,
}: {
	expenses: FinanceExpense[];
	hasActiveFilters: boolean;
	monthLabel: string;
	activeFilterChips: TransactionsActiveFilterChip[];
	onClearFilters: () => void;
}) {
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

	// Page already filters; keep newest-first display order.
	const orderedExpenses = [...expenses].sort((a, b) =>
		b.expenseDate.localeCompare(a.expenseDate),
	);

	return (
		<DataTable
			columns={transactionsColumns}
			data={orderedExpenses}
			pageSize={10}
		/>
	);
}
