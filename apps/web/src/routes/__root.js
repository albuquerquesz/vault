import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createRootRouteWithContext, HeadContent, Outlet, useRouterState, } from "@tanstack/react-router";
import { Toaster } from "@vault/ui/components/sonner";
import { TooltipProvider } from "@vault/ui/components/tooltip";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import "../index.css";
export const Route = createRootRouteWithContext()({
    component: RootComponent,
    head: () => ({
        meta: [
            {
                title: "vault",
            },
            {
                name: "description",
                content: "vault is a web application",
            },
        ],
        links: [
            {
                rel: "icon",
                href: "/favicon.ico",
            },
        ],
    }),
});
function RootComponent() {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const forcedTheme = pathname === "/login" ? "dark" : undefined;
    return (_jsxs(_Fragment, { children: [_jsx(HeadContent, {}), _jsx(ThemeProvider, { attribute: "class", defaultTheme: "dark", disableTransitionOnChange: true, forcedTheme: forcedTheme, storageKey: "vite-ui-theme", children: _jsxs(TooltipProvider, { delay: 800, children: [pathname === "/login" ? (_jsx("div", { className: "grid h-svh grid-rows-[auto_1fr]", children: _jsx(Outlet, {}) })) : (_jsx(AppShell, { children: _jsx(Outlet, {}) })), _jsx(Toaster, { richColors: true })] }) })] }));
}
