"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
import { SearchIcon, SlashIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
function HeaderAction({ children, className, }) {
    return (_jsx("div", { className: cn("flex h-11 items-center rounded-xl border border-white/10 bg-background px-4 text-muted-foreground", className), children: children }));
}
export function AppTopHeader() {
    const { data: session } = authClient.useSession();
    const initials = session?.user.name
        ? session.user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "VA";
    return (_jsx("header", { className: "h-14 border-b border-border bg-background", children: _jsxs("div", { className: "flex h-full items-center justify-between gap-4 px-4 md:px-6", children: [_jsx("div", {}), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(HeaderAction, { className: "gap-2.5 pr-2", children: [_jsx(SearchIcon, { className: "size-4.5" }), _jsx("div", { className: "flex h-7 min-w-7 items-center justify-center rounded-md border border-white/10 px-1.5 text-xs font-medium", children: _jsx(SlashIcon, { className: "size-3.5" }) })] }), _jsx("div", { className: "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900 text-sm font-semibold text-foreground", children: initials })] })] }) }));
}
