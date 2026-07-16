import type * as React from "react";
import { SidebarInset, SidebarProvider } from "@vault/ui/components/sidebar";
import { AppHeader } from "@/components/app-header";
import {
	MOBILE_BOTTOM_TAB_BAR_HEIGHT,
	MobileBottomTabBar,
} from "@/components/mobile-bottom-tab-bar";
import { AppSidebar } from "@/components/app-sidebar";
import { MonetaryVisibilityProvider } from "@/components/monetary-visibility";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<MonetaryVisibilityProvider>
			<SidebarProvider defaultOpen>
				<AppSidebar />
				<SidebarInset
					style={
						{
							"--mobile-bottom-tab-bar-height": MOBILE_BOTTOM_TAB_BAR_HEIGHT,
						} as React.CSSProperties
					}
				>
					<AppHeader />
					<div className="flex flex-1 flex-col px-4 pb-[calc(var(--mobile-bottom-tab-bar-height)+1rem)] sm:px-6 md:pb-0 lg:px-8">
						<div className="mx-auto w-full min-w-0">{children}</div>
					</div>
					<MobileBottomTabBar />
				</SidebarInset>
			</SidebarProvider>
		</MonetaryVisibilityProvider>
	);
}
