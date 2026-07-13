"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@vault/ui/components/select";
import { CalendarIcon } from "lucide-react";
export function OverviewMonthSelect({ value, options, onValueChange, }) {
    return (_jsxs(Select, { value: value, onValueChange: (nextValue) => {
            if (nextValue) {
                onValueChange(nextValue);
            }
        }, children: [_jsxs(SelectTrigger, { className: "h-9 w-[160px] text-sm", children: [_jsx(CalendarIcon, { className: "mr-2 size-3.5 text-muted-foreground" }), _jsx(SelectValue, {})] }), _jsx(SelectContent, { children: options.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] }));
}
