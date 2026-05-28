"use client";

import { Button } from "@vault/ui/components/button";
import { Separator } from "@vault/ui/components/separator";
import { cn } from "@vault/ui/lib/utils";
import { BellIcon } from "lucide-react";
import { NavUser } from "@/components/nav-user";

export function AppHeader() {
	return (
		<header
			className={cn(
				"pxx-4 mb-6 flex items-center justify-end gap-3 md:px-2",
			)}
		>
			<Button aria-label="Notifications" size="icon" variant="ghost">
				<BellIcon />
			</Button>
			<Separator
				className="h-4 data-[orientation=vertical]:self-center"
				orientation="vertical"
			/>
			<NavUser />
		</header>
	);
}
