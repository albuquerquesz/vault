"use client";

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import type { ReactNode } from "react";

type FinancialPanelProps = {
	header?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
	footerClassName?: string;
};

/** Shared neutral analytical surface used by finance pages. */
export function FinancialPanel({
	header,
	children,
	footer,
	className,
	headerClassName,
	contentClassName,
	footerClassName,
}: FinancialPanelProps) {
	return (
		<Card
			className={cn(
				"financial-panel-border flex min-h-0 w-full flex-col rounded-2xl bg-card ring-0",
				className,
			)}
		>
			{header ? <CardHeader className={headerClassName}>{header}</CardHeader> : null}
			<CardContent className={contentClassName}>{children}</CardContent>
			{footer ? <CardFooter className={footerClassName}>{footer}</CardFooter> : null}
		</Card>
	);
}
