"use client";

import { useRouterState } from "@tanstack/react-router";
import { cn } from "@vault/ui/lib/utils";
import { BellIcon, SearchIcon, SlashIcon } from "lucide-react";
import { navLinks } from "@/components/app-shared";

function resolvePage(pathname: string) {
	const match =
		navLinks.find((item) => item.path === pathname) ??
		navLinks.find((item) => item.path && pathname.startsWith(item.path) && item.path !== "/");

	if (match) {
		return {
			title: match.title,
			icon: match.icon ?? null,
		};
	}

	return {
		title: "Vault",
		icon: null,
	};
}

function HeaderAction({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex h-9 items-center rounded-xl border border-white/10 bg-background px-3 text-muted-foreground",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function AppTopHeader() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const page = resolvePage(pathname);

	return (
		<header className="border-b border-border/70 bg-background">
			<div className="flex min-h-12 items-center justify-between gap-4 px-4 md:px-6">
				<div className="flex min-w-0 items-center gap-3">
					<span className="text-muted-foreground [&>svg]:size-4">{page.icon}</span>
					<span className="truncate text-sm font-medium text-foreground">
						{page.title}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<HeaderAction className="gap-2 pr-1.5">
						<SearchIcon className="size-4" />
						<div className="flex h-6 min-w-6 items-center justify-center rounded-md border border-white/10 px-1.5 text-[11px] font-medium">
							<SlashIcon className="size-3" />
						</div>
					</HeaderAction>

					<div className="relative">
						<HeaderAction className="w-9 justify-center px-0">
							<BellIcon className="size-4" />
						</HeaderAction>
						<span className="absolute top-1 right-1 size-2 rounded-full bg-white" />
					</div>

					<div className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900 text-xs font-semibold text-foreground">
						VA
					</div>
				</div>
			</div>
		</header>
	);
}
