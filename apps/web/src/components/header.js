"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { useScroll } from "@/hooks/use-scroll";
export const navLinks = [
    {
        label: "Recursos",
        href: "#",
    },
    {
        label: "Preços",
        href: "#",
    },
    {
        label: "Sobre",
        href: "#",
    },
];
export function Header() {
    const scrolled = useScroll(10);
    return (_jsx("header", { className: cn("sticky top-0 z-50 w-full border-b border-border", {
            "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50": scrolled,
        }), children: _jsxs("nav", { className: "mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4", children: [_jsx("a", { className: "rounded-md p-2 hover:bg-muted dark:hover:bg-muted/50", href: "#", children: _jsx(Logo, { className: "h-4" }) }), _jsxs("div", { className: "hidden items-center gap-2 md:flex", children: [_jsx(ModeToggle, {}), navLinks.map((link) => (_jsx(Button, { size: "sm", variant: "ghost", render: _jsx("a", { href: link.href }), nativeButton: false, children: link.label }, link.label))), _jsx(Button, { size: "sm", variant: "outline", children: "Entrar" }), _jsx(Button, { size: "sm", children: "Come\u00E7ar" })] }), _jsx(MobileNav, {})] }) }));
}
