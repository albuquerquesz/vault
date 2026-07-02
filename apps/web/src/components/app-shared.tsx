import type { ReactNode } from "react";
import {
	AnimatedSidebarChartColumnIncreasingIcon,
	AnimatedSidebarChartLineIcon,
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
		label: "Operação",
		items: [
			{
				title: "Visão Geral",
				path: "/",
				icon: <AnimatedSidebarChartNoAxesColumnIncreasingIcon size={20} />,
				isActive: true,
			},
			{
				title: "Despesas",
				path: "/finance/expenses",
				icon: <AnimatedSidebarWalletIcon size={20} />,
			},
			{
				title: "Estabilidade",
				path: "/finance/stability",
				icon: <AnimatedSidebarChartLineIcon size={20} />,
			},
		],
	},
	{
		label: "Análises",
		items: [
			{
				title: "Faturas do mês",
				path: dashboardDetailDefinitions.monthlyBills.path,
				icon: <AnimatedSidebarWalletIcon size={20} />,
			},
			{
				title: "Distribuição dos gastos",
				path: dashboardDetailDefinitions.expenseDistribution.path,
				icon: <AnimatedSidebarChartPieIcon size={20} />,
			},
			{
				title: "Canais de origem",
				path: dashboardDetailDefinitions.trafficSources.path,
				icon: <AnimatedSidebarChartLineIcon size={20} />,
			},
			{
				title: "Despesas diárias",
				path: dashboardDetailDefinitions.dailyExpenses.path,
				icon: <AnimatedSidebarChartColumnIncreasingIcon size={20} />,
			},
			{
				title: "Investimentos",
				path: dashboardDetailDefinitions.investments.path,
				icon: <AnimatedSidebarChartLineIcon size={20} />,
			},
		],
	},
	{
		label: "Suporte",
		items: [
			{
				title: "Ajuda do vendedor",
				path: "#/seller-help",
				icon: <AnimatedSidebarCircleHelpIcon size={20} />,
			},
			{
				title: "Status da plataforma",
				path: "#/status",
				icon: <AnimatedSidebarChartLineIcon size={20} />,
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
