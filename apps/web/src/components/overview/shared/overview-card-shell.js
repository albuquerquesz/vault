"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, } from "@vault/ui/components/card";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@vault/ui/components/tooltip";
import { cn } from "@vault/ui/lib/utils";
import { Info } from "lucide-react";
export function OverviewCardShell({ title, icon, tooltip, children, footer, className, contentClassName, headerClassName, }) {
    return (_jsxs(Card, { className: cn("financial-panel-border flex h-full min-h-[24rem] w-full flex-col ring-0", className), children: [_jsx(CardHeader, { className: cn("border-b", headerClassName), children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs(CardDescription, { className: "flex items-center gap-2 text-base", children: [icon, _jsx("span", { children: title })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { render: () => (_jsx(Info, { className: "mt-0.5 size-4 text-muted-foreground" })) }), _jsx(TooltipContent, { children: tooltip })] })] }) }), _jsx(CardContent, { className: contentClassName, children: children }), footer ? _jsx(CardFooter, { children: footer }) : null] }));
}
