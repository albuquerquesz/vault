"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { XIcon } from "lucide-react";
import { useState } from "react";
const latestChange = {
    badge: "CHANGELOG",
    title: "Product update",
    description: "Performance boosts and UI polish.", // TIP: Use a single line of text for the description. (max 5 words)
    readMore: { href: "#", label: "Learn more" },
};
export function LatestChange() {
    const [isOpen, setIsOpen] = useState(true);
    if (!isOpen) {
        return null;
    }
    return (_jsxs("div", { className: cn("group/latest-change size-full min-h-27 justify-center border-t", "relative flex size-full flex-col gap-1 overflow-hidden px-4 pt-3 pb-1 *:text-nowrap", "transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0"), children: [_jsx("span", { className: "font-light font-mono text-[10px] text-muted-foreground", children: latestChange.badge }), _jsx("p", { className: "font-medium text-xs", children: latestChange.title }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: latestChange.description }), _jsx(Button, { className: "w-max px-0 font-light text-xs", size: "sm", variant: "link", render: _jsx("a", { href: latestChange.readMore.href }), nativeButton: false, children: latestChange.readMore.label }), _jsxs(Button, { className: "absolute top-2 right-2 z-10 size-6 rounded-full opacity-0 transition-opacity group-hover/latest-change:opacity-100", onClick: () => setIsOpen(false), size: "icon-sm", variant: "ghost", children: [_jsx(XIcon, { className: "size-3.5 text-muted-foreground" }), " "] })] }));
}
