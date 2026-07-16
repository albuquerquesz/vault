"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@vault/ui/lib/utils";
import { useMobileTabBarLinks } from "@/components/app-shared";

export const MOBILE_BOTTOM_TAB_BAR_HEIGHT = "5.5rem";

export function MobileBottomTabBar() {
	const { pathname } = useLocation();
	const navLinks = useMobileTabBarLinks();

	return (
		<nav
			aria-label="Navegação principal"
			className={cn(
				"fixed inset-x-0 bottom-0 z-[160] border-t border-border/70 bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden",
			)}
		>
			<div className="mx-auto grid w-full max-w-md grid-cols-2 gap-2">
				{navLinks.map((item) => {
					const itemPath = item.path ?? "";
					const isActive =
						itemPath === "/" ? pathname === "/" : pathname.startsWith(itemPath);

					return (
						<Link
							key={item.title}
							to={itemPath}
							className={cn(
								"flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-transparent px-3 py-2 text-[11px] font-medium tracking-[0.01em] text-muted-foreground transition-colors",
								"hover:bg-muted/60 hover:text-foreground",
								isActive
									? "border-border/60 bg-muted text-foreground"
									: "bg-transparent",
							)}
						>
							<span
								className={cn(
									"flex size-8 items-center justify-center rounded-full",
									isActive ? "bg-background text-foreground" : "text-current",
								)}
							>
								{item.icon}
							</span>
							<span>{item.title}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
