import { cn } from "@vault/ui/lib/utils";
import type * as React from "react";

/**
 * Shared content column cap for `/settings` and `/transactions`.
 * Fixed at 1320px within the PRD 06 band (1200–1400px).
 */
export const PAGE_CONTENT_MAX_WIDTH_CLASS = "max-w-[1320px]";

export function PageContent({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("mx-auto w-full", PAGE_CONTENT_MAX_WIDTH_CLASS, className)}
			{...props}
		>
			{children}
		</div>
	);
}
