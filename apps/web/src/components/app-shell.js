import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SidebarInset, SidebarProvider } from "@vault/ui/components/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { MonetaryVisibilityProvider } from "@/components/monetary-visibility";
export function AppShell({ children }) {
    return (_jsx(MonetaryVisibilityProvider, { children: _jsxs(SidebarProvider, { onOpenChange: () => { }, open: true, children: [_jsx(AppSidebar, {}), _jsxs(SidebarInset, { children: [_jsx(AppHeader, {}), _jsx("div", { className: "flex flex-1 flex-col px-8 md:px-8", children: _jsx("div", { className: "mx-auto w-full", children: children }) })] })] }) }));
}
