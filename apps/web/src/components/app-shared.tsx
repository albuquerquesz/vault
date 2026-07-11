import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Settings2Icon } from "lucide-react";
import {
  AnimatedSidebarChartColumnIncreasingIcon,
  AnimatedSidebarChartNoAxesColumnIncreasingIcon,
} from "@/components/animated-sidebar-icons";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
  subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  label: string;
  items: SidebarNavItem[];
};

const navItemsStatic: SidebarNavItem[] = [
  {
    title: "Visão Geral",
    path: "/",
    icon: <AnimatedSidebarChartNoAxesColumnIncreasingIcon size={20} />,
  },
  {
    title: "Transações",
    path: "/transactions",
    icon: <AnimatedSidebarChartColumnIncreasingIcon size={20} />,
  },
];

/** Routes that appear in breadcrumbs but not in the sidebar. */
const breadcrumbOnlyPages: SidebarNavItem[] = [
  {
    title: "Configurações",
    path: "/settings",
    icon: <Settings2Icon className="size-4" />,
  },
  {
    title: "Conectar conta",
    path: "/pluggy",
  },
];

function useActivePath(): string {
  const { pathname } = useLocation();
  return pathname;
}

export function useNavLinks(): SidebarNavItem[] {
	const activePath = useActivePath();
	return navItemsStatic.map((item) => {
		const itemPath = item.path ?? "";
		const isActive =
			itemPath === "/"
				? activePath === "/"
				: activePath.startsWith(itemPath);
		return { ...item, isActive };
	});
}

/** Active page for header breadcrumbs (sidebar + breadcrumb-only routes). */
export function useActiveBreadcrumbPage(): SidebarNavItem | null {
	const activePath = useActivePath();
	const navLinks = useNavLinks();
	const fromSidebar = navLinks.find((item) => item.isActive);
	if (fromSidebar) return fromSidebar;

	const fromHidden = breadcrumbOnlyPages.find((item) => {
		const itemPath = item.path ?? "";
		return itemPath !== "" && activePath.startsWith(itemPath);
	});
	return fromHidden ? { ...fromHidden, isActive: true } : null;
}

export const navGroups: SidebarNavGroup[] = [
  {
    label: "Produto",
    items: [
      {
        title: "Visão Geral",
        path: "/",
        icon: <AnimatedSidebarChartNoAxesColumnIncreasingIcon size={20} />,
      },
    ],
  },
  {
    label: "Finanças",
    items: [
      {
        title: "Transações",
        path: "/transactions",
        icon: <AnimatedSidebarChartColumnIncreasingIcon size={20} />,
      },
    ],
  },
];

export const footerNavLinks: SidebarNavItem[] = [];
