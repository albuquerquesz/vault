"use client";
import { jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from "@vault/ui/components/badge";
import { cn } from "@vault/ui/lib/utils";
export function PercentageBadge({ value, className }) {
    return (_jsxs(Badge, { variant: "secondary", className: cn("rounded-full px-1.5 py-0.5 text-sm font-medium tabular-nums bg-white/10 text-white/60", className), children: [value, "%"] }));
}
