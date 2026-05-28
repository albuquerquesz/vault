"use client";

import { cn } from "@vault/ui/lib/utils";
import { NavUser } from "@/components/nav-user";

export function AppHeader() {
	return (
		<header
			className={cn(
				"mb-6 flex items-center justify-end border-b border-border px-4 pb-3 md:px-2",
			)}
		>
			<NavUser />
		</header>
	);
}
