import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import { ChevronRightIcon, DownloadIcon, MegaphoneIcon, SettingsIcon, TruckIcon, } from "lucide-react";
const actions = [
    {
        title: "Add Campaign",
        description: "Launch a new campaign and reach more customers.",
        href: "#",
        icon: MegaphoneIcon,
    },
    {
        title: "Review unfulfilled",
        description: "Check orders that still need to be packed and shipped.",
        href: "#",
        icon: TruckIcon,
    },
    {
        title: "Workspace settings",
        description: "Manage billing, permissions, and your workspace details.",
        href: "#",
        icon: SettingsIcon,
    },
    {
        title: "Export sales",
        description: "Download your latest sales data as a CSV file.",
        href: "#",
        icon: DownloadIcon,
    },
];
export function QuickActions() {
    return (_jsxs(Card, { className: "financial-panel-border ring-0", children: [_jsx(CardHeader, { className: "gap-4 pb-4", children: _jsx(CardTitle, { children: "Quick actions" }) }), _jsx(CardContent, { children: _jsx("div", { className: "flex flex-col", children: actions.map((a) => (_jsxs("a", { href: a.href, className: cn("group flex items-start gap-4 rounded-[1.25rem] px-0 py-4 transition-colors", "hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"), children: [_jsx("div", { className: "flex size-9 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-muted-foreground transition-colors group-hover:text-foreground", children: _jsx(a.icon, { "aria-hidden": "true", className: "size-4" }) }), _jsxs("div", { className: "min-w-0 flex-1 space-y-1.5", children: [_jsx("div", { className: "text-[1.02rem] font-medium tracking-tight text-foreground", children: a.title }), _jsx("p", { className: "max-w-[28ch] text-sm leading-6 text-muted-foreground", children: a.description })] }), _jsx("div", { className: "flex h-9 shrink-0 items-center", children: _jsx(ChevronRightIcon, { "aria-hidden": "true", className: "size-4 shrink-0 text-muted-foreground transition-transform transition-colors group-hover:translate-x-0.5 group-hover:text-foreground" }) })] }, a.title))) }) })] }));
}
