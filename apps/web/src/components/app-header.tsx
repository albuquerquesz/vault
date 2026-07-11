import { cn } from "@vault/ui/lib/utils";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { useActiveBreadcrumbPage } from "@/components/app-shared";
import { DecorIcon } from "@/components/decor-icon";
import { NavUser } from "@/components/nav-user";

export function AppHeader() {
	const activePage = useActiveBreadcrumbPage();

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
				"bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50",
			)}
		>
			<DecorIcon className="hidden md:block" position="bottom-left" />
			<div className="flex items-center gap-3">
				<AppBreadcrumbs page={activePage} />
			</div>
			<div className="flex items-center gap-3">
				<NavUser />
			</div>
		</header>
	);
}
