"use client";

import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

type OverviewOverflowPanelProps = {
	children: ReactNode;
	className?: string;
	scrollAreaClassName?: string;
	scrollable?: boolean;
	buttonLabel?: string;
	footerAction?: ReactNode;
	blurFooter?: boolean;
	reserveFooterSpace?: boolean;
};

export function OverviewOverflowPanel({
	children,
	className,
	scrollAreaClassName,
	scrollable = true,
	buttonLabel = "Ver mais",
	footerAction,
	blurFooter = false,
	reserveFooterSpace = true,
}: OverviewOverflowPanelProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const showFooter = isOverflowing || Boolean(footerAction);

	useEffect(() => {
		const element = scrollRef.current;
		if (!element) return;

		const updateOverflow = () => {
			setIsOverflowing(element.scrollHeight - element.clientHeight > 1);
		};

		updateOverflow();

		const resizeObserver = new ResizeObserver(updateOverflow);
		resizeObserver.observe(element);

		for (const child of element.children) {
			if (child instanceof HTMLElement) {
				resizeObserver.observe(child);
			}
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, [children]);

	return (
		<div className={cn("relative min-h-0 flex-1", className)}>
			<div
				ref={scrollRef}
				className={cn(
					"min-h-0 h-full",
					scrollable ? "overflow-y-auto" : "overflow-hidden",
					showFooter && reserveFooterSpace ? "pb-14" : "",
					scrollAreaClassName,
				)}
			>
				{children}
			</div>

			{showFooter ? (
				<div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-2 pt-8">
					<div
						className={cn(
							"absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card via-card/95 to-transparent",
							blurFooter && "backdrop-blur-sm",
						)}
					/>
					{footerAction !== undefined ? (
						footerAction ? (
							<div className="pointer-events-auto relative z-10">
								{footerAction}
							</div>
						) : null
					) : (
						<Button
							className="pointer-events-auto relative text-muted-foreground"
							disabled
							size="xs"
							variant="ghost"
						>
							{buttonLabel}
						</Button>
					)}
				</div>
			) : null}
		</div>
	);
}
