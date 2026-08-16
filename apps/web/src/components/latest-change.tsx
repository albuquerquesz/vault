"use client";

import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { XIcon } from "lucide-react";
import { useState } from "react";

const latestChange = {
	badge: "CHANGELOG",
	title: "Product update",
	description: "Performance boosts and UI polish.", // TIP: Use a single line of text for the description. (max 5 words)
	readMore: { href: "#", label: "Learn more" },
} as const;

export function LatestChange() {
	const [isOpen, setIsOpen] = useState(true);

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className={cn(
				"group/latest-change size-full min-h-27 justify-center border-t",
				"relative flex size-full min-w-0 flex-col gap-1 overflow-visible px-4 py-3",
				"transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0",
			)}
		>
			<span className="font-light font-mono text-xs text-muted-foreground">
				{latestChange.badge}
			</span>
			<p className="font-medium text-sm">{latestChange.title}</p>
			<span className="text-xs text-muted-foreground">
				{latestChange.description}
			</span>
			<Button
				className="w-max px-0 font-light text-xs"
				size="sm"
				variant="link"
				render={<a href={latestChange.readMore.href} />}
				nativeButton={false}
			>
				{latestChange.readMore.label}
			</Button>
			<Button
				className="absolute top-2 right-2 z-10 size-7 rounded-full opacity-100 transition-opacity md:opacity-0 md:group-hover/latest-change:opacity-100 md:focus-visible:opacity-100"
				onClick={() => setIsOpen(false)}
				size="icon-sm"
				variant="ghost"
			>
				<XIcon className="size-3.5 text-muted-foreground" />{" "}
			</Button>
		</div>
	);
}
