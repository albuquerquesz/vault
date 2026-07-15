import { SidebarInset, SidebarProvider } from "@vault/ui/components/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { MonetaryVisibilityProvider } from "@/components/monetary-visibility";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<MonetaryVisibilityProvider>
			<SidebarProvider defaultOpen>
				<AppSidebar />
				<SidebarInset>
					<AppHeader />
					<div className="flex flex-1 flex-col px-4 sm:px-6 lg:px-8">
						<div className="mx-auto w-full min-w-0">{children}</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</MonetaryVisibilityProvider>
	);
}
