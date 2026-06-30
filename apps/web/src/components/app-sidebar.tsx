"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
} from "@vault/ui/components/sidebar";
import { TooltipProvider } from "@vault/ui/components/tooltip";
import { navGroups } from "@/components/app-shared";
import { LogoIcon } from "@/components/logo";
import { NavGroup } from "@/components/nav-group";

export function AppSidebar() {
	return (
		<TooltipProvider delay={1000}>
			<Sidebar
				className="border-r border-border [&_[data-slot=sidebar-inner]]:ring-0 [&_[data-slot=sidebar-inner]]:border-0 [&_[data-slot=sidebar-inner]]:shadow-none"
				collapsible="offcanvas"
				variant="floating"
			>
				<SidebarHeader>
					<div className="flex items-center gap-2 px-1 py-1">
						<LogoIcon className="size-4 text-foreground" />
						<span className="font-medium text-foreground text-sm">Vault</span>
					</div>
				</SidebarHeader>
				<SidebarContent className="pt-2">
					{navGroups.map((group, index) => (
						<NavGroup key={`sidebar-group-${index}`} {...group} />
					))}
				</SidebarContent>
			</Sidebar>
		</TooltipProvider>
	);
}
