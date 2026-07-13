"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { InstitutionMark } from "@/components/institution-mark";
const fmt = (value) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
}).format(value);
export function MonthlyBillContent({ totalBill, items, }) {
    return (_jsxs("div", { className: "flex flex-1 flex-col gap-6", children: [_jsx("div", { className: "text-3xl font-semibold tabular-nums", children: fmt(totalBill) }), _jsx("div", { className: "space-y-8", children: items.map((item) => {
                    const itemPct = item.totalAmount > 0
                        ? (item.paidAmount / item.totalAmount) * 100
                        : 0;
                    return (_jsxs("div", { className: "flex items-center justify-between gap-4 text-base", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2.5", children: [_jsx(InstitutionMark, { name: item.name, provider: item.provider, size: "sm" }), _jsx("span", { className: "truncate font-medium", children: item.name })] }), _jsxs("div", { className: "flex shrink-0 items-center gap-2 tabular-nums text-lg", children: [_jsx("span", { children: fmt(item.paidAmount) }), _jsxs("span", { className: "text-muted-foreground", children: ["/ ", fmt(item.totalAmount)] }), _jsxs("span", { className: "inline-flex items-center rounded-full bg-muted px-2 py-1 text-sm tabular-nums", children: [itemPct.toFixed(0), "%"] })] })] }, item.id ?? item.name));
                }) })] }));
}
