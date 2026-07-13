import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { useActiveBreadcrumbPage } from "@/components/app-shared";
import { DecorIcon } from "@/components/decor-icon";
import { NavUser } from "@/components/nav-user";
export function AppHeader() {
    const activePage = useActiveBreadcrumbPage();
    return (_jsxs("header", { className: cn("sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6", "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"), children: [_jsx(DecorIcon, { className: "hidden md:block", position: "bottom-left" }), _jsx("div", { className: "flex items-center gap-3", children: _jsx(AppBreadcrumbs, { page: activePage }) }), _jsx("div", { className: "flex items-center gap-3", children: _jsx(NavUser, {}) })] }));
}
