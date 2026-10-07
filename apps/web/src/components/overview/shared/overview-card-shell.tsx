"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
} from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import type { ReactNode } from "react";

type OverviewCardShellProps = {
	title: string;
	icon: ReactNode;
	tooltip: string;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
	contentClassName?: string;
	headerClassName?: string;
};

export function OverviewCardShell({
	title,
	icon,
	tooltip,
	children,
	footer,
	className,
	contentClassName,
	headerClassName,
}: OverviewCardShellProps) {
	return (
		<Card
			className={cn(
				"@container financial-panel-border flex h-full min-h-0 w-full flex-col ring-0 sm:min-h-[18rem] xl:min-h-[24rem]",
				className,
			)}
		>
			<CardHeader className={headerClassName}>
				<div className="flex items-center justify-between gap-2">
					<CardDescription aria-description={tooltip} className="flex items-center gap-2 text-base">
						{icon}
						<span>{title}</span>
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent className={contentClassName}>{children}</CardContent>
			{footer ? <CardFooter>{footer}</CardFooter> : null}
		</Card>
	);
}
