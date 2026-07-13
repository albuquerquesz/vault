import { jsx as _jsx } from "react/jsx-runtime";
import { useLocation } from "@tanstack/react-router";
import { Settings2Icon } from "lucide-react";
import { AnimatedSidebarChartColumnIncreasingIcon, AnimatedSidebarChartNoAxesColumnIncreasingIcon, } from "@/components/animated-sidebar-icons";
const navItemsStatic = [
    {
        title: "Visão Geral",
        path: "/",
        icon: _jsx(AnimatedSidebarChartNoAxesColumnIncreasingIcon, { size: 20 }),
    },
    {
        title: "Transações",
        path: "/transactions",
        icon: _jsx(AnimatedSidebarChartColumnIncreasingIcon, { size: 20 }),
    },
];
/** Routes that appear in breadcrumbs but not in the sidebar. */
const breadcrumbOnlyPages = [
    {
        title: "Configurações",
        path: "/settings",
        icon: _jsx(Settings2Icon, { className: "size-4" }),
    },
];
function useActivePath() {
    const { pathname } = useLocation();
    return pathname;
}
export function useNavLinks() {
    const activePath = useActivePath();
    return navItemsStatic.map((item) => {
        const itemPath = item.path ?? "";
        const isActive = itemPath === "/" ? activePath === "/" : activePath.startsWith(itemPath);
        return { ...item, isActive };
    });
}
/** Active page for header breadcrumbs (sidebar + breadcrumb-only routes). */
export function useActiveBreadcrumbPage() {
    const activePath = useActivePath();
    const navLinks = useNavLinks();
    const fromSidebar = navLinks.find((item) => item.isActive);
    if (fromSidebar)
        return fromSidebar;
    const fromHidden = breadcrumbOnlyPages.find((item) => {
        const itemPath = item.path ?? "";
        return itemPath !== "" && activePath.startsWith(itemPath);
    });
    return fromHidden ? { ...fromHidden, isActive: true } : null;
}
export const navGroups = [
    {
        label: "Produto",
        items: [
            {
                title: "Visão Geral",
                path: "/",
                icon: _jsx(AnimatedSidebarChartNoAxesColumnIncreasingIcon, { size: 20 }),
            },
        ],
    },
    {
        label: "Finanças",
        items: [
            {
                title: "Transações",
                path: "/transactions",
                icon: _jsx(AnimatedSidebarChartColumnIncreasingIcon, { size: 20 }),
            },
        ],
    },
];
export const footerNavLinks = [];
