"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from "@vault/ui/components/badge";
import { cn } from "@vault/ui/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, ChevronUpIcon, MinusIcon, TrendingDownIcon, TrendingUpIcon, } from "lucide-react";
import * as React from "react";
const DeltaContext = React.createContext(null);
function useDeltaValue() {
    const context = React.useContext(DeltaContext);
    if (!context) {
        throw new Error("DeltaIcon and DeltaValue must be used inside a `Delta` component.");
    }
    return context.value;
}
function Delta({ className, value, variant = "default", ...props }) {
    return (_jsx(DeltaContext.Provider, { value: { value }, children: variant === "badge" ? (_jsx(Badge, { className: cn("gap-1 border-none tabular-nums [&_svg]:size-4 [&_svg]:shrink-0", value > 0
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-red-500/10 text-red-500", className), "data-slot": "delta", variant: "secondary", ...props })) : (_jsx("div", { className: cn("inline-flex items-center gap-1 text-muted-foreground tabular-nums", "[&_svg]:size-3 [&_svg]:shrink-0", value > 0 ? "text-emerald-600 dark:text-emerald-400" : "", value < 0 ? "text-rose-600 dark:text-rose-400" : "", className), "data-slot": "delta", ...props })) }));
}
function FilledShell({ value, children, }) {
    return (_jsx("span", { className: cn("inline-flex size-3 shrink-0 items-center justify-center rounded-full", "[&_svg]:size-2! [&_svg]:shrink-0 [&_svg]:stroke-3! [&_svg]:text-background", value > 0 && "bg-emerald-500", value < 0 && "bg-red-500", (!value || value === 0) && "bg-muted-foreground"), "data-slot": "delta-icon", children: children }));
}
function DeltaIcon({ variant = "default", filled = false, className, ...props }) {
    const resolvedValue = useDeltaValue();
    const mergedClassName = cn(className);
    const shell = (node) => filled ? _jsx(FilledShell, { value: resolvedValue, children: node }) : node;
    const slotProps = filled ? {} : { "data-slot": "delta-icon" };
    if (!resolvedValue || resolvedValue === 0) {
        return shell(_jsx(MinusIcon, { ...slotProps, className: mergedClassName, ...props }));
    }
    if (resolvedValue > 0) {
        if (variant === "trend") {
            return shell(_jsx(TrendingUpIcon, { ...slotProps, className: mergedClassName, ...props }));
        }
        if (variant === "arrow") {
            return shell(_jsx(ArrowUpIcon, { ...slotProps, className: mergedClassName, ...props }));
        }
        return shell(_jsx(ChevronUpIcon, { ...slotProps, className: mergedClassName, ...props }));
    }
    if (variant === "trend") {
        return shell(_jsx(TrendingDownIcon, { ...slotProps, className: mergedClassName, ...props }));
    }
    if (variant === "arrow") {
        return shell(_jsx(ArrowDownIcon, { ...slotProps, className: mergedClassName, ...props }));
    }
    return shell(_jsx(ChevronDownIcon, { ...slotProps, className: mergedClassName, ...props }));
}
function DeltaValue({ className, precision = 1, suffix = "%", absolute = true, ...props }) {
    const resolvedValue = useDeltaValue();
    const formattedValue = (absolute ? Math.abs(resolvedValue) : resolvedValue).toFixed(precision);
    return (_jsxs("span", { className: cn("tabular-nums", className), "data-slot": "delta-value", ...props, children: [formattedValue, suffix] }));
}
export { Delta, DeltaIcon, DeltaValue };
