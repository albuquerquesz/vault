import { Separator } from "@vault/ui/components/separator";
import { cn } from "@vault/ui/lib/utils";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { useNavLinks } from "@/components/app-shared";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { DecorIcon } from "@/components/decor-icon";
import { MonetaryVisibilityToggle } from "@/components/monetary-visibility";
import { NavUser } from "@/components/nav-user";

export function AppHeader() {
	const navLinks = useNavLinks();
	const activeItem = navLinks.find((item) => item.isActive);

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
				"bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50",
			)}
		>
			<DecorIcon className="hidden md:block" position="bottom-left" />
			<div className="flex items-center gap-3">
				<CustomSidebarTrigger />
				<MonetaryVisibilityToggle />
				<Separator
					className="mr-2 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<AppBreadcrumbs page={activeItem ?? null} />
			</div>
			<div className="flex items-center gap-3">
				<NavUser />
			</div>
		</header>
	);
}
