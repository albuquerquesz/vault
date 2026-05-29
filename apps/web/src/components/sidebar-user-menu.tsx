"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@vault/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@vault/ui/components/sidebar";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	CogIcon,
	CreditCardIcon,
	LogOutIcon,
	MessageCircleIcon,
	UsersIcon,
} from "lucide-react";
import { SidebarThemeSwitcher } from "@/components/sidebar-theme-switcher";

const user = {
	name: "Victor Albuquerque",
	initials: "VA",
};

const MAX_USER_NAME_CHARS = 14;

export function SidebarUserMenu() {
	const displayName =
		user.name.length > MAX_USER_NAME_CHARS
			? `${user.name.slice(0, MAX_USER_NAME_CHARS)}...`
			: user.name;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<SidebarMenuButton className="h-12 px-2" size="lg" tooltip={user.name} />
				}
			>
				<div className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary text-sm font-medium">
					{user.initials}
				</div>
				<span className="text-foreground text-sm font-medium" title={user.name}>
					{displayName}
				</span>
				<div className="ml-auto flex flex-col text-muted-foreground">
					<ChevronUpIcon className="size-3" />
					<ChevronDownIcon className="size-3" />
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-68 bg-card p-2">
				<SidebarThemeSwitcher />
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<CogIcon />
					Configurações
				</DropdownMenuItem>
				<DropdownMenuItem>
					<CreditCardIcon />
					Plano
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<MessageCircleIcon />
					Feedback e Bugs
				</DropdownMenuItem>
				<DropdownMenuItem>
					<UsersIcon />
					Comunidade
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive">
					<LogOutIcon />
					Sair
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function SidebarUserMenuSection() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarUserMenu />
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
