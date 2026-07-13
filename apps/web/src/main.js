import { jsx as _jsx } from "react/jsx-runtime";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./utils/api";
const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultPendingComponent: () => _jsx(Loader, {}),
    context: { queryClient },
    Wrap: function WrapComponent({ children }) {
        return (_jsx(QueryClientProvider, { client: queryClient, children: children }));
    },
});
const rootElement = document.getElementById("app");
if (!rootElement)
    throw new Error("Root element not found");
if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(_jsx(RouterProvider, { router: router }));
}
