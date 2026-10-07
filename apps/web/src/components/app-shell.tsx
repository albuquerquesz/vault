import type * as React from "react";
import { SidebarInset, SidebarProvider } from "@vault/ui/components/sidebar";
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
					<div className="flex min-h-0 flex-1 flex-col dark:bg-[oklch(0.178_0.005_285)] px-3 pb-[calc(var(--mobile-bottom-tab-bar-height)+env(safe-area-inset-bottom,0px)+1rem)] sm:px-6 md:pb-0 lg:px-8">
						<div className="mx-auto w-full min-w-0">{children}</div>
					</div>
					<MobileBottomTabBar />
				</SidebarInset>
			</SidebarProvider>
		</MonetaryVisibilityProvider>
	);
}
