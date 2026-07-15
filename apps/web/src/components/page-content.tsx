import { cn } from "@vault/ui/lib/utils";
import type * as React from "react";

/**
 * Shared content column cap for `/settings` and `/transactions`.
 * Fixed at 1200px.
 */
export const PAGE_CONTENT_MAX_WIDTH_CLASS = "max-w-[1200px]";

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
