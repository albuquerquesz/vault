import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
const stats = [
    {
        label: "Receita total",
        value: "$284,920",
        delta: 8.2,
        hint: "vs 30 dias anteriores",
    },
    {
        label: "Pedidos",
        value: "1,842",
        delta: 4.1,
        hint: "vs 30 dias anteriores",
    },
    {
        label: "Ticket médio",
        value: "$154.60",
        delta: -1.3,
        hint: "vs 30 dias anteriores",
    },
    {
        label: "Conversão da loja",
        value: "3.06%",
        delta: 0.6,
        hint: "vs 30 dias anteriores",
    },
];
export function DashboardStats() {
    return (_jsx(_Fragment, { children: stats.map((s) => (_jsx(StatCard, { stat: s }, s.label))) }));
}
function StatCard({ stat }) {
    const { label, value, delta, hint } = stat;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "font-normal text-muted-foreground text-xs", children: label }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-balance font-semibold text-2xl tabular-nums tracking-tight", children: value }) }), _jsxs(CardFooter, { className: "gap-1.5 text-xs", children: [_jsxs(Delta, { value: delta, variant: "default", children: [_jsx(DeltaIcon, {}), _jsx(DeltaValue, {})] }), _jsx("span", { className: "text-pretty text-muted-foreground", children: hint })] })] }));
}
