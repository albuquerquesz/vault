import { ActivityIcon } from "@vault/ui/components/activity";
import { CircleHelpIcon } from "@vault/ui/components/circle-help";
import { LayoutGridIcon } from "@vault/ui/components/layout-grid";
import { WalletIcon } from "@vault/ui/components/wallet";
import {
	CreditCardIcon,
	GlobeIcon,
	PieChartIcon,
	ReceiptTextIcon,
	ScaleIcon,
	TrendingUpIcon,
} from "lucide-react";
import type { ReactNode } from "react";
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
				icon: <LayoutGridIcon size={20} />,
				isActive: true,
			},
			{
				title: "Despesas",
				path: "/finance/expenses",
				icon: <WalletIcon size={20} />,
			},
			{
				title: "Estabilidade",
				path: "/finance/stability",
				icon: <ActivityIcon size={20} />,
			},
		],
	},
	{
		label: "Análises",
		items: [
			{
				title: "Faturas do mês",
				path: dashboardDetailDefinitions.monthlyBills.path,
				icon: <CreditCardIcon size={20} />,
			},
			{
				title: "Distribuição dos gastos",
				path: dashboardDetailDefinitions.expenseDistribution.path,
				icon: <PieChartIcon size={20} />,
			},
			{
				title: "Traffic sources",
				path: dashboardDetailDefinitions.trafficSources.path,
				icon: <GlobeIcon size={20} />,
			},
			{
				title: "Despesas diárias",
				path: dashboardDetailDefinitions.dailyExpenses.path,
				icon: <ActivityIcon size={20} />,
			},
			{
				title: "Investimentos",
				path: dashboardDetailDefinitions.investments.path,
				icon: <TrendingUpIcon size={20} />,
			},
		],
	},
	{
		label: "Suporte",
		items: [
			{
				title: "Ajuda do vendedor",
				path: "#/seller-help",
				icon: <CircleHelpIcon size={20} />,
			},
			{
				title: "Status da plataforma",
				path: "#/status",
				icon: <ActivityIcon size={20} />,
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
