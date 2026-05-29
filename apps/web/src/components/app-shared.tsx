import { ActivityIcon } from "@vault/ui/components/activity";
import { CircleHelpIcon } from "@vault/ui/components/circle-help";
import { LayoutGridIcon } from "@vault/ui/components/layout-grid";
import { WalletIcon } from "@vault/ui/components/wallet";
import type { ReactNode } from "react";

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
		label: "Finanças",
		items: [
			{
				title: "Painel",
				path: "/",
				icon: <LayoutGridIcon size={16} />,
				isActive: true,
			},
			{
				title: "Despesas",
				path: "/finance/expenses",
				icon: <WalletIcon size={16} />,
			},
			{
				title: "Estabilidade",
				path: "/finance/stability",
				icon: <ActivityIcon size={16} />,
			},
		],
	},
	{
		label: "Configurações",
		items: [],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Ajuda do vendedor",
		path: "#/seller-help",
		icon: <CircleHelpIcon size={16} />,
	},
	{
		title: "Status da plataforma",
		path: "#/status",
		icon: <ActivityIcon size={16} />,
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item],
		),
	),
	...footerNavLinks,
];
