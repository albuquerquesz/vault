"use client";

import { Link, useLocation } from "@tanstack/react-router";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@vault/ui/components/sheet";
import { cn } from "@vault/ui/lib/utils";
import { EllipsisIcon } from "lucide-react";
import { useState } from "react";
import { useMobileMoreLinks, useMobileTabBarLinks } from "@/components/app-shared";

export const MOBILE_BOTTOM_TAB_BAR_HEIGHT = "4rem";

const tabClassName = (isActive: boolean) =>
	cn(
		"flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent px-1 py-1 text-xs font-medium tracking-[0.01em] text-muted-foreground transition-colors",
		"hover:bg-muted/60 hover:text-foreground",
		isActive ? "border-border/60 bg-muted text-foreground" : "bg-transparent",
	);

const tabIconClassName = (isActive: boolean) =>
	cn(
		"flex size-7 items-center justify-center rounded-full",
		isActive ? "bg-background text-foreground" : "text-current",
	);

export function MobileBottomTabBar() {
	const { pathname } = useLocation();
	const tabLinks = useMobileTabBarLinks();
	const moreLinks = useMobileMoreLinks();
	const [moreOpen, setMoreOpen] = useState(false);

	const tabPaths = new Set(tabLinks.map((item) => item.path));
	// "Mais" is highlighted while on a screen that has no tab of its own.
	const moreActive = moreLinks.some(
		(item) => item.isActive && !tabPaths.has(item.path),
	);

	return (
		<>
			<nav
				aria-label="Navegação principal"
				className={cn(
					"fixed inset-x-0 bottom-0 z-[160] border-t border-border/70 bg-background/95 px-2 pb-[max(0.25rem,calc(env(safe-area-inset-bottom,0px)-0.75rem))] pt-1 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden",
				)}
			>
				<div
					className="mx-auto grid w-full max-w-md gap-1.5 sm:gap-2"
					style={{ gridTemplateColumns: `repeat(${tabLinks.length + 1}, minmax(0, 1fr))` }}
				>
					{tabLinks.map((item) => {
						const itemPath = item.path ?? "";
						const isActive =
							itemPath === "/" ? pathname === "/" : pathname.startsWith(itemPath);

						return (
							<Link
								key={item.title}
								to={itemPath}
								aria-current={isActive ? "page" : undefined}
								className={tabClassName(isActive)}
							>
								<span className={tabIconClassName(isActive)}>{item.icon}</span>
								<span className="max-w-full truncate">{item.mobileTitle ?? item.title}</span>
							</Link>
						);
					})}
					<button
						type="button"
						aria-expanded={moreOpen}
						aria-haspopup="dialog"
						className={tabClassName(moreActive)}
						onClick={() => setMoreOpen(true)}
					>
						<span className={tabIconClassName(moreActive)}>
							<EllipsisIcon className="size-5" />
						</span>
						<span>Mais</span>
					</button>
				</div>
			</nav>
			<Sheet open={moreOpen} onOpenChange={setMoreOpen}>
				<SheetContent
					className="z-[170] max-h-[85dvh] rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:hidden"
					side="bottom"
				>
					<SheetHeader>
						<SheetTitle>Todas as telas</SheetTitle>
						<SheetDescription className="sr-only">
							Escolha uma tela do Vault.
						</SheetDescription>
					</SheetHeader>
					<nav aria-label="Todas as telas" className="grid gap-1 overflow-y-auto px-3 pb-3">
						{moreLinks.map((item) => (
							<Link
								key={item.title}
								to={item.path ?? "/"}
								aria-current={item.isActive ? "page" : undefined}
								onClick={() => setMoreOpen(false)}
								className={cn(
									"flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/60",
									item.isActive && "border-border/60 bg-muted text-foreground",
								)}
							>
								<span className="flex size-6 shrink-0 items-center justify-center [&_svg]:size-5">
									{item.icon}
								</span>
								<span>{item.title}</span>
							</Link>
						))}
					</nav>
				</SheetContent>
			</Sheet>
		</>
	);
}
