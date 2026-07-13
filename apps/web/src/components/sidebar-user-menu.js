"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ActivityIcon } from "@vault/ui/components/activity";
import { CircleHelpIcon } from "@vault/ui/components/circle-help";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@vault/ui/components/dropdown-menu";
import { SettingsIcon } from "@vault/ui/components/settings";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, } from "@vault/ui/components/sidebar";
import { WalletIcon } from "@vault/ui/components/wallet";
import { ChevronDownIcon, ChevronUpIcon, LogOutIcon } from "lucide-react";
import { motion } from "motion/react";
import { SidebarThemeSwitcher } from "@/components/sidebar-theme-switcher";
const user = {
    name: "Victor Albuquerque",
    initials: "VA",
};
const MAX_USER_NAME_CHARS = 14;
export function SidebarUserMenu() {
    const displayName = user.name.length > MAX_USER_NAME_CHARS
        ? `${user.name.slice(0, MAX_USER_NAME_CHARS)}...`
        : user.name;
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { render: _jsxs(SidebarMenuButton, { className: "h-12 px-2", size: "lg", tooltip: user.name, children: [_jsx("div", { className: "flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary text-sm font-medium", children: user.initials }), _jsx("span", { className: "text-foreground text-sm font-medium", title: user.name, children: displayName }), _jsxs("div", { className: "ml-auto flex flex-col text-muted-foreground", children: [_jsx(ChevronUpIcon, { className: "size-3" }), _jsx(ChevronDownIcon, { className: "size-3" })] })] }) }), _jsxs(DropdownMenuContent, { align: "end", className: "mb-2 mr-2 w-56 bg-card p-2", children: [_jsx("div", { className: "px-1 py-1.5", children: _jsx(SidebarThemeSwitcher, {}) }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuGroup, { children: [_jsxs(DropdownMenuItem, { className: "group", children: [_jsx(SettingsIcon, { className: "text-muted-foreground group-hover:text-foreground", size: 16 }), "Configura\u00E7\u00F5es"] }), _jsxs(DropdownMenuItem, { className: "group", children: [_jsx(WalletIcon, { className: "text-muted-foreground group-hover:text-foreground", size: 16 }), "Plano"] })] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuGroup, { children: [_jsxs(DropdownMenuItem, { className: "group", children: [_jsx(CircleHelpIcon, { className: "text-muted-foreground group-hover:text-foreground", size: 16 }), "Feedback e Bugs"] }), _jsxs(DropdownMenuItem, { className: "group", children: [_jsx(ActivityIcon, { className: "text-muted-foreground group-hover:text-foreground", size: 16 }), "Comunidade"] })] }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuGroup, { children: _jsxs(DropdownMenuItem, { className: "group", variant: "destructive", children: [_jsx(motion.span, { className: "inline-flex", whileHover: { x: -1, scale: 1.05 }, transition: { duration: 0.15 }, children: _jsx(LogOutIcon, {}) }), "Sair"] }) })] })] }));
}
export function SidebarUserMenuSection() {
    return (_jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsx(SidebarUserMenu, {}) }) }));
}
