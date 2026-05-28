import { AppHeader } from "@/components/app-header";

export function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen w-full">
			<AppHeader />
			<div className="p-4 md:p-6">
				<div className="flex flex-1 flex-col gap-4">{children}</div>
			</div>
		</div>
	);
}
