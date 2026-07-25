"use client";

import { Link } from "@tanstack/react-router";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@vault/ui/components/sidebar";
import { cn } from "@vault/ui/lib/utils";
import { footerNavLinks, useNavLinks } from "@/components/app-shared";
import { LatestChange } from "@/components/latest-change";
import { MonetaryVisibilityToggle } from "@/components/monetary-visibility-toggle";

export function AppSidebar() {
	const navLinks = useNavLinks();
	const { setOpenMobile } = useSidebar();

	return (
		<Sidebar
			className={cn(
				"*:data-[slot=sidebar-inner]:bg-background",
				"**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75",
			)}
			collapsible="icon"
			style={{ fontFamily: '"Space Grotesk", sans-serif' }}
			variant="sidebar"
		>
			<SidebarHeader className="h-14 justify-center border-b px-2 group-data-[collapsible=icon]:px-0">
				<div className="flex w-full min-w-0 items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
					<span className="truncate font-medium text-xl text-foreground! group-data-[collapsible=icon]:hidden">
						Vault
					</span>
					<div className="group-data-[collapsible=icon]:hidden">
						<MonetaryVisibilityToggle />
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent className="px-3 pt-4">
				<SidebarMenu className="gap-1">
					{navLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								isActive={item.isActive}
								onClick={() => setOpenMobile(false)}
								render={<Link to={item.path ?? "#"} />}
							>
								{item.icon}
								<span>{item.title}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>
			<SidebarFooter className="gap-0 p-0">
				<LatestChange />
				<SidebarMenu className="border-t p-2">
					{footerNavLinks.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								className="text-muted-foreground"
								isActive={item.isActive}
								onClick={() => setOpenMobile(false)}
								size="sm"
								render={<a href={item.path} />}
							>
								{item.icon}
								<span>{item.title}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
				<div className="px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
					<p className="text-nowrap text-[9px] text-muted-foreground">
						© {new Date().getFullYear()} Vault
					</p>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
