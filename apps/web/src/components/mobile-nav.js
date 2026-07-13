import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { MenuIcon, XIcon } from "lucide-react";
import React from "react";
import { navLinks } from "@/components/header";
import { Portal, PortalBackdrop } from "@/components/portal";
export function MobileNav() {
    const [open, setOpen] = React.useState(false);
    return (_jsxs("div", { className: "md:hidden", children: [_jsx(Button, { "aria-controls": "mobile-menu", "aria-expanded": open, "aria-label": "Alternar menu", className: "md:hidden", onClick: () => setOpen(!open), size: "icon", variant: "outline", children: open ? (_jsx(XIcon, { className: "size-4.5" })) : (_jsx(MenuIcon, { className: "size-4.5" })) }), open && (_jsxs(Portal, { className: "top-14", id: "mobile-menu", children: [_jsx(PortalBackdrop, {}), _jsxs("div", { className: cn("data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in", "size-full p-4"), "data-slot": open ? "open" : "closed", children: [_jsx("div", { className: "grid gap-y-2", children: navLinks.map((link) => (_jsx(Button, { className: "justify-start", variant: "ghost", render: _jsx("a", { href: link.href }), nativeButton: false, children: link.label }, link.label))) }), _jsxs("div", { className: "mt-12 flex flex-col gap-2", children: [_jsx(Button, { className: "w-full", variant: "outline", children: "Entrar" }), _jsx(Button, { className: "w-full", children: "Come\u00E7ar" })] })] })] }))] }));
}
