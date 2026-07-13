"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { CardContent, CardDescription, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow, } from "@vault/ui/components/table";
import { ArrowRightIcon } from "lucide-react";
import { DashboardCard } from "@/components/dashboard-card";
const invoices = [
    {
        id: "1045",
        customer: "Northwind Labs",
        amount: "$2,400.00",
        status: "Paid",
    },
    {
        id: "1044",
        customer: "Blue River Co.",
        amount: "$890.00",
        status: "Pending",
    },
    {
        id: "1043",
        customer: "Oak Street Studio",
        amount: "$5,120.00",
        status: "Paid",
    },
    {
        id: "1042",
        customer: "Harbor Freight LLC",
        amount: "$310.50",
        status: "Overdue",
    },
];
export function DashboardInvoices() {
    return (_jsxs(DashboardCard, { className: "relative gap-0 md:col-span-2", children: [_jsxs(CardHeader, { className: "border-b", children: [_jsx(CardTitle, { className: "text-base", children: "Recent invoices" }), _jsx(CardDescription, { children: "Open amounts and payment status." })] }), _jsx(CardContent, { className: "mask-b-from-50% mask-b-to-100% px-0", children: _jsxs(Table, { children: [_jsx(TableCaption, { className: "sr-only", children: "Recent invoices with customer, amount, and status." }), _jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "ps-6", children: "Customer" }), _jsx(TableHead, { children: "Invoice" }), _jsx(TableHead, { className: "pe-6 text-right tabular-nums", children: "Amount" })] }) }), _jsx(TableBody, { children: invoices.map((inv) => (_jsxs(TableRow, { className: "h-12", children: [_jsx(TableCell, { className: "max-w-40 truncate ps-6 font-medium", children: inv.customer }), _jsxs(TableCell, { className: "text-muted-foreground tabular-nums", children: ["#", inv.id] }), _jsx(TableCell, { className: "pe-6 text-right tabular-nums", children: inv.amount })] }, inv.id))) })] }) }), _jsx("div", { className: "mask-t-from-30% absolute inset-x-0 bottom-0 flex h-1/5 items-center justify-center bg-background", children: _jsxs(Button, { className: "relative", variant: "ghost", render: _jsx("a", { href: "/#" }), nativeButton: false, children: ["View All", _jsx(ArrowRightIcon, { "aria-hidden": "true" })] }) })] }));
}
