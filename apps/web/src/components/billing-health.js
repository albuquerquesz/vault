import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { CardContent, CardDescription, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from "@vault/ui/components/empty";
import { ArrowRightIcon, CircleCheckIcon } from "lucide-react";
import { DashboardCard } from "@/components/dashboard-card";
export function BillingHealth() {
    return (_jsxs(DashboardCard, { className: "gap-0", children: [_jsxs(CardHeader, { className: "border-b", children: [_jsx(CardTitle, { className: "text-balance text-base", children: "Billing health" }), _jsx(CardDescription, { className: "text-pretty", children: "Nothing urgent needs your attention." })] }), _jsx(CardContent, { className: "flex h-full items-center px-0", children: _jsxs(Empty, { children: [_jsxs(EmptyHeader, { children: [_jsx(EmptyMedia, { variant: "icon", children: _jsx(CircleCheckIcon, { "aria-hidden": "true" }) }), _jsx(EmptyTitle, { children: "You're caught up." }), _jsx(EmptyDescription, { className: "text-xs", children: "Balances and payouts look fine. nothing overdue in this snapshot." })] }), _jsx(EmptyContent, { children: _jsxs(Button, { variant: "ghost", render: _jsx("a", { href: "/#" }), nativeButton: false, children: ["Review open invoices", _jsx(ArrowRightIcon, { "aria-hidden": "true" })] }) })] }) })] }));
}
