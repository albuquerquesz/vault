"use client";

import { AArrowUpIcon } from "@vault/ui/components/a-arrow-up";
import { MessageSquareIcon } from "lucide-react";
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
import { ModeToggle } from "@/components/mode-toggle";
import { NavGroup } from "@/components/nav-group";

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
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-muted-foreground text-xs">Theme</span>
            <ModeToggle />
          </div>
          <SidebarMenu className="mt-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                className="text-muted-foreground"
                size="sm"
                tooltip="Send feedback"
                render={<a href="mailto:contact@albuquerquesz.com.br" />}
              >
                <MessageSquareIcon size={16} />
                <span>Feedback</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="text-muted-foreground"
                size="sm"
                tooltip="Growth"
                render={<a href="/dashboard" />}
              >
                <AArrowUpIcon size={16} />
                <span>Growth</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
