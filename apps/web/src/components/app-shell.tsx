import { SidebarInset, SidebarProvider } from "@vault/ui/components/sidebar";
import { cn } from "@vault/ui/lib/utils";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { MonetaryVisibilityProvider } from "@/components/monetary-visibility";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<MonetaryVisibilityProvider>
			<SidebarProvider onOpenChange={() => {}} open>
				<AppSidebar />
				<SidebarInset>
					<AppHeader />
					<div className="flex flex-1 flex-col px-8 md:px-8">
						<div className="mx-auto w-full">
							{children}
						</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</MonetaryVisibilityProvider>
	);
}
