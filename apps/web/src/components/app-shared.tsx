import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
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
