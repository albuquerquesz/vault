"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { ArrowUpRightIcon } from "lucide-react";
export function DashboardCardLinkButton({ to, label, className, }) {
    return (_jsx(Button, { "aria-label": label, className: cn("size-8 rounded-full text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground", className), render: _jsx(Link, { to: to }), size: "icon-sm", variant: "ghost", children: _jsx(ArrowUpRightIcon, { className: "size-4.5" }) }));
}
