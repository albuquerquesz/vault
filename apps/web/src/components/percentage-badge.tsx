"use client";

import { Badge } from "@vault/ui/components/badge";
import { cn } from "@vault/ui/lib/utils";
import type * as React from "react";

type PercentageBadgeProps = {
	value: number;
	className?: string;
};

export function PercentageBadge({
	value,
	className,
}: PercentageBadgeProps) {
	return (
		<Badge
			variant="secondary"
			className={cn(
				"rounded-full px-3 py-1 text-sm font-medium tabular-nums",
				className,
			)}
		>
			{value}%
		</Badge>
	);
}

export type { PercentageBadgeProps };
