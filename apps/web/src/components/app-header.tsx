"use client";

import { cn } from "@vault/ui/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { NavUser } from "@/components/nav-user";

export function AppHeader() {
	return (
		<header
			className={cn(
				"mb-6 flex items-center justify-end gap-2 border-b border-border px-4 pb-3 md:px-2",
			)}
		>
			<ModeToggle />
			<NavUser />
		</header>
	);
}
