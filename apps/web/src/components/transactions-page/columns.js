"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from "@vault/ui/components/badge";
import { Checkbox } from "@vault/ui/components/checkbox";
import { cn } from "@vault/ui/lib/utils";
import { InstitutionMark } from "@/components/institution-mark";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { formatBRLNegative, getCategoryColor, getCategoryIcon } from "./utils";
function formatExpenseDate(dateStr) {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
    });
}
export const transactionsColumns = [
    {
        accessorKey: "note",
        header: "Descrição",
        enableSorting: false,
        cell: ({ row }) => (_jsxs("div", { className: "flex min-w-0 max-w-md items-center gap-2.5", children: [_jsx(Checkbox, { "aria-label": "Selecionar transa\u00E7\u00E3o", checked: row.getIsSelected(), className: "size-4 shrink-0 rounded-sm", onCheckedChange: (checked) => {
                        row.toggleSelected(checked === true);
                    }, onClick: (event) => event.stopPropagation() }), _jsx(InstitutionMark, { name: row.original.sourceAccountName, provider: row.original.sourceProvider, size: "lg" }), _jsx("p", { className: "min-w-0 truncate text-sm font-medium text-foreground", children: row.original.note || "Despesa" })] })),
    },
    {
        accessorKey: "category",
        header: "Categoria",
        enableSorting: false,
        cell: ({ row }) => {
            const category = row.original.category;
            const Icon = getCategoryIcon(category);
            return (_jsxs(Badge, { className: cn("h-6 gap-1 rounded-sm border-0 px-2 text-xs font-medium", getCategoryColor(category)), variant: "secondary", children: [_jsx(Icon, { "aria-hidden": true, className: "size-3 shrink-0" }), category] }));
        },
    },
    {
        accessorKey: "amount",
        header: () => _jsx("div", { className: "w-full text-right", children: "Valor" }),
        enableSorting: false,
        cell: ({ row }) => (_jsx("div", { className: "text-right text-sm font-medium tabular-nums whitespace-nowrap text-red-500", children: _jsx(MaskedMonetaryValue, { format: formatBRLNegative, prefix: "-R$", value: Number(row.original.amount) }) })),
    },
    {
        accessorKey: "expenseDate",
        header: () => _jsx("div", { className: "w-full text-right", children: "Data" }),
        enableSorting: false,
        cell: ({ row }) => (_jsx("span", { className: "block text-right text-sm font-medium whitespace-nowrap text-muted-foreground", children: formatExpenseDate(row.original.expenseDate) })),
    },
];
