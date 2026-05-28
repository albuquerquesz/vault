import { SidebarInset, SidebarProvider } from "@vault/ui/components/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider defaultOpen={false}>
			<AppSidebar />
			<SidebarInset>
				<AppHeader />
				<div className="p-4 md:p-6">
					<div className="flex flex-1 flex-col gap-4">{children}</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
