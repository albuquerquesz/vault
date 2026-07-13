"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@vault/ui/components/dropdown-menu";
import { CheckIcon, ExternalLinkIcon, MoreVerticalIcon, PencilIcon, Trash2Icon, } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
const currencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});
const MAX_NAME_LENGTH = 20;
function maskGoalName(name) {
    if (name.length <= MAX_NAME_LENGTH) {
        return name;
    }
    return `${name.slice(0, MAX_NAME_LENGTH)}…`;
}
export function GoalList({ goals, onComplete, onEdit, onDelete, }) {
    return (_jsx("div", { className: "flex flex-col gap-1", children: goals.map((goal) => {
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const displayName = maskGoalName(goal.name);
            return (_jsxs("div", { className: "flex items-center justify-between gap-3 py-1.5", children: [_jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-2", children: [goal.url ? (_jsx("a", { href: goal.url, target: "_blank", rel: "noopener noreferrer", className: "min-w-0 truncate text-lg font-medium underline-offset-4 hover:underline", title: goal.name, children: displayName })) : (_jsx("span", { className: "min-w-0 truncate text-lg font-medium", title: goal.name, children: displayName })), goal.url ? (_jsx("a", { href: goal.url, target: "_blank", rel: "noopener noreferrer", className: "shrink-0 text-muted-foreground hover:text-foreground", "aria-label": `Abrir link da meta ${goal.name}`, children: _jsx(ExternalLinkIcon, { className: "size-4" }) })) : null] }), _jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [_jsx(AnimatedNumber, { className: "text-xl font-semibold tabular-nums text-white", format: (value) => currencyFmt.format(value), value: goal.targetAmount }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { render: _jsx(Button, { variant: "ghost", size: "icon-sm", className: "size-8 shrink-0 text-muted-foreground", "aria-label": `Opções da meta ${goal.name}`, children: _jsx(MoreVerticalIcon, { className: "size-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", className: "min-w-36 bg-card", children: [!isCompleted && (_jsxs(DropdownMenuItem, { onClick: () => onComplete(goal), children: [_jsx(CheckIcon, { className: "size-4" }), "Concluir"] })), _jsxs(DropdownMenuItem, { onClick: () => onEdit(goal), children: [_jsx(PencilIcon, { className: "size-4" }), "Editar"] }), _jsxs(DropdownMenuItem, { variant: "destructive", onClick: () => onDelete(goal), children: [_jsx(Trash2Icon, { className: "size-4" }), "Deletar"] })] })] })] })] }, goal.id));
        }) }));
}
