"use client";

import type { Row } from "@tanstack/react-table";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@vault/ui/components/badge";
import { cn } from "@vault/ui/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useMemo } from "react";
import { InstitutionMark } from "@/components/institution-mark";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import type { FinanceTransaction } from "@/features/finance/sdk";
import { transactionsColumns } from "./columns";
import { DataTable } from "./data-table";
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
	hasActiveFilters = false,
}: {
	transactions: FinanceTransaction[];
	monthLabel: string;
	hasActiveFilters?: boolean;
}) {
	const navigate = useNavigate();

	const openTransaction = (transaction: FinanceTransaction) => {
		if (transaction.source !== "pluggy") {
			return;
		}

		void navigate({
			to: "/transactions/$transactionId",
			params: { transactionId: transaction.id },
		});
	};

	// Keep newest-first display order.
	const orderedTransactions = useMemo(
		() =>
			[...transactions].sort((a, b) => b.date.localeCompare(a.date)),
		[transactions],
	);

	const maskMobileDescription = (description: string, maxLength = 24) => {
		if (description.length <= maxLength) {
			return description;
		}

		return `${description.slice(0, maxLength)}…`;
	};

	const renderMobileTransactionRow = (row: Row<FinanceTransaction>) => {
		const transaction = row.original;
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
					"min-h-[4.5rem] rounded-2xl border border-border/60 bg-card/70 px-3 py-3.5 shadow-sm backdrop-blur-sm transition-colors",
					transaction.source === "pluggy" &&
						"cursor-pointer hover:border-border hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
				)}
				onClick={
					transaction.source === "pluggy"
						? () => openTransaction(transaction)
						: undefined
				}
				onKeyDown={
					transaction.source === "pluggy"
						? (event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									openTransaction(transaction);
								}
						  }
						: undefined
				}
				role={transaction.source === "pluggy" ? "link" : undefined}
				tabIndex={transaction.source === "pluggy" ? 0 : undefined}
			>
				<div className="flex min-w-0 items-start gap-2.5">
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
				getGroupKey={(row) => row.date}
				getRowId={(row) => row.id}
				mobileRowRenderer={renderMobileTransactionRow}
				onRowClick={(row) => openTransaction(row.original)}
				isRowClickable={(row) => row.original.source === "pluggy"}
				pageSize={10}
				renderGroupHeader={(date) => formatTransactionDayLabel(date)}
			/>
		</>
	);
}
