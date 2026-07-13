"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
} from "@vault/ui/components/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@vault/ui/components/tooltip";
import { cn } from "@vault/ui/lib/utils";
import { Info } from "lucide-react";
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
				"financial-panel-border flex h-full min-h-[24rem] w-full flex-col ring-0",
				className,
			)}
		>
			<CardHeader className={cn("border-b", headerClassName)}>
				<div className="flex items-center justify-between gap-2">
					<CardDescription className="flex items-center gap-2 text-base">
						{icon}
						<span>{title}</span>
					</CardDescription>
					<Tooltip>
						<TooltipTrigger
							render={() => <Info className="mt-0.5 size-4 text-muted-foreground" />}
						/>
						<TooltipContent>{tooltip}</TooltipContent>
					</Tooltip>
				</div>
			</CardHeader>
			<CardContent className={contentClassName}>{children}</CardContent>
			{footer ? <CardFooter>{footer}</CardFooter> : null}
		</Card>
	);
}
