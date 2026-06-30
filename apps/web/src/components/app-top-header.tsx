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
				"flex h-11 items-center rounded-xl border border-white/10 bg-background px-4 text-muted-foreground",
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
			<div className="flex min-h-14 items-center justify-between gap-4 px-4 md:px-6">
				<div />

				<div className="flex items-center gap-3">
					<HeaderAction className="gap-2.5 pr-2">
						<SearchIcon className="size-4.5" />
						<div className="flex h-7 min-w-7 items-center justify-center rounded-md border border-white/10 px-1.5 text-xs font-medium">
							<SlashIcon className="size-3.5" />
						</div>
					</HeaderAction>

					<div className="flex size-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900 text-sm font-semibold text-foreground">
						VA
					</div>
				</div>
			</div>
		</header>
	);
}
