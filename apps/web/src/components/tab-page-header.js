import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function TabPageHeader({ title, icon }) {
    return (_jsxs("header", { className: "mb-4 flex items-center gap-3 px-1 pb-3", children: [_jsx("span", { className: "border-r border-border/40 pr-3 text-muted-foreground", children: icon }), _jsx("h1", { className: "text-2xl font-semibold tracking-tight text-foreground", style: { fontFamily: '"Space Grotesk", sans-serif' }, children: title })] }));
}
