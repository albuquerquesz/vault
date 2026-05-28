import { ActivityIcon } from "@vault/ui/components/activity";
import { CircleHelpIcon } from "@vault/ui/components/circle-help";
import { LayoutGridIcon } from "@vault/ui/components/layout-grid";
import { SettingsIcon } from "@vault/ui/components/settings";
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
				path: "/dashboard",
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
		items: [
			{
				title: "Configurações da loja",
				path: "#/store-settings",
				icon: <SettingsIcon size={16} />,
				subItems: [
					{ title: "Perfil da loja", path: "#/store-settings/profile" },
					{ title: "Envio e entrega", path: "#/store-settings/shipping" },
					{ title: "Pagamentos", path: "#/store-settings/payments" },
					{ title: "Equipe", path: "#/store-settings/staff" },
					{ title: "Aplicativos", path: "#/store-settings/apps" },
				],
			},
		],
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
