"use client";

import { CardDescription } from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
import type { ReactNode } from "react";
import { FinancialPanel } from "@/components/shared/financial-panel";

type OverviewCardShellProps = {
	/** Render the card without its title row. */
	hideHeader?: boolean;
	title: string;
	icon: ReactNode;
	tooltip: string;
	children: ReactNode;
	footer?: ReactNode;
	footerClassName?: string;
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
	footerClassName,
	className,
	contentClassName,
	headerClassName,
	hideHeader = false,
}: OverviewCardShellProps) {
	return (
		<FinancialPanel
			className={cn(
				"@container h-full min-h-0 sm:min-h-[18rem] xl:min-h-[24rem]",
				className,
			)}
			headerClassName={headerClassName}
			contentClassName={contentClassName}
			footer={footer}
			footerClassName={footerClassName}
			header={
				hideHeader ? undefined : (
					<div className="flex items-center justify-between gap-2">
						<CardDescription
							aria-description={tooltip}
							className="flex items-center gap-2 text-base"
						>
							{icon}
							<span>{title}</span>
						</CardDescription>
					</div>
				)
			}
		>
			{children}
		</FinancialPanel>
	);
}
