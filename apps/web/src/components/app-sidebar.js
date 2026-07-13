"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, } from "@vault/ui/components/sidebar";
import { cn } from "@vault/ui/lib/utils";
import { footerNavLinks, useNavLinks } from "@/components/app-shared";
import { LatestChange } from "@/components/latest-change";
import { LogoIcon } from "@/components/logo";
import { MonetaryVisibilityToggle } from "@/components/monetary-visibility";
export function AppSidebar() {
    const navLinks = useNavLinks();
    return (_jsxs(Sidebar, { className: cn("*:data-[slot=sidebar-inner]:bg-background", "**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"), collapsible: "icon", variant: "sidebar", children: [_jsx(SidebarHeader, { className: "h-14 justify-center border-b px-2", children: _jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(LogoIcon, {}), _jsx("span", { className: "font-medium text-xl text-foreground!", children: "Vault" })] }), _jsx(MonetaryVisibilityToggle, {})] }) }), _jsx(SidebarContent, { className: "px-3 pt-4", children: _jsx(SidebarMenu, { className: "gap-1", children: navLinks.map((item) => (_jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { isActive: item.isActive, render: _jsx(Link, { to: item.path ?? "#" }), children: [item.icon, _jsx("span", { children: item.title })] }) }, item.title))) }) }), _jsxs(SidebarFooter, { className: "gap-0 p-0", children: [_jsx(LatestChange, {}), _jsx(SidebarMenu, { className: "border-t p-2", children: footerNavLinks.map((item) => (_jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { className: "text-muted-foreground", isActive: item.isActive, size: "sm", render: _jsx("a", { href: item.path }), children: [item.icon, _jsx("span", { children: item.title })] }) }, item.title))) }), _jsx("div", { className: "px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0", children: _jsxs("p", { className: "text-nowrap text-[9px] text-muted-foreground", children: ["\u00A9 ", new Date().getFullYear(), " Vault"] }) })] })] }));
}
