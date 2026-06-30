"use client";

import { cn } from "@vault/ui/lib/utils";
import { SearchIcon, SlashIcon } from "lucide-react";

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
	return (
		<header className="border-b border-white/10 bg-background">
			<div className="flex min-h-12 items-center justify-between gap-4 px-4 md:px-6">
				<div />

				<div className="flex items-center gap-2">
					<HeaderAction className="gap-2 pr-1.5">
						<SearchIcon className="size-4" />
						<div className="flex h-6 min-w-6 items-center justify-center rounded-md border border-white/10 px-1.5 text-[11px] font-medium">
							<SlashIcon className="size-3" />
						</div>
					</HeaderAction>

					<div className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900 text-xs font-semibold text-foreground">
						VA
					</div>
				</div>
			</div>
		</header>
	);
}
