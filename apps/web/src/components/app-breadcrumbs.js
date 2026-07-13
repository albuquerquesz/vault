import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, } from "@vault/ui/components/breadcrumb";
export function AppBreadcrumbs({ page }) {
    if (!page?.title) {
        return null;
    }
    return (_jsx(Breadcrumb, { children: _jsx(BreadcrumbList, { children: _jsx(BreadcrumbItem, { children: _jsxs(BreadcrumbPage, { className: "flex items-center gap-2 text-base [&>svg]:size-4", children: [page.icon, page.title] }) }) }) }));
}
