"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { Loader2Icon, Trash2Icon, XIcon } from "lucide-react";
export function TransactionsSelectionToolbar({ selectedCount, onClear, onDelete, isDeleting = false, className, }) {
    if (selectedCount <= 0) {
        return null;
    }
    const label = selectedCount === 1 ? "1 Selecionado" : `${selectedCount} Selecionados`;
    return (_jsxs("div", { className: cn("flex items-center gap-1 rounded-full border border-border/70 bg-card/95 p-1 pl-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/95", className), role: "toolbar", "aria-label": "A\u00E7\u00F5es da sele\u00E7\u00E3o", children: [_jsx("span", { className: "pr-2 text-sm font-medium tabular-nums text-foreground", children: label }), _jsx("div", { "aria-hidden": true, className: "mx-0.5 h-5 w-px shrink-0 bg-border dark:bg-white/15" }), _jsxs(Button, { className: "h-8 gap-1.5 rounded-full border-destructive/40 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/50 dark:hover:bg-destructive/20", disabled: isDeleting, onClick: onDelete, size: "sm", type: "button", variant: "outline", children: [isDeleting ? (_jsx(Loader2Icon, { className: "size-3.5 animate-spin" })) : (_jsx(Trash2Icon, { className: "size-3.5" })), "Excluir"] }), _jsx(Button, { "aria-label": "Limpar sele\u00E7\u00E3o", className: "size-8 rounded-full", disabled: isDeleting, onClick: onClear, size: "icon-sm", type: "button", variant: "ghost", children: _jsx(XIcon, { className: "size-3.5" }) })] }));
}
