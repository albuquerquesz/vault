"use client";

import { AArrowUpIcon } from "@vault/ui/components/a-arrow-up";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@vault/ui/components/sidebar";
import { TooltipProvider } from "@vault/ui/components/tooltip";
import { navGroups } from "@/components/app-shared";
import { NavGroup } from "@/components/nav-group";
import { SidebarThemeSwitcher } from "@/components/sidebar-theme-switcher";
import { SidebarUserMenuSection } from "@/components/sidebar-user-menu";

export function AppSidebar() {
  return (
    <TooltipProvider delay={1000}>
		<Sidebar
			className="border-r border-border [&_[data-slot=sidebar-inner]]:ring-0 [&_[data-slot=sidebar-inner]]:border-0 [&_[data-slot=sidebar-inner]]:shadow-none"
			collapsible="offcanvas"
			variant="floating"
		>
			<SidebarContent>
          {navGroups.map((group, index) => (
            <NavGroup key={`sidebar-group-${index}`} {...group} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarThemeSwitcher />
          <SidebarMenu className="mt-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                className="text-muted-foreground text-sm"
                size="default"
                tooltip="Growth"
                render={<a href="/dashboard" />}
              >
                <AArrowUpIcon size={18} />
                <span>Growth</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarUserMenuSection />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
