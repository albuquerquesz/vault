import {
	HelpCircleIcon,
	KeyRoundIcon,
	LayoutGridIcon,
	PlugIcon,
	SettingsIcon,
	UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		label: "Product",
		items: [
			{
				title: "Dashboard",
				path: "/dashboard",
				icon: <LayoutGridIcon />,
				isActive: true,
			},
		],
	},
	{
		label: "Workspace",
		items: [
			{
				title: "Team",
				path: "/team",
				icon: <UsersIcon />,
			},
			{
				title: "Integrations",
				path: "/integrations",
				icon: <PlugIcon />,
			},
			{
				title: "API Keys",
				path: "/api-keys",
				icon: <KeyRoundIcon />,
			},
		],
	},
	{
		label: "Administration",
		items: [
			{
				title: "Settings",
				path: "/settings",
				icon: <SettingsIcon />,
			},
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Support",
		path: "#/support",
		icon: <HelpCircleIcon />,
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
