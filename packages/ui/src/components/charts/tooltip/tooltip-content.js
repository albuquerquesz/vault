"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { intFmt } from "../chart-formatters";
export function TooltipContent({ title, rows, children }) {
    return (_jsx("div", { className: "overflow-hidden", children: _jsxs("div", { className: "px-3 py-2.5", children: [title && (_jsx("div", { className: "mb-2 text-left font-medium text-chart-tooltip-foreground text-xs", children: title })), _jsx("div", { className: "space-y-1.5", children: rows.map((row) => (_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-2.5 w-2.5 shrink-0 rounded-full", style: { backgroundColor: row.color } }), _jsx("span", { className: "text-chart-tooltip-muted text-sm", children: row.label })] }), _jsx("span", { className: "font-medium text-chart-tooltip-foreground text-sm tabular-nums", children: typeof row.value === "number" ? intFmt(row.value) : row.value })] }, `${row.label}-${row.color}`))) }), children && (_jsx("div", { className: "mt-2 transition-opacity duration-200 ease-out", children: children }))] }) }));
}
TooltipContent.displayName = "TooltipContent";
export default TooltipContent;
