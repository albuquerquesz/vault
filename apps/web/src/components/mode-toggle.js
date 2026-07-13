import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@vault/ui/components/dropdown-menu";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
export function ModeToggle() {
    const { setTheme } = useTheme();
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { render: _jsxs(Button, { variant: "outline", size: "icon", children: [_jsx(Sun, { className: "h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" }), _jsx(Moon, { className: "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" }), _jsx("span", { className: "sr-only", children: "Toggle theme" })] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { onClick: () => setTheme("light"), children: "Light" }), _jsx(DropdownMenuItem, { onClick: () => setTheme("dark"), children: "Dark" }), _jsx(DropdownMenuItem, { onClick: () => setTheme("system"), children: "System" })] })] }));
}
