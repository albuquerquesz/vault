"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { useEffect, useMemo, useState } from "react";
import { useDeleteExpenses } from "@/features/finance/sdk";
import { transactionsColumns } from "./columns";
import { DataTable } from "./data-table";
import { TransactionsSelectionToolbar } from "./selection-toolbar";
export function TransactionsTable({ expenses, hasActiveFilters, monthLabel, month, activeFilterChips, onClearFilters, }) {
    const [rowSelection, setRowSelection] = useState({});
    const deleteExpenses = useDeleteExpenses(month);
    // Page already filters; keep newest-first display order.
    const orderedExpenses = useMemo(() => [...expenses].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)), [expenses]);
    // Drop selection when the visible dataset changes (month / filters).
    useEffect(() => {
        setRowSelection({});
    }, [orderedExpenses]);
    const selectedIds = useMemo(() => Object.keys(rowSelection).filter((id) => rowSelection[id]), [rowSelection]);
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
    return (_jsxs("div", { className: "relative", children: [selectedCount > 0 ? (_jsx("div", { className: "pointer-events-none sticky top-3 z-20 mb-0 flex h-0 justify-center px-2", children: _jsx("div", { className: "pointer-events-auto translate-y-1", children: _jsx(TransactionsSelectionToolbar, { isDeleting: deleteExpenses.isPending, onClear: () => setRowSelection({}), onDelete: handleDelete, selectedCount: selectedCount }) }) })) : null, _jsx(DataTable, { columns: transactionsColumns, data: orderedExpenses, getRowId: (row) => row.id, onRowSelectionChange: setRowSelection, pageSize: 10, rowSelection: rowSelection })] }));
}
