import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Kbd, KbdGroup } from "@vault/ui/components/kbd";
import { SidebarTrigger } from "@vault/ui/components/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@vault/ui/components/tooltip";
export function CustomSidebarTrigger() {
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { delay: 1000, render: _jsx(SidebarTrigger, {}) }), _jsxs(TooltipContent, { className: "px-2 py-1", side: "right", children: ["Toggle Sidebar", " ", _jsxs(KbdGroup, { children: [_jsx(Kbd, { children: "\u2318" }), _jsx(Kbd, { children: "b" })] })] })] }));
}
