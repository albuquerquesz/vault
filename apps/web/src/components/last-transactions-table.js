"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from "@vault/ui/components/badge";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, } from "@vault/ui/components/card";
import { Skeleton } from "@vault/ui/components/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@vault/ui/components/tooltip";
import { Info, ReceiptTextIcon } from "lucide-react";
import { formatDate } from "@/components/formater";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import { useFinanceExpenses } from "@/features/finance/sdk";
const CATEGORY_COLORS = {
    Moradia: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Alimentação: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    Transporte: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Saúde: "bg-red-500/10 text-red-500 border-red-500/20",
    Lazer: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    Outros: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};
function _getCategoryColor(category) {
    return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Outros;
}
function formatBRL(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}
function SkeletonRow() {
    return (_jsxs("div", { className: "flex items-center justify-between gap-4 py-3", children: [_jsx(Skeleton, { className: "h-4 w-16 shrink-0" }), _jsx(Skeleton, { className: "h-5 w-20 shrink-0" }), _jsx(Skeleton, { className: "h-4 flex-1" }), _jsx(Skeleton, { className: "h-4 w-20 shrink-0" })] }));
}
export function LastTransactionsTable() {
    const expensesQuery = useFinanceExpenses();
    if (expensesQuery.isPending) {
        return (_jsxs(Card, { className: "financial-panel-border w-full min-h-[28rem] ring-0", children: [_jsx(CardHeader, { className: "border-b", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ReceiptTextIcon, { className: "size-4 text-muted-foreground" }), _jsx(CardDescription, { className: "text-base", children: "\u00DAltimas transa\u00E7\u00F5es" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { render: () => _jsx(Info, { className: "size-4 text-muted-foreground" }) }), _jsx(TooltipContent, { children: "\u00DAltimas transa\u00E7\u00F5es registradas" })] })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "divide-y", children: [_jsx(SkeletonRow, {}), _jsx(SkeletonRow, {}), _jsx(SkeletonRow, {}), _jsx(SkeletonRow, {}), _jsx(SkeletonRow, {})] }) })] }));
    }
    const expenses = expensesQuery.data ?? [];
    const lastFive = expenses.slice(0, 5);
    return (_jsxs(Card, { className: "financial-panel-border w-full min-h-[28rem] ring-0", children: [_jsx(CardHeader, { className: "border-b", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ReceiptTextIcon, { className: "size-4 text-muted-foreground" }), _jsx(CardDescription, { className: "text-base", children: "\u00DAltimas transa\u00E7\u00F5es" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { delay: 800, render: () => (_jsx(Info, { className: "mt-0.5 size-4 text-muted-foreground" })) }), _jsx(TooltipContent, { children: "\u00DAltimas transa\u00E7\u00F5es registradas" })] })] }) }), _jsx(CardContent, { children: lastFive.length === 0 ? (_jsx("div", { className: "py-8 text-center text-sm text-muted-foreground", children: "Nenhuma transa\u00E7\u00E3o neste m\u00EAs" })) : (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "divide-y", children: lastFive.map((expense) => (_jsxs("div", { className: "flex items-center justify-between gap-4 py-3", children: [_jsx("span", { className: "shrink-0 text-sm text-muted-foreground tabular-nums", children: formatDate(expense.expenseDate, "day-month") }), _jsx(Badge, { className: "shrink-0", variant: "outline", children: expense.category }), _jsx("span", { className: "min-w-0 flex-1 truncate text-sm", children: expense.note ?? "--" }), _jsx("span", { className: "shrink-0 text-sm tabular-nums", children: _jsx(MaskedMonetaryValue, { value: expense.amount, format: formatBRL }) })] }, expense.id))) }), _jsx("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" }), _jsx("div", { className: "flex justify-center pt-2", children: _jsx(Button, { className: "text-muted-foreground", size: "xs", variant: "ghost", children: "Ver mais" }) })] })) })] }));
}
