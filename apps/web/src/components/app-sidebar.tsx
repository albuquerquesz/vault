"use client";

import { AArrowUpIcon } from "@vault/ui/components/a-arrow-up";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@vault/ui/components/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@vault/ui/components/tooltip";
import { navGroups } from "@/components/app-shared";
import { NavGroup } from "@/components/nav-group";

export function AppSidebar() {
  return (
    <TooltipProvider delay={1000}>
      <Sidebar
        className="border-r border-border [&_[data-slot=sidebar-inner]]:ring-0 [&_[data-slot=sidebar-inner]]:border-0 [&_[data-slot=sidebar-inner]]:shadow-none"
        collapsible="offcanvas"
        variant="floating"
      >
        <SidebarHeader className="h-14 items-start justify-center px-4">
          <Tooltip>
            <TooltipTrigger
              render={<button type="button" aria-label="Growth" />}
            >
              <AArrowUpIcon className="text-muted-foreground" size={20} />
            </TooltipTrigger>
            <TooltipContent side="right">Growth</TooltipContent>
          </Tooltip>
        </SidebarHeader>
        <SidebarContent>
          {navGroups.map((group, index) => (
            <NavGroup key={`sidebar-group-${index}`} {...group} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu className="mt-2">
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
