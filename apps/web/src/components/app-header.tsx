import { cn } from "@vault/ui/lib/utils";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { useActiveBreadcrumbPage } from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";

export function AppHeader() {
	const activePage = useActiveBreadcrumbPage();

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex min-h-14 shrink-0 items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top,0px)] sm:px-4 md:px-6",
				"bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50",
			)}
		>
			<div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
				<div className="min-w-0">
					<AppBreadcrumbs page={activePage} />
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-2 sm:gap-3">
				<NavUser />
			</div>
		</header>
	);
}
