import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from "@vault/ui/components/badge";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, } from "@vault/ui/components/sheet";
import { useMemo, useState } from "react";
import { formatFullCurrency } from "@/components/formater";
import Loader from "@/components/loader";
import { getMonthValue, useCreateExpense, useFinanceExpenses, } from "@/features/finance/sdk";
const categories = [
    "Moradia",
    "Alimentação",
    "Transporte",
    "Saúde",
    "Lazer",
    "Outros",
];
export function ExpensesPage() {
    const currentMonth = useMemo(() => getMonthValue(), []);
    const expensesQuery = useFinanceExpenses(currentMonth);
    const createExpense = useCreateExpense(currentMonth);
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        amount: "",
        category: categories[0],
        note: "",
    });
    async function onAddExpense(event) {
        event.preventDefault();
        const amount = Number(form.amount);
        if (!form.date || Number.isNaN(amount) || amount <= 0)
            return;
        await createExpense.mutateAsync({
            date: form.date,
            amount,
            category: form.category,
            note: form.note.trim() || undefined,
        });
        setForm((prev) => ({
            ...prev,
            date: new Date().toISOString().slice(0, 10),
            amount: "",
            note: "",
        }));
        setIsOpen(false);
    }
    if (expensesQuery.isPending) {
        return _jsx(Loader, {});
    }
    if (expensesQuery.isError) {
        return (_jsxs(Card, { className: "border-0", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Lista de despesas" }) }), _jsx(CardContent, { className: "text-sm text-muted-foreground", children: "N\u00E3o foi poss\u00EDvel carregar as despesas." })] }));
    }
    const expenses = expensesQuery.data ?? [];
    return (_jsxs("div", { className: "grid gap-4", children: [_jsxs(Card, { className: "border-0", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between gap-4", children: [_jsx(CardTitle, { className: "text-2xl", style: { fontFamily: '"Space Grotesk", sans-serif' }, children: "Lista de despesas" }), _jsx(Button, { onClick: () => setIsOpen(true), size: "sm", children: "Adicionar despesa" })] }), _jsx(CardContent, { className: "grid gap-2", children: expenses.length === 0 ? (_jsx("div", { className: "rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground", children: "Nenhuma despesa cadastrada neste mes." })) : (expenses.map((expense) => (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 border border-border p-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: expense.note ?? "Despesa" }), _jsx("p", { className: "text-sm text-muted-foreground", children: expense.expenseDate })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Badge, { variant: "outline", children: expense.category }), _jsx("p", { className: "font-semibold", children: formatFullCurrency(expense.amount) })] })] }, expense.id)))) })] }), _jsx(Sheet, { open: isOpen, onOpenChange: setIsOpen, children: _jsxs(SheetContent, { side: "right", children: [_jsx(SheetHeader, { children: _jsx(SheetTitle, { children: "Adicionar despesa" }) }), _jsxs("form", { className: "mt-4 grid gap-3", onSubmit: onAddExpense, children: [_jsxs("div", { className: "grid gap-1.5", children: [_jsx(Label, { htmlFor: "expense-date", children: "Data" }), _jsx(Input, { id: "expense-date", type: "date", value: form.date, onChange: (e) => setForm((prev) => ({ ...prev, date: e.target.value })) })] }), _jsxs("div", { className: "grid gap-1.5", children: [_jsx(Label, { htmlFor: "expense-amount", children: "Valor" }), _jsx(Input, { id: "expense-amount", type: "number", step: "0.01", min: 0.01, value: form.amount, onChange: (e) => setForm((prev) => ({ ...prev, amount: e.target.value })), required: true })] }), _jsxs("div", { className: "grid gap-1.5", children: [_jsx(Label, { htmlFor: "expense-category", children: "Categoria" }), _jsx("select", { id: "expense-category", className: "h-9 rounded-md border border-input bg-background px-3 text-sm", value: form.category, onChange: (e) => setForm((prev) => ({ ...prev, category: e.target.value })), children: categories.map((category) => (_jsx("option", { value: category, children: category }, category))) })] }), _jsxs("div", { className: "grid gap-1.5", children: [_jsx(Label, { htmlFor: "expense-note", children: "Observa\u00E7\u00E3o (opcional)" }), _jsx(Input, { id: "expense-note", placeholder: "Para que foi esta despesa?", value: form.note, onChange: (e) => setForm((prev) => ({ ...prev, note: e.target.value })) })] }), _jsx(Button, { type: "submit", disabled: createExpense.isPending, children: createExpense.isPending ? "Salvando..." : "Salvar despesa" })] })] }) })] }));
}
