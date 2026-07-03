import type { ReactNode } from "react";
import {
	AnimatedSidebarChartColumnIncreasingIcon,
	AnimatedSidebarChartNoAxesColumnIncreasingIcon,
	AnimatedSidebarChartPieIcon,
	AnimatedSidebarCircleHelpIcon,
	AnimatedSidebarWalletIcon,
} from "@/components/animated-sidebar-icons";
import { dashboardDetailDefinitions } from "@/components/dashboard-detail-definitions";

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

export const navGroups: SidebarNavGroup[] = [
	{
		label: "Produto",
		items: [
			{
				title: "Painel",
				path: "/",
				icon: <AnimatedSidebarChartNoAxesColumnIncreasingIcon size={20} />,
				isActive: true,
			},
		],
	},
	{
		label: "Finanças",
		items: [
			{
				title: "Despesas diárias",
				path: dashboardDetailDefinitions.dailyExpenses.path,
				icon: <AnimatedSidebarChartColumnIncreasingIcon size={20} />,
			},
			{
				title: "Faturas do mês",
				path: dashboardDetailDefinitions.monthlyBills.path,
				icon: <AnimatedSidebarWalletIcon size={20} />,
			},
			{
				title: "Resumo pessoal",
				path: "/dashboard-v2",
				icon: <AnimatedSidebarChartPieIcon size={20} />,
			},
		],
	},
	{
		label: "Administração",
		items: [
			{
				title: "Configurações",
				path: "/settings",
				icon: <AnimatedSidebarCircleHelpIcon size={20} />,
			},
		],
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item],
		),
	),
];

export const footerNavLinks: SidebarNavItem[] = [];
