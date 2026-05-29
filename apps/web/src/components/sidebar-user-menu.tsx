"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
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
	CreditCardIcon,
	LogOutIcon,
	MessageCircleIcon,
	UsersIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { SettingsIcon } from "@vault/ui/components/settings";
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
			<DropdownMenuContent align="end" className="mb-2 mr-2 w-56 bg-card p-2">
				<div className="px-1 py-1.5">
					<SidebarThemeSwitcher />
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem className="group">
						<SettingsIcon className="text-muted-foreground group-hover:text-foreground" size={16} />
						Configurações
					</DropdownMenuItem>
					<DropdownMenuItem className="group">
						<motion.span
							className="inline-flex"
							whileHover={{ y: -1, scale: 1.05 }}
							transition={{ duration: 0.15 }}
						>
							<CreditCardIcon />
						</motion.span>
						Plano
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem className="group">
						<motion.span
							className="inline-flex"
							whileHover={{ x: 1, scale: 1.05 }}
							transition={{ duration: 0.15 }}
						>
							<MessageCircleIcon />
						</motion.span>
						Feedback e Bugs
					</DropdownMenuItem>
					<DropdownMenuItem className="group">
						<motion.span
							className="inline-flex"
							whileHover={{ y: -1, scale: 1.05 }}
							transition={{ duration: 0.15 }}
						>
							<UsersIcon />
						</motion.span>
						Comunidade
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem className="group" variant="destructive">
						<motion.span
							className="inline-flex"
							whileHover={{ x: -1, scale: 1.05 }}
							transition={{ duration: 0.15 }}
						>
							<LogOutIcon />
						</motion.span>
						Sair
					</DropdownMenuItem>
				</DropdownMenuGroup>
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
