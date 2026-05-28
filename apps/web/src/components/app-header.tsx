"use client";

import { Button } from "@vault/ui/components/button";
import { Separator } from "@vault/ui/components/separator";
import { cn } from "@vault/ui/lib/utils";
import { BellIcon } from "lucide-react";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { navLinks } from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";

const activeItem = navLinks.find((item) => item.isActive);

export function AppHeader() {
	return (
		<header
			className={cn(
				"pxx-4 mb-6 flex items-center justify-between gap-2 md:px-2",
			)}
		>
			<div className="flex items-center gap-3">
				<AppBreadcrumbs page={activeItem} />
			</div>
			<div className="flex items-center gap-3">
				<Button aria-label="Notifications" size="icon" variant="ghost">
					<BellIcon />
				</Button>
				<Separator
					className="h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				<NavUser />
			</div>
		</header>
	);
}
