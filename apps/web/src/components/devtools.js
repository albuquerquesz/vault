import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
export default function Devtools() {
    return (_jsxs(_Fragment, { children: [_jsx(TanStackRouterDevtools, { position: "top-right" }), _jsx(ReactQueryDevtools, { position: "bottom", buttonPosition: "bottom-right" })] }));
}
