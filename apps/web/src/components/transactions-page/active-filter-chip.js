"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from "@vault/ui/components/badge";
import { XIcon } from "lucide-react";
export function ActiveFilterChip({ label, onRemove, }) {
    return (_jsxs(Badge, { variant: "outline", className: "gap-1.5 border-border/60 bg-muted/50 pr-1.5", children: [_jsx("span", { children: label }), _jsx("button", { "aria-label": `Remover filtro ${label}`, className: "inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground", onClick: onRemove, type: "button", children: _jsx(XIcon, { className: "size-3" }) })] }));
}
