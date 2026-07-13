"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Switch } from "@vault/ui/components/switch";
import { useTheme } from "@/components/theme-provider";
export function SidebarThemeSwitcher() {
    const { resolvedTheme, setTheme } = useTheme();
    const checked = resolvedTheme === "dark";
    return (_jsxs("div", { className: "flex items-center justify-between px-2 py-1", children: [_jsx("span", { className: "text-muted-foreground text-xs", children: "Tema escuro" }), _jsx(Switch, { checked: checked, onCheckedChange: (next) => setTheme(next ? "dark" : "light"), "aria-label": "Alternar tema escuro" })] }));
}
