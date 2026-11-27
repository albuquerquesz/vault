import { useLocation } from "@tanstack/react-router";
import {
	CreditCardIcon,
	Settings2Icon,
	TagsIcon,
	TargetIcon,
	TrendingUpIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
	AnimatedSidebarChartColumnIncreasingIcon,
	AnimatedSidebarChartNoAxesColumnIncreasingIcon,
} from "@/components/animated-sidebar-icons";

export type AppNavSurface = "sidebar" | "breadcrumbs" | "mobile-tab-bar";

export type SidebarNavItem = {
	title: string;
	mobileTitle?: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
	surfaces?: AppNavSurface[];
};

export type SidebarNavGroup = {
	label: string;
	items: SidebarNavItem[];
};

const PRIMARY_NAV_SURFACES: AppNavSurface[] = [
	"sidebar",
	"breadcrumbs",
	"mobile-tab-bar",
];

/** Sidebar and breadcrumbs only: reachable on mobile through the "Mais" sheet. */
const SECONDARY_NAV_SURFACES: AppNavSurface[] = ["sidebar", "breadcrumbs"];

/**
 * Single list of app screens. The sidebar and the mobile "Mais" sheet show all
 * of it; the mobile tab bar shows only the items marked "mobile-tab-bar".
 * New screens: add one entry here.
 */
const navItemsStatic: SidebarNavItem[] = [
	{
		title: "Visão Geral",
		path: "/",
		icon: <AnimatedSidebarChartNoAxesColumnIncreasingIcon size={20} />,
		surfaces: PRIMARY_NAV_SURFACES,
	},
	{
		title: "Transações",
		path: "/transactions",
		icon: <AnimatedSidebarChartColumnIncreasingIcon size={20} />,
		surfaces: PRIMARY_NAV_SURFACES,
	},
	{
		title: "Projeção",
		path: "/projection",
		icon: <TrendingUpIcon className="size-5" />,
		surfaces: PRIMARY_NAV_SURFACES,
	},
	{
		title: "Categorias",
		path: "/categories",
		icon: <TagsIcon className="size-5" />,
		surfaces: SECONDARY_NAV_SURFACES,
	},
	{
		title: "Cartões",
		path: "/cards",
		icon: <CreditCardIcon className="size-5" />,
		surfaces: SECONDARY_NAV_SURFACES,
	},
	{
		title: "Meta de gastos",
		mobileTitle: "Meta",
		path: "/spending-goal",
		icon: <TargetIcon className="size-5" />,
		surfaces: SECONDARY_NAV_SURFACES,
	},
];

/** Routes that appear in breadcrumbs but not in the sidebar. */
const breadcrumbOnlyPages: SidebarNavItem[] = [
	{
		title: "Configurações",
		path: "/settings",
		icon: <Settings2Icon className="size-4" />,
		surfaces: ["breadcrumbs"],
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
			itemPath === "/" ? activePath === "/" : activePath.startsWith(itemPath);
		return { ...item, isActive };
	});
}

export function useMobileTabBarLinks(): SidebarNavItem[] {
	return useNavLinks().filter((item) =>
		item.surfaces?.includes("mobile-tab-bar"),
	);
}

/** Everything the "Mais" sheet lists on mobile: all screens plus settings. */
export function useMobileMoreLinks(): SidebarNavItem[] {
	const activePath = useActivePath();
	const settings = breadcrumbOnlyPages.map((item) => ({
		...item,
		isActive: activePath.startsWith(item.path ?? "\0"),
	}));
	return [...useNavLinks(), ...settings];
}

/** Active page for header breadcrumbs (sidebar + breadcrumb-only routes). */
export function useActiveBreadcrumbPage(): SidebarNavItem | null {
	const activePath = useActivePath();
	if (activePath.startsWith("/transactions/")) {
		return { title: "Detalhe da transação", isActive: true };
	}

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
			{
				title: "Cartões",
				path: "/cards",
				icon: <CreditCardIcon className="size-4" />,
			},
			{
				title: "Meta de gastos",
				path: "/spending-goal",
				icon: <TargetIcon className="size-4" />,
			},
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [];
