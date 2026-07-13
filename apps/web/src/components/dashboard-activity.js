import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CardContent, CardDescription, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { CreditCardIcon, FileTextIcon, RocketIcon, UserPlusIcon, } from "lucide-react";
import { DashboardCard } from "@/components/dashboard-card";
const items = [
    {
        title: "Invoice #1045 marked paid",
        time: "About 2 hours ago",
        icon: _jsx(CreditCardIcon, {}),
    },
    {
        title: "Jordan joined the team",
        time: "This morning",
        icon: _jsx(UserPlusIcon, {}),
    },
    {
        title: "Weekly summary exported",
        time: "Yesterday",
        icon: _jsx(FileTextIcon, {}),
    },
    {
        title: "Dashboard v2 shipped to prod",
        time: "2 days ago",
        icon: _jsx(RocketIcon, {}),
    },
];
export function DashboardActivity() {
    return (_jsxs(DashboardCard, { className: "gap-0", children: [_jsxs(CardHeader, { className: "border-b", children: [_jsx(CardTitle, { children: "Activity" }), _jsx(CardDescription, { children: "Latest updates in your workspace." })] }), _jsx(CardContent, { className: "px-0", children: _jsx("ul", { className: "flex flex-col divide-y divide-border", children: items.map((item) => (_jsxs("li", { className: "flex h-16 items-center gap-3 px-6", children: [_jsx("span", { "aria-hidden": "true", className: "flex size-10 shrink-0 items-center justify-center [&_svg]:size-4", children: item.icon }), _jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [_jsx("p", { className: "line-clamp-1 text-pretty text-foreground text-sm leading-snug", children: item.title }), _jsx("p", { className: "text-muted-foreground text-xs", children: item.time })] })] }, item.title))) }) })] }));
}
