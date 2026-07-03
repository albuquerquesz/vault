import { Card } from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import type * as React from "react";

export function DashboardCard({
	className,
	...props
}: React.ComponentProps<typeof Card>) {
	return (
		<Card
			className={cn(
				"rounded-none bg-transparent shadow-none ring-0",
				className,
			)}
			{...props}
		/>
	);
}
