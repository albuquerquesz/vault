"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { useMemo, useState } from "react";
import { MonetaryVisibilityProvider } from "@/components/monetary-visibility";
import { PageContent } from "@/components/page-content";
import { getMonthValue, useFinanceExpenses } from "@/features/finance/sdk";
import { TransactionsFilters } from "./transactions-page/transactions-filters";
import { TransactionsSkeleton } from "./transactions-page/transactions-skeleton";
import { TransactionsTable } from "./transactions-page/transactions-table";
export function TransactionsPage() {
    const currentMonth = useMemo(() => getMonthValue(), []);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const expensesQuery = useFinanceExpenses(selectedMonth);
    const filteredExpenses = useMemo(() => {
        const data = expensesQuery.data;
        if (!data)
            return [];
        let filtered = [...data];
        if (categoryFilter !== "all") {
            filtered = filtered.filter((expense) => expense.category === categoryFilter);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((expense) => expense.category.toLowerCase().includes(query) ||
                expense.note?.toLowerCase().includes(query));
        }
        return filtered;
    }, [expensesQuery.data, categoryFilter, searchQuery]);
    const categories = useMemo(() => {
        const values = new Set((expensesQuery.data ?? [])
            .map((expense) => expense.category?.trim())
            .filter((category) => Boolean(category)));
        return Array.from(values).sort((left, right) => left.localeCompare(right, "pt-BR"));
    }, [expensesQuery.data]);
    const monthLabel = useMemo(() => {
        const date = new Date(`${selectedMonth}-01T12:00:00`);
        return date.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
        });
    }, [selectedMonth]);
    const monthOptions = useMemo(() => {
        const options = [];
        const date = new Date();
        for (let index = 0; index < 6; index++) {
            const next = new Date(date.getFullYear(), date.getMonth() - index, 1);
            const value = getMonthValue(next);
            const label = next.toLocaleDateString("pt-BR", {
                month: "short",
                year: "numeric",
            });
            options.push({ value, label });
        }
        return options;
    }, []);
    const hasActiveFilters = categoryFilter !== "all" || searchQuery.trim().length > 0;
    const activeFilterChips = useMemo(() => {
        const chips = [];
        if (categoryFilter !== "all") {
            chips.push({
                label: `Categoria: ${categoryFilter}`,
                onRemove: () => setCategoryFilter("all"),
            });
        }
        if (searchQuery.trim()) {
            chips.push({
                label: `Busca: ${searchQuery.trim()}`,
                onRemove: () => setSearchQuery(""),
            });
        }
        return chips;
    }, [categoryFilter, searchQuery]);
    const clearFilters = () => {
        setCategoryFilter("all");
        setSearchQuery("");
    };
    if (expensesQuery.isPending) {
        return (_jsx(PageContent, { className: "pt-6", children: _jsx(TransactionsSkeleton, {}) }));
    }
    if (expensesQuery.isError) {
        return (_jsx(PageContent, { className: "pt-6", children: _jsxs(Card, { className: "financial-panel-border ring-0", children: [_jsxs(CardHeader, { className: "border-b", children: [_jsx(CardDescription, { className: "text-base", children: "Erro ao carregar" }), _jsx(CardTitle, { className: "text-2xl", children: "N\u00E3o foi poss\u00EDvel abrir o extrato" })] }), _jsxs(CardContent, { className: "grid gap-4", children: [_jsx("p", { className: "max-w-xl text-sm text-muted-foreground", children: "As transa\u00E7\u00F5es n\u00E3o puderam ser carregadas agora. Tente novamente para recarregar a lista deste m\u00EAs." }), _jsx("div", { children: _jsx(Button, { onClick: () => void expensesQuery.refetch(), children: "Tentar novamente" }) })] })] }) }));
    }
    return (_jsx(MonetaryVisibilityProvider, { children: _jsx(PageContent, { className: "grid gap-3 pt-6", children: _jsxs("div", { className: "flex flex-col gap-4", children: [_jsx(TransactionsFilters, { selectedMonth: selectedMonth, onSelectedMonthChange: setSelectedMonth, monthOptions: monthOptions, categoryFilter: categoryFilter, onCategoryFilterChange: setCategoryFilter, categories: categories, searchQuery: searchQuery, onSearchQueryChange: setSearchQuery, hasActiveFilters: hasActiveFilters, activeFilterChips: activeFilterChips, onClearFilters: clearFilters }), _jsx(TransactionsTable, { expenses: filteredExpenses, hasActiveFilters: hasActiveFilters, monthLabel: monthLabel, activeFilterChips: activeFilterChips, onClearFilters: clearFilters })] }) }) }));
}
