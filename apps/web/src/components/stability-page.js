import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import { useEffect, useMemo, useState } from "react";
import { formatFullCurrency, formatPercent } from "@/components/formater";
import Loader from "@/components/loader";
import { getMonthValue, getTodayValue, useFinanceMonthlyOverview, useUpsertMonthlyBudget, } from "@/features/finance/sdk";
export function StabilityPage() {
    const month = useMemo(() => getMonthValue(), []);
    const today = useMemo(() => getTodayValue(), []);
    const overviewQuery = useFinanceMonthlyOverview(month, today);
    const saveBudget = useUpsertMonthlyBudget(month, today);
    const [salary, setSalary] = useState(0);
    useEffect(() => {
        if (overviewQuery.data) {
            setSalary(overviewQuery.data.income);
        }
    }, [overviewQuery.data]);
    const metrics = useMemo(() => overviewQuery.data ?? {
        month,
        income: salary,
        spent: 0,
        spentPercentage: 0,
        remainingBudget: salary,
        remainingDays: 0,
        dailyCap: 0,
    }, [month, overviewQuery.data, salary]);
    async function onSaveBudget() {
        if (salary <= 0)
            return;
        await saveBudget.mutateAsync({
            month,
            income: salary,
        });
    }
    if (overviewQuery.isPending) {
        return _jsx(Loader, {});
    }
    if (overviewQuery.isError) {
        return (_jsxs(Card, { className: "financial-panel-border", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Planejador de estabilidade" }) }), _jsx(CardContent, { className: "text-sm text-muted-foreground", children: "N\u00E3o foi poss\u00EDvel carregar os indicadores financeiros." })] }));
    }
    return (_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs(Card, { className: "financial-panel-border md:col-span-2", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Planejador de estabilidade" }) }), _jsxs(CardContent, { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Sal\u00E1rio mensal" }), _jsx(Input, { className: "mt-2", type: "number", min: 1, value: salary, onChange: (e) => setSalary(Math.max(0, Number(e.target.value || 0))) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total gasto neste m\u00EAs" }), _jsx("div", { className: "mt-2 flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-foreground", children: formatFullCurrency(metrics.spent) })] }), _jsx("div", { className: "md:col-span-2", children: _jsx(Button, { onClick: onSaveBudget, disabled: saveBudget.isPending || salary <= 0, children: saveBudget.isPending ? "Salvando..." : "Salvar salário do mês" }) })] })] }), _jsxs(Card, { className: "financial-panel-border", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Percentual gasto" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-3xl font-semibold", children: formatPercent(metrics.spentPercentage, 1) }) })] }), _jsxs(Card, { className: "financial-panel-border", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Or\u00E7amento restante" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-3xl font-semibold", children: formatFullCurrency(Math.max(0, metrics.remainingBudget)) }) })] }), _jsxs(Card, { className: "financial-panel-border", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Dias restantes" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-3xl font-semibold", children: metrics.remainingDays }) })] }), _jsxs(Card, { className: "financial-panel-border", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Gasto di\u00E1rio m\u00E1ximo recomendado" }) }), _jsxs(CardContent, { children: [_jsx("p", { className: "text-3xl font-semibold", children: formatFullCurrency(metrics.dailyCap) }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "F\u00F3rmula: (sal\u00E1rio - gasto) / dias restantes." })] })] })] }));
}
