"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@vault/ui/lib/utils";
import { useMobileTabBarLinks } from "@/components/app-shared";

export const MOBILE_BOTTOM_TAB_BAR_HEIGHT = "4.5rem";

export function MobileBottomTabBar() {
	const { pathname } = useLocation();
	const navLinks = useMobileTabBarLinks();

	return (
		<nav
			aria-label="Navegação principal"
			className={cn(
				"fixed inset-x-0 bottom-0 z-[160] border-t border-border/70 bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1.5 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden",
			)}
		>
			<div className="mx-auto grid w-full max-w-md grid-cols-3 gap-1.5 sm:gap-2">
				{navLinks.map((item) => {
					const itemPath = item.path ?? "";
					const isActive =
						itemPath === "/" ? pathname === "/" : pathname.startsWith(itemPath);

					return (
						<Link
							key={item.title}
							to={itemPath}
							className={cn(
								"flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent px-3 py-1.5 text-xs font-medium tracking-[0.01em] text-muted-foreground transition-colors",
								"hover:bg-muted/60 hover:text-foreground",
								isActive
									? "border-border/60 bg-muted text-foreground"
									: "bg-transparent",
							)}
						>
							<span
								className={cn(
									"flex size-7 items-center justify-center rounded-full",
									isActive ? "bg-background text-foreground" : "text-current",
								)}
							>
								{item.icon}
							</span>
							<span>{item.mobileTitle ?? item.title}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
