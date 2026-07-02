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
				"rounded-full px-1.5 py-0.5 text-sm font-medium tabular-nums bg-white/10 text-white/60",
				className,
			)}
		>
			{value}%
		</Badge>
	);
}

export type { PercentageBadgeProps };
