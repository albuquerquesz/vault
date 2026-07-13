"use client";
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
function OverviewCardMessage({ message, className, }) {
    return (_jsx("div", { className: cn("flex flex-1 items-center justify-center text-center text-sm text-muted-foreground", className), children: message }));
}
export function OverviewCardLoadingState({ message = "Carregando...", fallback, className, }) {
    if (fallback) {
        return _jsx(_Fragment, { children: fallback });
    }
    return _jsx(OverviewCardMessage, { className: className, message: message });
}
export function OverviewCardEmptyState({ message = "Nenhum dado encontrado.", className, }) {
    return _jsx(OverviewCardMessage, { className: className, message: message });
}
export function OverviewCardErrorState({ message = "Não foi possível carregar os dados.", className, }) {
    return _jsx(OverviewCardMessage, { className: className, message: message });
}
