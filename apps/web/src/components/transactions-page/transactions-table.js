"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { transactionsColumns } from "./columns";
import { DataTable } from "./data-table";
export function TransactionsTable({ expenses, hasActiveFilters, monthLabel, activeFilterChips, onClearFilters, }) {
    if (expenses.length === 0) {
        return (_jsxs("div", { className: "grid gap-3 px-6 py-12 text-center", children: [_jsx("p", { className: "text-sm font-medium text-foreground", children: hasActiveFilters
                        ? "Nenhum resultado para os filtros atuais"
                        : `Nenhuma transação em ${monthLabel}` }), _jsx("p", { className: "max-w-md justify-self-center text-sm text-muted-foreground", children: hasActiveFilters
                        ? activeFilterChips.length > 0
                            ? `Nenhum lançamento corresponde a ${activeFilterChips
                                .map((chip) => chip.label.toLowerCase())
                                .join(" e ")}.`
                            : "Tente limpar os filtros para expandir a lista."
                        : "Quando despesas forem registradas, elas aparecerão aqui." }), hasActiveFilters ? (_jsx("div", { children: _jsx(Button, { onClick: onClearFilters, variant: "outline", children: "Limpar filtros" }) })) : null] }));
    }
    // Page already filters; keep newest-first display order.
    const orderedExpenses = [...expenses].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
    return (_jsx(DataTable, { columns: transactionsColumns, data: orderedExpenses, getRowId: (row) => row.id, pageSize: 10 }));
}
