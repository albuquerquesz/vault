import { cn } from "@vault/ui/lib/utils";
import { NavUser } from "@/components/nav-user";

export function AppHeader() {
	return (
		<header
			className={cn(
				"sticky top-0 z-50 mt-2 flex min-h-14 shrink-0 items-center justify-end gap-2 px-3 pt-[env(safe-area-inset-top,0px)] sm:px-4 md:px-6",
				"bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 dark:bg-[oklch(0.178_0.005_285)] dark:backdrop-blur-none",
			)}
		>
			<div className="flex shrink-0 items-center gap-2 sm:gap-3">
				<NavUser />
			</div>
		</header>
	);
}
